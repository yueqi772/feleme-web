import { useState } from 'react';

interface LeaveDecisionPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const QUESTIONS = [
  { q: '过去一个月，你有多少天因为工作而失眠或焦虑？', options: ['几乎没有', '几天', '一半以上', '几乎每天'] },
  { q: '你的身体是否出现了与工作压力相关的症状（头痛、胃痛、心悸等）？', options: ['没有', '偶尔', '经常', '非常频繁'] },
  { q: '你对目前工作的热情和积极性如何？', options: ['很有热情', '有一些', '很少', '完全没有'] },
  { q: '如果继续留在这家公司，未来1-2年你的职业发展如何？', options: ['很有前景', '一般', '不好说', '没有前景'] },
  { q: '你的家人/朋友怎么看待你的工作状态？', options: ['很支持', '有点担心', '劝我换工作', '强烈建议离职'] },
];

const SCORE_MAP: Record<string, number> = {
  '几乎没有': 1, '几天': 2, '一半以上': 3, '几乎每天': 4,
  '没有': 1, '偶尔': 2, '经常': 3, '非常频繁': 4,
  '很有热情': 1, '有一些': 2, '很少': 3, '完全没有': 4,
  '很有前景': 1, '一般': 2, '不好说': 3, '没有前景': 4,
  '很支持': 1, '有点担心': 2, '劝我换工作': 3, '强烈建议离职': 4,
};

export default function LeaveDecisionPage({ onNavigate }: LeaveDecisionPageProps) {
  const [step, setStep] = useState<'intro' | 'questions' | 'result'>('intro');
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  function start() { setStep('questions'); setAnswers([]); setCurrentQ(0); }

  function answer(opt: string) {
    const newAnswers = [...answers, opt];
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      const s = newAnswers.reduce((acc, a) => acc + (SCORE_MAP[a] || 0), 0);
      setScore(s);
      setStep('result');
    }
  }

  const maxScore = QUESTIONS.length * 4;
  const normalized = Math.round((score / maxScore) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('profile')} className="text-brand-500 text-sm">← 返回</button>
        <span className="text-sm font-semibold text-gray-700">离职决策助手</span>
        
      </div>

      {step === 'intro' && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="text-5xl mb-4">⚖️</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">离职决策助手</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            5个问题，帮你理清思路。<br />这不是诊断，只是一个参考。
          </p>
          <button onClick={start} className="btn-primary w-full max-w-xs">开始评估</button>
        </div>
      )}

      {step === 'questions' && (
        <div className="px-4 pt-8 pb-8">
          <div className="progress-bar mb-6">
            <div className="progress-fill" style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
          <p className="text-sm text-gray-400 mb-2">问题 {currentQ + 1}/{QUESTIONS.length}</p>
          <p className="text-base font-semibold text-gray-800 mb-6 leading-relaxed">{QUESTIONS[currentQ].q}</p>
          <div className="space-y-2">
            {QUESTIONS[currentQ].options.map(opt => (
              <button key={opt} onClick={() => answer(opt)} className="card w-full text-left active:scale-[0.99] transition-transform py-3">
                <span className="text-sm text-gray-700">{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="px-4 pt-8 pb-8 space-y-4">
          <div className="card text-center py-8 bg-gradient-to-br from-brand-50 to-brand-100">
            <p className="text-sm text-gray-500 mb-2">你的离职压力指数</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-5xl font-bold text-brand-600">{normalized}</span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            {normalized >= 70 ? (
              <p className="text-base font-bold text-red-600">⚠️ 建议认真考虑离职</p>
            ) : normalized >= 50 ? (
              <p className="text-base font-bold text-amber-600">⚠️ 需要认真评估</p>
            ) : (
              <p className="text-base font-bold text-green-600">✅ 状态尚可</p>
            )}
          </div>
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">建议</p>
            {normalized >= 70 ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 你的身心状态已经在报警，继续待下去代价可能很大</p>
                <p>• 开始秘密投递简历，不要等到完全崩溃才行动</p>
                <p>• 如果经济允许，可以考虑休息一段时间调整状态</p>
                <p>• 记得保存工作记录和证据，以备不时之需</p>
              </div>
            ) : normalized >= 50 ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 现在是评估的好时机，开始留意市场上的机会</p>
                <p>• 减少在不可改变的事情上消耗精力</p>
                <p>• 设定一个"触发点"——如果情况恶化到什么程度，就立刻行动</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 目前状态尚可，但保持觉察很重要</p>
                <p>• 继续关注自己的身心状态</p>
                <p>• 定期复盘自己的职场环境</p>
              </div>
            )}
          </div>
          <div className="card bg-amber-50">
            <p className="text-xs text-amber-700 leading-relaxed">
              💡 这个评估仅供参考，不是专业诊断。如果你感到持续的心理困扰，建议寻求专业心理咨询师的帮助。
            </p>
          </div>
          <button onClick={() => onNavigate('profile')} className="w-full btn-primary py-3">返回</button>
        </div>
      )}
    </div>
  );
}
