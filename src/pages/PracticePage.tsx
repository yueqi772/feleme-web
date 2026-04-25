import { useState, useEffect, useRef } from 'react';
import type { PracticeScenario } from '../types';
import { useApp } from '../context/AppContext';
import { getPracticeFeedback } from '../utils';
import { callAIStream, cloudSavePracticeRecord } from '../cloud/sync';
import type { AIMessage } from '../cloud/sync';

interface PracticePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  scenario: PracticeScenario;
}

const TOTAL_ROUNDS = 5;

function buildSystemPrompt(scenario: PracticeScenario): string {
  return `你是"王总"，一家互联网公司的部门总监。你正在对员工小林施加职场压力（PUA）。

场景：「${scenario.title}」—— ${scenario.intro}

你的风格：
- 语气强硬、居高临下，经常否定员工的价值
- 常用手段：否定成绩、制造焦虑、利用权力压制
- 说话简短、命令式，经常在深夜或休息日发消息
- 会煤气灯效应，让员工怀疑自己

重要规则：
- 每次只输出你这一轮要说的新内容，不要重复之前说过的话
- 不超过50字，保持角色，直接输出对话内容。`;
}

function buildAnalysisPrompt(
  scenario: PracticeScenario,
  history: Array<{ role: string; content: string }>,
): string {
  const turns = history
    .filter(m => m.role === 'user')
    .map((m, i) => `第${i + 1}回合你的回应：「${m.content}」`)
    .join('\n');

  return `你是职场心理顾问，正在为一名遭遇PUA的职场人做练习复盘。

练习场景：「${scenario.title}」
场景描述：${scenario.intro}

对话记录：
${turns}

请输出200字以内的分析，要求温暖、支持性强，包含三部分：
1. ✅ 做得好的地方（具体指出哪些回应比较好，为什么）
2. 💡 可以提升的地方（不要批判，而是温和建议）
3. 🗣️ 给这段对话的专属建议（一句有力的话）

格式清晰，语言温暖真挚。`;
}

const FALLBACK_RESPONSES = [
  '我不管你有什么安排，今天必须完成。',
  '你这么说就是在推卸责任，大家都能加班就你特殊？',
  '你要是不想做，随时可以走人，我不缺人。',
  '我再给你一次机会，明天早上之前我要看到结果。',
  '这不是商量，是通知。',
];

function getFallback(r: number): string {
  return FALLBACK_RESPONSES[r - 1] || '我听到了，但希望你能再考虑考虑。';
}

function scoreResponses(messages: Array<{ role: string; content: string }>): { score: number; label: string } {
  const userMsgs = messages.filter(m => m.role === 'user');
  const text = userMsgs.map(m => m.content).join('');
  const good = ['谢谢', '理解', '可以', '好的', '我明白', '请问', '想了解', '边界', '时间', '安排', '考虑', '希望', '希望您', '想请教'];
  const bad = ['好的收到', '马上', '立刻', '没问题', '我错了', '对不起（过度）', '都行', '都可以'];
  let score = 50;
  good.forEach(g => { if (text.includes(g)) score += 8; });
  bad.forEach(b => { if (text.includes(b)) score -= 10; });
  score = Math.max(0, Math.min(100, score));
  const label = score >= 70 ? '边界清晰' : score >= 40 ? '有所保留' : '过度顺从';
  return { score, label };
}


