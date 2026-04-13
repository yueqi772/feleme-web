import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { countPuaTypes, calcScore, getRiskInfo, generateId } from '../utils';
import DigitalHuman, { type MoodKey } from '../components/DigitalHuman';
import { PUA_QUESTIONS } from '../data/questions_v2';
import type { PuaQuestion } from '../data/questions_v2';

export type ReplyType = 'a' | 'b' | 'c';

export type ReplyOption = {
  id: ReplyType;
  text: string;
  reactionMood: MoodKey;
  hint: string;
};

const ALL_REPLIES: Record<number, ReplyOption[]> = {
  1: [
    { id: 'a', reactionMood: 'confident', hint: '表达感激，但保持分寸，不卑微也不对抗', text: '谢谢王总，我刚来还在学习阶段，有什么做得不到位的地方还请您多指点，我一定努力跟上大家的节奏。' },
    { id: 'b', reactionMood: 'nervous', hint: '全力顺从，给自己加了很多压力', text: '谢谢王总！我一定不辜负您的期望，我会的！您放心，我一定拼尽全力，绝对不让您失望！' },
    { id: 'c', reactionMood: 'confused', hint: '直接追问晋升条件，可能显得急功近利', text: '王总，请问这次晋升主要是看哪方面的表现？我想提前了解清楚，也好有个努力的方向。' },
  ],
  2: [
    { id: 'a', reactionMood: 'confident', hint: '设立边界，但语气温和，给出替代方案', text: '收到王总。不过我今天已经在地铁上了，信号不太稳定。我到家之后第一时间处理，明早七点前发您可以吗？辛苦您了。' },
    { id: 'b', reactionMood: 'sad', hint: '二话不说直接答应，牺牲个人时间和健康', text: '好的王总，我马上打车回去处理，大概一个半小时能搞定，您稍等。' },
    { id: 'c', reactionMood: 'anxious', hint: '指出安排冲突，但没有明确拒绝，可能激化矛盾', text: '王总，今天这个需求当时没说要今晚交，我现在在外面的，和之前安排有冲突。这种临时变更以后能提前说一声吗？' },
  ],
  3: [
    { id: 'a', reactionMood: 'determined', hint: '聚焦具体问题，不陷入自我否定', text: '王总，这个方案交付时您审过，数据没达到预期我想具体了解下是哪个指标出了问题，也好有针对性地改。我能约您十分钟详细聊聊吗？' },
    { id: 'b', reactionMood: 'sad', hint: '默默承受，可能陷入深深的自我怀疑', text: '...好的王总，我知道了。我回去重新做一份，明天一早发您。这次一定做好。' },
    { id: 'c', reactionMood: 'humiliated', hint: '直接反驳但当场被压制，可能更难受', text: '王总，这个方案您之前审批过的，当时您说的是"可以"。我想知道中间是哪里变了，还是我理解错了什么？' },
  ],
  4: [
    { id: 'a', reactionMood: 'determined', hint: '温和提出证据，不轻易否定自己的记忆', text: '王总，我在您的邮件里看到过这条记录，可能是沟通上有误会，方便的话我把截图发您确认一下？我很尊重您的意见，但想确保我们理解是一致的。' },
    { id: 'b', reactionMood: 'gaslit', hint: '立刻认同对方说法，内心陷入深深的自我怀疑', text: '...哦，可能是吧，对不起王总，可能是我记混了。不好意思打扰您了，我去忙了。' },
    { id: 'c', reactionMood: 'confused', hint: '直接拿出截图对峙，可能被说"想太多"后更迷茫', text: '王总，我发了您邮箱截图确认，应该不是我记错了。是不是当时的情况有变化？方便的话我们聊一下？' },
  ],
  5: [
    { id: 'a', reactionMood: 'confident', hint: '温和拒绝，给出合理理由，不卑不亢', text: '谢谢王总组织这次活动！不过这次周末我提前有家里安排好的事情，下次团建我一定积极参加，这周末实在不好意思啦。大家玩得开心～' },
    { id: 'b', reactionMood: 'sad', hint: '退让自己的安排，默默承受委屈', text: '好的王总，我去。那我跟家里说一声改一下安排。请问费用是AA吗？我提前转给大家。' },
    { id: 'c', reactionMood: 'anxious', hint: '质疑"自愿"定义，可能引发群体压力', text: '王总，我看通知上写的是"自愿参加"，不过大家好像都去了...请问是必须参加吗？如果是的话下次能提前说吗，这样我好提前安排。' },
  ],
  6: [
    { id: 'a', reactionMood: 'hopeful', hint: '温和询问，不指责但表达困惑', text: '不好意思问一下，这次项目对焦会的议题我关注了一下，感觉有些内容和我目前跟的项目相关，方便让我旁听了解一下吗？主要想对齐一下进度。' },
    { id: 'b', reactionMood: 'isolated', hint: '不追问，默默消化被排斥的感觉', text: '好的，可能是我漏看群消息了...下次有类似会议我关注一下。' },
    { id: 'c', reactionMood: 'angry', hint: '情绪爆发，直接质问，但可能引发更大的压力', text: '请问为什么每次开会都不叫我？我明明是这个项目的核心成员。这已经不是第一次了，我想知道是我哪里做得不好，还是有什么其他原因。' },
  ],
  7: [
    { id: 'a', reactionMood: 'determined', hint: '正式询问，不指责，保持职业态度', text: '王总，不好意思打扰您。想跟您确认一下这次晋升的事，您之前说把我名字报上去了，但名单里没有我，是中间有什么变化吗？我想了解一下原因，也好知道自己还需要在哪些方面提升。' },
    { id: 'b', reactionMood: 'sad', hint: '默默接受委屈，不敢追问', text: '好的王总，我知道了。可能是我哪里还做得不够，我继续努力，下次一定争取。谢谢您。' },
    { id: 'c', reactionMood: 'angry', hint: '直接质问，可能被敷衍或施压', text: '王总，我直说了。您之前说把我名字报上去了，但名单出来没有我，我想知道是什么原因。另外，您前两次也说过同样的话然后没有兑现。我想了解一下实际情况，也想听听您的解释。' },
  ],
  8: [
    { id: 'a', reactionMood: 'confident', hint: '设立边界，给出可行方案，不卑不亢', text: '收到王总。不过我现在在外面，不太方便处理电脑。明早七点前我可以处理完发您，这个时间可以吗？如果特别紧急的话，您看能不能协调其他同事先处理一下，我回来第一时间补上。' },
    { id: 'b', reactionMood: 'sad', hint: '二话不说立刻答应，牺牲睡眠和健康', text: '好的王总，我马上处理，大概一个小时左右能搞定，您等我。' },
    { id: 'c', reactionMood: 'anxious', hint: '指出问题但表达困难，可能被说找借口', text: '收到，但这个需求变更我这边是刚收到通知，没有提前沟通。我明早七点前处理可以吗？另外建议之后变更能提前说一声，这样我能更好地安排时间。' },
  ],
  9: [
    { id: 'a', reactionMood: 'determined', hint: '接受关心，同时要求具体反馈，不轻易否定自己', text: '谢谢王总关心。我确实最近压力比较大，有些困惑。坦白讲，我不清楚您说的"状态不对"具体指哪些方面，方便给我一些具体的例子或者反馈吗？我很愿意改进，但需要一些方向。' },
    { id: 'b', reactionMood: 'sad', hint: '全盘接受，不去质疑核心问题，加深困惑', text: '谢谢王总关心。我会的，我会努力调整自己的状态，可能最近确实有些疲惫，我会尽快调整过来的。' },
    { id: 'c', reactionMood: 'confused', hint: '要求具体证据，可能被更模糊地回应', text: '王总，谢谢您找我谈话。我想请教一下，您说的"外面的人想进来"，这个情况我是第一次听说，具体是指什么？另外，我最近哪些表现让您觉得状态不对，能给我一两个具体例子吗？' },
  ],
  10: [
    { id: 'a', reactionMood: 'determined', hint: '接受任务，同时提出边界问题——这是觉醒时刻！', text: '好的王总，9点前发您。另外正好想跟您说，我最近也在思考工作边界的事情，想找个时间和您聊十分钟，关于工作量和承受压力的一些想法，希望您能听听，也听听我的建议。' },
    { id: 'b', reactionMood: 'sad', hint: '默默接受，继续等待，不开启改变', text: '好的王总，9点前发您。谢谢王总。' },
    { id: 'c', reactionMood: 'determined', hint: '表达困难，可能引发冲突但也是觉醒的开始', text: '王总，我现在手上有两个项目都在关键阶段，精力确实有些顾不过来。我想跟您说一下实际情况，也想请教您如何协调一下优先级，因为我担心同时做两件事反而都做不好。' },
  ],
};

