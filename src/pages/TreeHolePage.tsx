import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EMOTION_MAP } from '../data';
import { generateId } from '../utils';
import type { EmotionType, AiRole } from '../types';

interface TreeHolePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const EMOTIONS: EmotionType[] = ['愤怒', '委屈', '焦虑', '失落', '麻木'];
const EVENT_TYPES = ['被否定', '被孤立', '被威胁', '画大饼', '边界侵犯'];
const AI_ROLES: { id: AiRole; icon: string; label: string }[] = [
  { id: '温柔倾听者', icon: '🤗', label: '温柔' },
  { id: '理性分析师', icon: '🧠', label: '理性' },
  { id: '行动教练', icon: '💪', label: '行动' },
];

export default function TreeHolePage({ onNavigate: _onNavigate }: TreeHolePageProps) {
  const { diaries, saveDiary, unlockAchievement } = useApp();
  const [step, setStep] = useState<'list' | 'write' | 'chat'>('list');
  const [emotion, setEmotion] = useState<EmotionType | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private');
  const [currentDiaryId, setCurrentDiaryId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [aiRole, setAiRole] = useState<AiRole>('温柔倾听者');
  const [isTyping, setIsTyping] = useState(false);

  const currentDiary = diaries.find(d => d.id === currentDiaryId);

  function submitDiary() {
    if (!emotion || !content.trim()) return;
    const id = generateId();
    const diary = {
      id, date: new Date().toISOString().slice(0, 10),
      emotion, events, content, privacy, messages: [],
    };
    saveDiary(diary);
    unlockAchievement('a3');
    setCurrentDiaryId(id);
    setChatMessages([{ role: 'ai', content: getAIGreeting(emotion, aiRole, content) }]);
    setStep('chat');
  }

  function getAIGreeting(em: EmotionType, role: AiRole, userContent: string): string {
    // Extract a short snippet from the content
    const snippet = userContent.length > 40 ? userContent.slice(0, 40) + '…' : userContent;
    const greetings: Record<AiRole, string> = {
      '温柔倾听者': `${EMOTION_MAP[em]} 我在这里，收到了你说的：「${snippet}」${em === '愤怒' ? '听起来你真的很受委屈。' : em === '焦虑' ? '我能感受到你的紧张。' : '我能理解这件事让你有多难受。'}想继续说吗？我在这里听。`,
      '理性分析师': `${EMOTION_MAP[em]} 收到你的记录：「${snippet}」这种情况确实值得认真梳理。让我先确认几个关键细节，帮你把事情看清楚一些。`,
      '行动教练': `${EMOTION_MAP[em]} 收到了。「${snippet}」——基于你描述的情况，我的第一个建议是：先不要急着做决定，我们可以先聊清楚你想要什么结果。`,
    };
    return greetings[role];
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    const newMsgs = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const resp = generateAIResponse(currentDiary?.emotion || '愤怒', aiRole, userMsg, chatMessages);
      setChatMessages(m => [...m, { role: 'ai' as const, content: resp }]);
    }, 1500);
  }

  function generateAIResponse(emotion: EmotionType, role: AiRole, _userMsg: string, history: Array<{ role: string; content: string }>): string {
    const prev = history.filter(m => m.role === 'user').slice(-2).join(' ');
    if (role === '理性分析师') {
      if (prev.length > 50) return '继续说。我在听。';
      return '你描述的情况里有几个关键细节我想确认：对方是在什么场景下这样说的？除了这一次，之前有类似的情况吗？';
    }
    if (role === '行动教练') {
      if (history.length < 3) return '好的，收到了。现在，你打算怎么处理这件事？';
      return '基于你说的情况，我的建议是：今晚先给自己一个放松，不要急着做决定。明天清醒的时候，我们可以再梳理一下。';
    }
    const pools: Record<string, string[]> = {
      '愤怒': ['我听到了。这种被压制的感觉真的很让人愤怒。', '你有权感到愤怒。不要压抑它。', '那种被不公正对待的感觉，我完全能理解。'],
      '委屈': ['你明明很努力，却被这样对待，这种委屈是真实的。', '我很心疼你经历这些。你值得被尊重。', '这种不被理解的感觉，真的很让人难过。'],
      '焦虑': ['这件事的不确定性确实会让人焦虑。你已经很努力了。', '先深呼吸。我在这里陪着你。', '焦虑是因为你在乎，这也是你认真负责的证明。'],
      '失落': ['被这样对待之后感到失落，这是很自然的反应。', '我知道那种"为什么是我"的感觉。你不是一个人。', '低落的时候，允许自己休息。'],
      '麻木': ['有时候，大脑会用麻木来保护你。不要责怪自己。', '什么感觉都没有，也是一种感觉。这是你在保护自己。', '慢慢来。你不需要强迫自己有感觉。'],
    };
    const pool = pools[emotion] || pools['失落'];
    return pool[Math.floor(Math.random() * pool.length)] + ' 愿意继续说吗？我在这里。';
  }

  function openChat(diaryId: string) {
    setCurrentDiaryId(diaryId);
    const d = diaries.find(dd => dd.id === diaryId);
    if (d) {
      setChatMessages(
        d.messages.length > 0
          ? (d.messages as unknown as Array<{ role: 'user' | 'ai'; content: string }>)
          : [{ role: 'ai', content: getAIGreeting(d.emotion, aiRole, d.content) }]
      );
    }
    setStep('chat');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">


      {/* ── List ─────────────────────────────────── */}
      {step === 'list' && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <button
            onClick={() => { setStep('write'); setEmotion(null); setEvents([]); setContent(''); }}
            className="card w-full flex items-center gap-3 active:scale-[0.99] transition-transform px-4 py-4"
          >
            <div className="w-11 h-11 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 ml-0.5">
              ✏️
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-700">向树洞倾诉</p>
              <p className="text-xs text-gray-400 mt-0.5">写下今天发生的事，AI陪你聊聊</p>
            </div>
            <span className="text-brand-300 text-lg font-medium">›</span>
          </button>

          {diaries.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">历史记录</p>
              {diaries.map(d => (
                <button
                  key={d.id}
                  onClick={() => openChat(d.id)}
                  className="card w-full text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{EMOTION_MAP[d.emotion]}</span>
                      <span className="text-xs text-gray-400">{d.date}</span>
                    </div>
                    <span className={`tag text-[10px] ${d.privacy === 'private' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-500'}`}>
                      {d.privacy === 'private' ? '🔒 私密' : '📢 公开'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{d.content}</p>
                  <p className="text-xs text-gray-300 mt-1.5">{d.messages.length} 条对话</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              {/* Large illustrated CTA */}
              <div className="w-full bg-gradient-to-br from-brand-50 to-blue-50 rounded-2xl p-6 text-center mb-4 border border-brand-100">
                <div className="text-5xl mb-3">🌳</div>
                <p className="text-sm font-semibold text-gray-700 mb-1">还没有日记</p>
                <p className="text-xs text-gray-400 leading-relaxed">把今天发生的事写下来<br/>AI会在这里陪你聊聊</p>
                <button
                  onClick={() => setStep('write')}
                  className="mt-4 inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
                >
                  <span>✏️</span>
                  写第一篇日记
                </button>
              </div>
              {/* Hint cards */}
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { icon: '🤗', text: '被否定时' },
                  { icon: '😰', text: '被施压时' },
                  { icon: '😢', text: '委屈时' },
                  { icon: '😔', text: '低落时' },
                ].map(item => (
                  <button
                    key={item.text}
                    onClick={() => { setStep('write'); }}
                    className="bg-white rounded-xl py-3 px-4 text-center border border-gray-100 active:scale-95 transition-transform"
                  >
                    <div className="text-xl mb-0.5">{item.icon}</div>
                    <p className="text-[11px] text-gray-400">{item.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Write ────────────────────────────────── */}
      {step === 'write' && (
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pt-4 pb-6">
          {/* Emotion */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">今天感觉怎么样？</p>
            <div className="flex justify-between gap-1">
              {EMOTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmotion(e)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                  style={{
                    background: emotion === e ? '#e0f2fe' : '#f9fafb',
                    border: emotion === e ? '2px solid #3b82f6' : '2px solid transparent',
                  }}
                >
                  <span className="text-2xl">{EMOTION_MAP[e]}</span>
                  <span className="text-[11px]" style={{ color: emotion === e ? '#1d4ed8' : '#9ca3af' }}>{e}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event tags */}
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">发生了什么？（可多选）</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(e => (
                <button
                  key={e}
                  onClick={() => setEvents(ev => ev.includes(e) ? ev.filter(x => x !== e) : [...ev, e])}
                  className={`tag text-xs transition-colors ${events.includes(e)
                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                    : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {events.includes(e) ? '✓ ' : '+ '}{e}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="card">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="把想说的都写下来吧..."
              maxLength={500}
              rows={6}
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none leading-relaxed"
            />
            <p className="text-xs text-gray-300 text-right mt-1">{content.length}/500</p>
          </div>

          {/* Privacy */}
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 mb-2">发布到</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPrivacy('private')}
                className={`flex-1 py-2.5 rounded-xl text-sm border-2 transition-colors ${privacy === 'private'
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-400'
                }`}
              >
                🔒 仅自己可见
              </button>
              <button
                onClick={() => setPrivacy('public')}
                className={`flex-1 py-2.5 rounded-xl text-sm border-2 transition-colors ${privacy === 'public'
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-400'
                }`}
              >
                📢 投稿到社区
              </button>
            </div>
          </div>

          <button
            onClick={submitDiary}
            disabled={!emotion || !content.trim()}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            向树洞倾诉
          </button>
        </div>
      )}

      {/* ── Chat ──────────────────────────────────── */}
      {step === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Role switcher */}
          <div className="bg-white border-b border-gray-100 px-4 py-2 shrink-0">
            <div className="flex gap-2 justify-center">
              {AI_ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setAiRole(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${aiRole === r.id
                    ? 'bg-brand-50 border-brand-300 text-brand-600'
                    : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-3">
            {/* Diary content as context block */}
            {currentDiary && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-2">
                <p className="text-[10px] text-blue-400 font-medium mb-1 uppercase tracking-wide">你写下的日记</p>
                <p className="text-sm text-blue-800 leading-relaxed italic">"{currentDiary.content}"</p>
                <p className="text-[10px] text-blue-300 mt-1">{currentDiary.date} · {EMOTION_MAP[currentDiary.emotion]}</p>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#07c160] text-white rounded-br-sm'
                      : 'bg-white text-gray-700 shadow-sm rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(d => (
                      <span
                        key={d}
                        className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 shrink-0">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="继续说..."
                className="input-field flex-1"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || isTyping}
                className="btn-primary px-5 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