export default function PracticePage({ onNavigate, scenario }: PracticePageProps) {
  const { incrementPracticeCount, unlockAchievement, practiceCount } = useApp();
  const [step, setStep] = useState<'intro' | 'chat' | 'feedback'>('intro');
  const [round, setRound] = useState(0);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [apiError, setApiError] = useState('');
  // feedback step data
  const [localFeedback, setLocalFeedback] = useState<ReturnType<typeof getPracticeFeedback> | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisStreamText, setAnalysisStreamText] = useState('');
  const cancelAIRef = useRef<AbortController | null>(null);

  // callAIStream 是直接 HTTP 调用，不再需要检测小程序环境
  // 保留此标记仅用于展示「AI 已就绪」的提示
  const [aiReady, setAiReady] = useState(false);

  useEffect(() => {
    // AI 直接通过 @cloudbase/js-sdk 调用，只要 SDK 初始化就可用
    setAiReady(true);
  }, []);

  function doStart() {
    setStep('chat');
    setRound(1);
    setMessages([{ role: 'ai', content: scenario.messages[0].content }]);
    setInput('');
    setLocalFeedback(null);
    setAiAnalysis('');
    setAnalysisStreamText('');
    setApiError('');
    setStreamingText('');
  }

  function showFeedback(userMsg: string) {
    const fb = getPracticeFeedback(userMsg);
    setLocalFeedback(fb);
    const newCount = practiceCount + 1;
    incrementPracticeCount();
    if (newCount >= 5) unlockAchievement('a1');
    if (newCount >= 20) unlockAchievement('a6');

    setStep('feedback');

    // 快照当前对话记录和得分（用于保存，messages state 后续可能变化）
    const snapshotMessages = [...messages];
    const { score, label: scoreLabel } = scoreResponses(messages);
    const finishedAt = Date.now();

    // AI 分析（直接调用云开发 AI）
    setAnalysisLoading(true);
    setAnalysisStreamText('');
    const analysisSystemPrompt = '你是一名温暖的职场心理顾问，擅长分析PUA场景下的应对方式，语言温暖、支持性强。请直接输出分析内容，不要加时间、问候等无关开场白。';
    const historyForAnalysis: AIMessage[] = [
      { role: 'user', content: buildAnalysisPrompt(scenario, messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }))) },
    ];

    let accAnalysis = '';
    callAIStream(
      historyForAnalysis,
      {
        onChunk: (_chunk, acc) => {
          accAnalysis = acc || '';
          setAnalysisStreamText(acc || '');
        },
        onDone: (fullText) => {
          const analysisText = fullText || accAnalysis;
          setAiAnalysis(analysisText);
          setAnalysisStreamText('');
          setAnalysisLoading(false);

          // AI 分析完成后，保存完整练习记录到云端
          console.log('[practice] AI分析完成，准备保存记录（含AI分析）');
          cloudSavePracticeRecord({
            scenarioId: scenario.id,
            scenarioTitle: scenario.title,
            scenarioIcon: scenario.icon,
            difficulty: scenario.difficulty,
            messages: snapshotMessages,
            score,
            scoreLabel,
            aiAnalysis: analysisText,
            finishedAt,
          }).catch(err => console.error('[practice] ❌ 保存练习记录异常:', err));
        },
        onError: () => {
          setAiAnalysis('');
          setAnalysisStreamText('');
          setAnalysisLoading(false);

          // AI 分析失败时，仍然保存练习记录（aiAnalysis 为空）
          console.log('[practice] AI分析失败，仍准备保存记录（aiAnalysis为空）');
          cloudSavePracticeRecord({
            scenarioId: scenario.id,
            scenarioTitle: scenario.title,
            scenarioIcon: scenario.icon,
            difficulty: scenario.difficulty,
            messages: snapshotMessages,
            score,
            scoreLabel,
            aiAnalysis: '',
            finishedAt,
          }).catch(err => console.error('[practice] ❌ 保存练习记录异常:', err));
        },
      },
      analysisSystemPrompt,
    ).then(ctrl => { cancelAIRef.current = ctrl; });
  }

  function submitAnswer() {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setStreamingText('');
    setApiError('');

    // ─── 云开发 AI 流式对话（直接 HTTP，无需 postMessage）─────────────────
    // 传完整对话历史（user/assistant 交替）让 AI 有上下文
    // 规则：跳过开头的 ai 开场白，确保从 user 开始、user/assistant 严格交替
    const allMapped: AIMessage[] = newMessages.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }));
    const firstUserIdx = allMapped.findIndex(m => m.role === 'user');
    const history: AIMessage[] = [];
    if (firstUserIdx >= 0) {
      let expectRole: 'user' | 'assistant' = 'user';
      for (let i = firstUserIdx; i < allMapped.length; i++) {
        if (allMapped[i].role === expectRole) {
          history.push(allMapped[i]);
          expectRole = expectRole === 'user' ? 'assistant' : 'user';
        }
      }
      // 确保最后一条是 user
      while (history.length > 0 && history[history.length - 1].role === 'assistant') {
        history.pop();
      }
    }

    let streamAccumulated = '';

    callAIStream(
      history,
      {
        onChunk: (_chunk, acc) => {
          streamAccumulated = acc || '';
          setStreamingText(acc || '');
        },
        onDone: (fullText) => {
          const reply = fullText || streamAccumulated || getFallback(round);
          setStreamingText('');
          setIsTyping(false);
          if (round < TOTAL_ROUNDS) {
            setMessages([...newMessages, { role: 'ai' as const, content: reply }]);
            setRound(r => r + 1);
          } else {
            setMessages([...newMessages, { role: 'ai' as const, content: reply }]);
            setRound(r => r + 1);
            setTimeout(() => showFeedback(userMsg), 1500);
          }
        },
        onError: (error) => {
          const fallback = getFallback(round);
          setStreamingText('');
          setIsTyping(false);
          setMessages([...newMessages, { role: 'ai' as const, content: fallback }]);
          setApiError(`AI调用失败（已切换本地模式）：${error}`);
          if (round < TOTAL_ROUNDS) {
            setRound(r => r + 1);
          } else {
            setTimeout(() => showFeedback(userMsg), 1500);
          }
        },
      },
      buildSystemPrompt(scenario),
    ).then(ctrl => { cancelAIRef.current = ctrl; });
  }

  // ── Feedback Step ────────────────────────────────────
  if (step === 'feedback') {
    const { score, label } = scoreResponses(messages);
    const scoreColor = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
    const scoreBg = score >= 70 ? 'bg-green-50' : score >= 40 ? 'bg-amber-50' : 'bg-red-50';

    const displayAnalysis = aiAnalysis || analysisStreamText;

    return (
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <button onClick={() => setStep('intro')} className="text-gray-400 text-sm">‹ 返回</button>
          <p className="text-sm font-semibold text-gray-700">练习报告</p>
          <div className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-6">
          {/* Score card */}
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-3">职场边界评分</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
              <div className="text-left">
                <p className={`text-sm font-bold ${scoreColor}`}>{label}</p>
                <p className="text-xs text-gray-400">/100</p>
              </div>
            </div>
            <div className={`rounded-full h-2 ${scoreBg} mt-2`}>
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* AI Analysis */}
          {(analysisLoading || displayAnalysis) && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <p className="text-sm font-semibold text-gray-700">AI 逐轮分析</p>
                {analysisLoading && (
                  <span className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
              {displayAnalysis ? (
                <div className="prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {displayAnalysis.split('\n').map((line, i) => {
                    if (!line.trim()) return null;
                    return (
                      <p key={i} className="mb-1" style={{ fontSize: '13px' }}>
                        {line}
                      </p>
                    );
                  })}
                  {analysisLoading && (
                    <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + i * 8}%` }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Local feedback (always show) */}
          {localFeedback && (
            <>
              <div className="card bg-green-50 border border-green-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-green-500">✅</span>
                  <p className="text-sm font-semibold text-green-700">做得好</p>
                </div>
                <p className="text-sm text-green-700 leading-relaxed">{localFeedback.good}</p>
              </div>

              <div className="card bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-blue-500">💡</span>
                  <p className="text-sm font-semibold text-blue-700">可以更好</p>
                </div>
                <p className="text-sm text-blue-700 leading-relaxed">{localFeedback.better}</p>
              </div>

              <div className="card bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-amber-500">📝</span>
                  <p className="text-sm font-semibold text-amber-700">参考话术</p>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed italic">{localFeedback.script}</p>
              </div>
            </>
          )}

          {/* Conversation summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">对话回顾</p>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {messages.filter(m => m.role === 'user').map((m, i) => (
                <div key={i} className="flex gap-2">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#07c160] flex items-center justify-center text-white text-[10px] font-bold">我</div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5">第{i + 1}回合</p>
                    <p className="text-sm text-gray-700">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button onClick={() => setStep('intro')} className="w-full btn-secondary py-3">
            ← 重新练习
          </button>
          <button onClick={() => onNavigate('tools')} className="w-full text-sm text-gray-400 text-center py-1">
            返回工具箱
          </button>
        </div>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <button onClick={() => onNavigate('tools')} className="text-gray-400 text-sm">‹ 返回</button>
          <div className="flex items-center gap-1">
            <span className="text-lg">{scenario.icon}</span>
            <span className="text-sm font-semibold text-gray-700">{scenario.title}</span>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <span className="text-5xl mb-4">{scenario.icon}</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{scenario.title}</h2>
          <div className="flex items-center gap-1 mb-4">
            <span className="text-xs text-gray-400">难度</span>
            {[1, 2, 3].map(d => (
              <span key={d} className={`text-sm ${d <= scenario.difficulty ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">{scenario.intro}</p>
          <p className="text-xs text-gray-400 text-center mb-6">
            AI将扮演施加压力的一方，你需要学会用恰当的方式回应。
            <br />共{TOTAL_ROUNDS}回合，完成后获得详细反馈报告。
          </p>

          <div className="w-full max-w-xs space-y-3">
  
            <button onClick={doStart} className="btn-primary w-full">
              🚀 开始练习
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2 border-b border-gray-100 sticky top-0 z-20">
        <button onClick={() => setStep('intro')} className="text-gray-400 text-sm">‹ 返回</button>
        <div className="flex items-center gap-1">
          <span className="text-lg">{scenario.icon}</span>
          <span className="text-sm font-semibold text-gray-700">{scenario.title}</span>
        </div>
        <span className="text-xs text-gray-400">回合 {Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</span>
      </div>

      {apiError && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5">
          <p className="text-xs text-amber-600">{apiError}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#07c160] text-white rounded-br-sm'
                  : 'bg-white text-gray-700 rounded-bl-sm shadow-sm border border-gray-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* 流式输出气泡 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[80%] text-sm leading-relaxed text-gray-700">
              {streamingText ? (
                <>
                  {streamingText}
                  <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                </>
              ) : (
                <div className="flex gap-1 py-0.5">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {round <= TOTAL_ROUNDS && (
        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder="输入你的回应..."
              className="input-field flex-1"
            />
            <button
              onClick={submitAnswer}
              disabled={!input.trim() || isTyping}
              className="btn-primary px-5 disabled:opacity-40"
            >
              →
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">尝试设立你的边界，AI会给你反馈</p>
        </div>
      )}
    </div>
  );
}