function getReplies(q: PuaQuestion): ReplyOption[] {
  return ALL_REPLIES[q.id] || ALL_REPLIES[1];
}

function getMoodLabel(mood: MoodKey): string {
  const labels: Record<string, string> = {
    empowered:'💪 充满力量', confident:'😊 自信', hopeful:'🤞 心存希望',
    excited:'😊 充满期待', nervous:'😣 紧张不安', confused:'😕 困惑迷茫',
    anxious:'😰 焦虑不安', sad:'😢 难过失落', humiliated:'😞 被羞辱',
    isolated:'😔 被孤立', gaslit:'😦 自我怀疑', angry:'😠 愤怒',
    violated:'😨 边界被侵犯', broken:'😞 精疲力尽', determined:'😤 觉醒',
  };
  return labels[mood] || '😐';
}

const MOOD_COLOR: Record<string, string> = {
  empowered:'#a7f3d0', confident:'#bfdbfe', hopeful:'#bbf7d0', excited:'#fef08a',
  nervous:'#fed7aa', confused:'#e5e7eb', anxious:'#fde68a', sad:'#ddd6fe',
  humiliated:'#fce7f3', isolated:'#f3f4f6', gaslit:'#fde68a', angry:'#fecaca',
  violated:'#fee2e2', broken:'#d1d5db', determined:'#fef08a',
};
const MOOD_EMOJI: Record<string, string> = {
  empowered:'💪', confident:'😄', hopeful:'🤞', excited:'😊',
  nervous:'😣', confused:'😕', anxious:'😰', sad:'😢',
  humiliated:'😞', isolated:'😔', gaslit:'😦', angry:'😠',
  violated:'😨', broken:'😞', determined:'😤',
};

