import type { PuaType, RiskLevel, AiRole, EmotionType } from '../types';

// score = 抗PUA能力值（0~100），越高越强
// 选对（a）越多 → score 越高 → 抗PUA越强
export function getRiskInfo(score: number): { level: RiskLevel; color: string; bg: string; emoji: string; desc: string } {
  if (score >= 70) return { level: '健康', color: 'text-green-600', bg: 'bg-green-50', emoji: '💪', desc: '抗PUA能力强，边界感清晰' };
  else if (score >= 40) return { level: '警戒', color: 'text-amber-600', bg: 'bg-amber-50', emoji: '🌱', desc: '有一定意识，仍有提升空间' };
  else return { level: '高危', color: 'text-red-600', bg: 'bg-red-50', emoji: '⚠️', desc: '容易受操控，需要加强边界意识' };
}

// 题目与 PUA 类型映射（共10题）
const Q_TYPE_MAP: Record<number, PuaType> = {
  1: '否定价值',   // 入职第一天（画大饼/否定价值）
  2: '情感勒索',   // 连续加班（情感勒索/边界侵犯）
  3: '否定价值',   // 当众批评（否定价值/孤立/煤气灯）
  4: '煤气灯效应', // 被质疑记忆（煤气灯效应）
  5: '情感勒索',   // 道德绑架（情感勒索）
  6: '孤立排挤',   // 被排除在会议（孤立排挤）
  7: '画大饼',     // 承诺落空（画大饼）
  8: '边界侵犯',   // 深夜消息（边界侵犯）
  9: '情感勒索',   // 假借关心施压（情感勒索/煤气灯）
  10: '边界侵犯',  // 做出选择（边界侵犯/情感勒索）
};

export function countPuaTypes(answers: Record<number, boolean>): Record<PuaType, number> {
  const counts: Record<PuaType, number> = { '否定价值': 0, '煤气灯效应': 0, '情感勒索': 0, '孤立排挤': 0, '画大饼': 0, '边界侵犯': 0 };
  Object.entries(answers).forEach(([qId, hasProblem]) => {
    if (!hasProblem) return;
    const q = parseInt(qId);
    const type = Q_TYPE_MAP[q];
    if (type) counts[type]++;
  });
  return counts;
}

// counts 记录的是「未能正确识别/应对」的题数（选了非a）
// 抗PUA能力 = (10 - 未正确题数) / 10 * 100
export function calcScore(counts: Record<PuaType, number>): number {
  const wrongCount = Object.values(counts).reduce((a, b) => a + b, 0);
  return Math.round(((10 - wrongCount) / 10) * 100);
}

const EMOTION_RESPONSES: Record<EmotionType, string> = {
  '愤怒': '我能感觉到你现在的愤怒。那种被压制、被否定、被控制的感觉，真的让人很难受。',
  '委屈': '我很心疼你听到这些。你明明很努力，却被这样对待，委屈是完全正常的反应。',
  '焦虑': '这种不确定性带来的焦虑很折磨人。不要急着给自己施压，慢慢来。',
  '失落': '被这样对待之后感到失落，说明你是一个有感受、很认真的人。这种失落会慢慢过去的。',
  '麻木': '有时候，当情绪太多太重，大脑会启动保护机制，让我们感觉"麻木"了。这也是正常的。',
};

const LISTENING_RESPONSES = [
  '谢谢你愿意说出来。这些话，你可能已经憋在心里很久了。能告诉我更多吗？',
  '我听到了。你的感受是真实的，不需要为它辩护。',
  '我在这里听你说。无论你接下来想做什么，都没关系，慢慢来。',
  '这真的很难。有时候，光是把它说出来，就已经是一种勇气了。',
];

const ANALYTICAL_RESPONSES = [
  '从你描述的情况来看，这种行为模式包含了一些典型的操控特征：比如通过反复否定来让你怀疑自己，或者制造"你不合群"的错觉来孤立你。这些都不是正常的职场管理方式。',
  '我帮你梳理一下：你描述的情况包含几个典型要素：①公开贬低 ②事后否认 ③利用你的善意。这种组合本身就是一种操控行为，不是你的问题。',
  '从你的描述看，对方很擅长制造"愧疚感"来让你顺从。这是一种情感操控手段，叫做"情感勒索"。你需要知道：这不是正常的职场关系。',
];

const ACTION_RESPONSES = [
  '针对你描述的情况，我有一个建议：记录每一次关键对话，包括时间、地点、对方说了什么、你怎么回应的。保留证据是保护自己的第一步。',
  '我的建议是：下次遇到类似情况，试着用一句简单的话设立边界，比如："我理解您的想法，但这件事我需要考虑一下，明天回复您。"不需要道歉，不需要解释原因。',
  '一个立即可执行的建议：把今晚的事记录到你的情绪日历里。数据积累之后，你会对自己的处境有更清晰的判断。这本身就是一种自我保护。',
];

export function getAIResponse(emotion: EmotionType, role: AiRole, _userMessage: string): string {
  let response = EMOTION_RESPONSES[emotion] + '\n\n';
  let pool: string[];
  if (role === '温柔倾听者') pool = LISTENING_RESPONSES;
  else if (role === '理性分析师') pool = ANALYTICAL_RESPONSES;
  else pool = ACTION_RESPONSES;
  response += pool[Math.floor(Math.random() * pool.length)];
  return response;
}

export function getPracticeFeedback(userMessage: string): { good: string; better: string; script: string } {
  const hasBoundary = /不|无法|没法|已经|需要|想要|希望|明天|早上/.test(userMessage);
  const isSoft = /^[好的明白知道了可以好 ]+$/.test(userMessage.trim()) && userMessage.length < 15;

  if (hasBoundary && userMessage.length > 10) {
    return {
      good: '很好！你清晰地表达了边界，同时没有激化矛盾。',
      better: '可以更具体一点，比如明确说明你能接受的时间和方式。',
      script: '可以说："我今天有事，最晚可以到X点。明天一早我会第一时间处理，您看这样可以吗？"',
    };
  } else if (isSoft) {
    return {
      good: '你的回应友善，这很好。',
      better: '不过，适当设立边界不会让关系变差，反而会让对方更尊重你。试着加入你的底线。',
      script: '可以在后面加一句："当然，如果真的很紧急，可以打电话给我。"既设了边界，又表达了灵活性。',
    };
  } else {
    return {
      good: '你的感受是对的，面对这种情况感到为难很正常。',
      better: '试试用"先接住情绪，再给边界"的方式。不要直接说"不"，但要清晰表达你能接受的范围。',
      script: '试试这个："我理解这个需求很急（接住情绪）。我今天的情况是XX（说明边界），但我可以明天一早处理，您看可以吗？"',
    };
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