type FeedbackLevel = 'good' | 'neutral' | 'bad';

function getFeedbackLevel(mood: MoodKey): FeedbackLevel {
  const good = ['empowered', 'confident', 'hopeful', 'determined', 'excited'];
  const bad  = ['sad', 'humiliated', 'angry', 'violated', 'broken', 'isolated'];
  if (good.includes(mood)) return 'good';
  if (bad.includes(mood))  return 'bad';
  return 'neutral';
}

function FeedbackOverlay({ reply, onClose }: { reply: ReplyOption; onClose: () => void }) {
  const level = getFeedbackLevel(reply.reactionMood);
  const moodColor = MOOD_COLOR[reply.reactionMood];
  const moodEmoji = MOOD_EMOJI[reply.reactionMood];

  const cfg = {
    good: {
      bg: 'bg-[#f0fdf4]', border: 'border-[#86efac]', topBg: 'bg-[#dcfce7]',
      titleColor: 'text-[#15803d]', barColor: 'bg-[#22c55e]',
      badge: 'bg-[#22c55e]', badgeText: 'text-white', label: '✓ 较好的回应', emoji: '🌟',
    },
    neutral: {
      bg: 'bg-[#fffbeb]', border: 'border-[#fde68a]', topBg: 'bg-[#fef3c7]',
      titleColor: 'text-[#92400e]', barColor: 'bg-[#f59e0b]',
      badge: 'bg-[#f59e0b]', badgeText: 'text-white', label: '○ 一般的回应', emoji: '💭',
    },
    bad: {
      bg: 'bg-[#fff1f2]', border: 'border-[#fecdd3]', topBg: 'bg-[#ffe4e6]',
      titleColor: 'text-[#9f1239]', barColor: 'bg-[#e11d48]',
      badge: 'bg-[#e11d48]', badgeText: 'text-white', label: '✗ 艰难的回应', emoji: '💔',
    },
  }[level];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ animation: 'fade-in 0.2s ease-out both' }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-2xl ${cfg.bg} border-t-2 sm:border-2 ${cfg.border} overflow-hidden`}
        style={{ animation: 'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both', maxHeight: '94vh' }}
      >
        <div className={`h-1.5 w-full ${cfg.topBg}`}>
          <div className={`h-full ${cfg.barColor}`} style={{ animation: 'shrink-bar 2s ease-out forwards' }} />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '93vh' }}>
          <div className={`px-5 pt-4 pb-3 flex items-center gap-3 ${cfg.topBg} border-b ${cfg.border}`}>
            <span className="text-3xl">{cfg.emoji}</span>
            <div className="flex-1">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.badge} ${cfg.badgeText}`}>
                {cfg.label}
              </span>
              <p className={`text-sm mt-1 font-medium ${cfg.titleColor}`}>
                {getMoodLabel(reply.reactionMood)}
              </p>
            </div>
            <DigitalHuman mood={reply.reactionMood} size={72} showLabel={false} />
          </div>

          <div className="px-5 pt-4">
            <div className="flex gap-2 mb-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#07c160] flex items-center justify-center text-white text-xs font-bold">我</div>
              <div className="bg-[#07c160] text-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
                <p className="text-[13px] leading-relaxed">{reply.text}</p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-3">
            <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
              <p className="text-[11px] text-[#888] mb-2 tracking-wide">💡 这一刻发生了什么</p>
              <p className="text-sm text-[#333] leading-relaxed">{reply.hint}</p>
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white shadow-sm"
                  style={{ background: moodColor }}
                >
                  {moodEmoji}
                </div>
                <p className="text-xs text-[#666]">小林现在：{getMoodLabel(reply.reactionMood)}</p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-6">
            <button
              onClick={onClose}
              className={`w-full py-3.5 rounded-full text-sm font-bold text-white ${
                level === 'good' ? 'bg-[#22c55e] hover:bg-[#16a34a]'
                  : level === 'neutral' ? 'bg-[#f59e0b] hover:bg-[#d97706]'
                  : 'bg-[#e11d48] hover:bg-[#be123c]'
              }`}
            >
              继续 →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-up { from { transform: translateY(80px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes shrink-bar { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>
  );
}

function WxHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-[#ededed] px-4 py-2.5 flex items-center gap-3 border-b border-[#cacaca]">
      <button onClick={onBack} className="text-[#1a1a1a] text-lg">‹</button>
      <div className="flex-1 text-center">
        <p className="text-sm font-bold text-[#1a1a1a]">工作群聊</p>
        <p className="text-[11px] text-[#888]">互联网产品部</p>
      </div>
      <div className="text-[#888] text-lg">›</div>
    </div>
  );
}

function WxBubble({ role, name, content, time, highlight }: {
  role: string; name?: string; content: string; time?: string; highlight?: boolean;
}) {
  const isMe = role === 'you';
  const avatarColors: Record<string, string> = {
    boss: '#e54d4d', colleague: '#4a90d9', hr: '#9055d9', you: '#07c160', system: '#888',
  };
  const nameColors: Record<string, string> = {
    boss: '#e54d4d', colleague: '#4a90d9', hr: '#9055d9', you: '#07c160',
  };
  const avatarText: Record<string, string> = {
    boss: '王', colleague: '同', hr: '人', you: '我',
  };

  if (role === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-[#aaa] bg-[#e8e8e8] px-3 py-1 rounded-full">{content}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-3 ${isMe ? 'flex-row-reverse' : ''}`}>
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: avatarColors[role] || '#888' }}
      >
        {avatarText[role] || '?'}
      </div>
      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        {name && !isMe && <p className="text-[11px]" style={{ color: nameColors[role] || '#888' }}>{name}</p>}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            highlight
              ? 'bg-red-50 text-red-900 border border-red-200'
              : isMe
              ? 'bg-[#07c160] text-white rounded-br-sm'
              : 'bg-white text-[#1a1a1a] border border-[#e0e0e0] rounded-bl-sm shadow-sm'
          }`}
          style={{ wordBreak: 'break-word' }}
        >
          {content}
        </div>
        {time && <p className="text-[10px] text-[#bbb]">{time}</p>}
      </div>
    </div>
  );
}

function ReplyBar({ replies, onSelect }: { replies: ReplyOption[]; onSelect: (r: ReplyOption) => void }) {
  return (
    <div className="bg-white border-t border-[#e8e8e8] px-4 py-3">
      <p className="text-[11px] text-[#aaa] mb-2">你会怎么回复：</p>
      <div className="flex flex-col gap-2">
        {replies.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="w-full text-left bg-[#f7f7f7] hover:bg-[#f0f0f0] active:bg-[#e8e8e8] rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
          >
            <p className="text-[13px] text-[#333] leading-relaxed">{r.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm flex items-center justify-center gap-1.5 py-2 border-b border-[#e8e8e8]">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i < current ? '16px' : i === current ? '10px' : '6px',
            background: i <= current ? '#07c160' : '#ccc',
            opacity: i < current ? 1 : i === current ? 0.8 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function EmotionBar({ moods }: { moods: MoodKey[] }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 flex items-center gap-1 border-b border-[#e8e8e8] overflow-x-auto no-scrollbar">
      <p className="text-[11px] text-[#aaa] shrink-0">情绪:</p>
      {moods.map((m, i) => (
        <div
          key={i}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
          style={{ background: MOOD_COLOR[m] }}
          title={getMoodLabel(m)}
        >
          {MOOD_EMOJI[m]}
        </div>
      ))}
    </div>
  );
}

interface TestPageProps { onNavigate: (page: string, params?: Record<string, unknown>) => void; }

export default function TestPage({ onNavigate }: TestPageProps) {
  const { saveTestResult, unlockAchievement } = useApp();
  const [step, setStep] = useState<'intro' | 'story' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Array<{ replyId: ReplyType; reactionMood: MoodKey }>>([]);
  const [selectedReply, setSelectedReply] = useState<ReplyOption | null>(null);
  const [historyMoods, setHistoryMoods] = useState<MoodKey[]>([]);

  const question = PUA_QUESTIONS[currentQ];
  const replies = question ? getReplies(question) : [];
  const isLast = currentQ === PUA_QUESTIONS.length - 1;

  function startStory() {
    setStep('story');
    setCurrentQ(0);
    setAnswers([]);
    setSelectedReply(null);
    setHistoryMoods([]);
  }

  function handleSelectReply(r: ReplyOption) {
    if (selectedReply) return;
    setSelectedReply(r);
    setHistoryMoods(prev => [...prev, r.reactionMood]);
  }

  function handleNext() {
    if (!selectedReply) return;
    const newAnswers = [...answers, { replyId: selectedReply.id, reactionMood: selectedReply.reactionMood }];
    setAnswers(newAnswers);
    if (isLast) {
      const counts = countPuaTypes(Object.fromEntries(newAnswers.map((a, i) => [i + 1, a.replyId !== 'a'])));
      const score = calcScore(counts);
      const risk = getRiskInfo(score);
      saveTestResult({ id: generateId(), date: new Date().toISOString(), score, riskLevel: risk.level, counts, totalAnswered: 10 });
      unlockAchievement('a2');
      setStep('result');
    } else {
      setSelectedReply(null);
      setCurrentQ(q => q + 1);
    }
  }

  function handleFeedbackClose() {
    handleNext();
    setSelectedReply(null);
  }

  // ── RESULT ───────────────────────────────────────────────
  if (step === 'result') {
    const ratio = answers.filter(a => a.replyId === 'a').length / 10;
    const finalMood: MoodKey = ratio >= 0.7 ? 'empowered' : ratio >= 0.4 ? 'confident' : 'broken';
    const info = ratio >= 0.7
      ? { e: '🌟', t: '觉醒者', d: '你帮助小林找到了职场边界的力量！' }
      : ratio >= 0.4
      ? { e: '🌱', t: '觉醒中', d: '小林开始意识到问题，但还需要更多勇气。' }
      : { e: '😢', t: '迷失中', d: '小林还没有找到力量，但故事还没结束。' };
    const finalScore = Math.round((1 - ratio) * 100);
    const risk = getRiskInfo(finalScore);

    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
        <WxHeader onBack={() => onNavigate('home')} />
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-8">
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
            <div className="flex justify-center mb-3">
              <DigitalHuman mood={finalMood} size={110} />
            </div>
            <p className="text-base font-bold text-[#1a1a1a]">{info.e} {info.t}</p>
            <p className="text-sm text-[#666] mt-1">{info.d}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-center gap-6">
              {[
                { n: answers.filter(a => a.replyId === 'a').length, c: '#555', l: '从容应对' },
                { n: answers.filter(a => a.replyId === 'b').length, c: '#999', l: '沉默承受' },
                { n: answers.filter(a => a.replyId === 'c').length, c: '#555', l: '激烈回应' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: s.c }}>{s.n}</p>
                  <p className="text-xs text-[#888]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-4 text-center ${risk.bg}`}>
            <p className="text-xs text-[#888] mb-1">职场压力指数</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">{risk.emoji}</span>
              <span className={`text-4xl font-bold ${risk.color}`}>{finalScore}</span>
              <span className="text-lg text-[#888]">/100</span>
            </div>
            <p className={`text-xs font-medium ${risk.color}`}>{risk.desc}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-bold text-[#1a1a1a] mb-3">小林的情绪轨迹</p>
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {answers.map((a, i) => (
                <div key={i} className="shrink-0 flex flex-col items-center gap-0.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white shadow-sm"
                    style={{ background: MOOD_COLOR[a.reactionMood] }}
                  >
                    {MOOD_EMOJI[a.reactionMood]}
                  </div>
                  {(i === 0 || i === 5 || i === 11) && (
                    <p className="text-[9px] text-[#aaa]">第{i + 1}题</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#aaa]">
              <span>😢</span>
              <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-[#ef9a9a] via-[#fff59d] to-[#a5d6a7]" />
              <span>💪</span>
            </div>
          </div>

          <div className="text-center py-2">
            <p className="text-lg italic text-[#07c160]">"你的感受是真实的。"</p>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO ─────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div style={{ animation: 'float-idle 3s ease-in-out infinite' }}>
            <DigitalHuman mood="confident" size={90} />
          </div>
          <h2 className="text-white text-xl font-bold mt-6 mb-2">小林的职场故事</h2>
          <p className="text-[#aaa] text-sm mb-1">微信聊天记录沉浸式体验</p>
          <p className="text-[#555] text-xs leading-relaxed max-w-xs mb-8">
            在12个真实场景中做出你的选择\n你的每个决定都会影响小林的心理状态
          </p>
          <div className="w-full max-w-xs space-y-2">
            {[
              { icon: '💬', title: '微信聊天沉浸式', desc: '像真的在工作群里经历一切' },
              { icon: '💭', title: '情绪状态追踪', desc: '每个选择都影响小林的心理变化' },
              { icon: '🧍', title: '你的选择塑造结局', desc: '三种回应方式，导向不同结局' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 text-left">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm text-white font-medium">{item.title}</p>
                  <p className="text-xs text-[#888]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={startStory}
            className="mt-8 w-full max-w-xs bg-[#07c160] text-white rounded-full py-3.5 text-base font-bold active:scale-95 transition-transform shadow-lg"
          >
            开始故事之旅 →
          </button>
        </div>
      </div>
    );
  }

  // ── STORY ─────────────────────────────────────────────
  if (!question) return null;

  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col">
      <WxHeader onBack={() => setStep('intro')} />
      <ProgressDots current={currentQ} />
      {historyMoods.length > 0 && <EmotionBar moods={historyMoods} />}

      <div className="flex-1 overflow-y-auto px-3 py-4 pb-2">
        <div className="flex justify-center mb-4">
          <div className="bg-white/80 text-xs text-[#888] px-4 py-1.5 rounded-full backdrop-blur-sm">
            {question.context}
          </div>
        </div>

        {question.chat.map((msg, i) => (
          <WxBubble key={i} role={msg.role} name={msg.name} content={msg.content} time={msg.time} highlight={msg.highlight} />
        ))}

        {/* Inner monologue */}
        <div className="mt-4 mb-3 flex gap-2">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#ede7f6] flex items-center justify-center text-[#7b4bbd] text-xs font-bold">林</div>
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
            <p className="text-[11px] text-[#7b4bbd] font-medium mb-1">💭 小林的内心</p>
            <p className="text-sm text-[#555] leading-relaxed italic">
              {question.monologue.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 ? <br /> : ''}</span>
              ))}
            </p>
          </div>
        </div>

        {/* Key quote */}
        <div className="mx-2 mb-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-red-400 font-medium mb-1">🎯 关键一幕</p>
          <p className="text-sm text-red-800 italic leading-relaxed">"{question.quote}"</p>
        </div>

        {/* PUA tags */}
        <div className="flex gap-1.5 flex-wrap px-2 mb-4">
          {question.tags.map(t => (
            <span key={t} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-400 rounded-full">#{t}</span>
          ))}
        </div>

        {/* Selected reply bubble */}
        {selectedReply && (
          <div className="flex justify-end mb-3">
            <div className="max-w-[80%] bg-[#07c160] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
              {selectedReply.text}
            </div>
          </div>
        )}
      </div>

      {/* Reply bar or continue */}
      {!selectedReply ? (
        <ReplyBar replies={replies} onSelect={handleSelectReply} />
      ) : (
        <div className="bg-white border-t border-[#e8e8e8] px-4 py-3">
          <button
            onClick={handleNext}
            className="w-full bg-[#07c160] text-white rounded-full py-3 text-sm font-bold active:scale-[0.98] transition-transform"
            style={{ animation: 'slide-up 0.3s ease-out both' }}
          >
            {isLast ? '🌟 查看结局' : '继续 →'}
          </button>
        </div>
      )}

      {/* Feedback overlay */}
      {selectedReply && (
        <FeedbackOverlay reply={selectedReply} onClose={handleFeedbackClose} />
      )}
    </div>
  );
}