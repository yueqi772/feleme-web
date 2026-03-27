export interface PuaQuestion {
  id: number;
  type: string;
  /** Short title shown in progress bar */
  shortTitle: string;
  /** Full scene setting — shown as context text */
  context: string;
  /** Chat messages array: role = 'boss' | 'colleague' | 'hr' | 'you' | 'system' */
  chat: ChatMessage[];
  /** First-person inner monologue */
  monologue: string;
  /** The triggering quote from boss */
  quote: string;
  /** Which PUA sub-types this question illustrates */
  tags: string[];
  /** How the choice affects 小林's emotional state */
  emotionalShift: 'negative' | 'confused' | 'empowered';
}

interface ChatMessage {
  role: 'boss' | 'colleague' | 'hr' | 'you' | 'system';
  name?: string;
  content: string;
  time?: string;
  /** Highlight this message in red/pink as the key moment */
  highlight?: boolean;
  /** dim this message */
  dim?: boolean;
}

export const PUA_QUESTIONS: PuaQuestion[] = [
  // ── Chapter 1: 入职 ──────────────────────────────────────
  {
    id: 1,
    type: '否定价值',
    shortTitle: '入职第一天',
    context: '4月7日 · 周一 · 互联网中型公司 · 产品岗',
    chat: [
      { role: 'boss', name: '王总监', content: '欢迎新同学！@小李 以后就是我们的伙伴了～', time: '9:30' },
      { role: 'colleague', name: '同事A', content: '欢迎欢迎！' },
      { role: 'boss', name: '王总监', content: '小李，我看了你的简历，觉得很有潜力。好好干，年底升职加薪不是问题。', time: '10:15', highlight: true },
    ],
    monologue: '王总监拍了拍我的肩膀，那力度刚刚好。走出会议室的时候，我觉得自己真的选对了公司。明天要更努力才行。',
    quote: '简历写得不错，年轻有活力，我相信你能跟上团队的节奏。加油。',
    tags: ['否定价值', '画大饼'],
    emotionalShift: 'empowered',
  },

  // ── Chapter 2: 第一次表扬 ─────────────────────────────────
  {
    id: 2,
    type: '否定价值',
    shortTitle: '第一次当众表扬',
    context: '5月中旬 · 项目上线后第一次复盘会',
    chat: [
      { role: 'boss', name: '王总监', content: '这次项目整体完成度不错，尤其是小李，速度快、质量也在线。', time: '14:02', highlight: true },
      { role: 'colleague', name: '同事B', content: '👍' },
      { role: 'boss', name: '王总监', content: '小李，继续保持，你是团队的中坚力量。',
        time: '14:03' },
    ],
    monologue: '散会后我反复看那条消息，嘴角忍不住往上扬。原来被看见是这种感觉。',
    quote: '你是我们团队最有潜力的那个，别骄傲就行。',
    tags: ['否定价值', '画大饼'],
    emotionalShift: 'empowered',
  },

  // ── Chapter 3: 开始加班 ────────────────────────────────────
  {
    id: 3,
    type: '情感勒索',
    shortTitle: '连续加班第三周',
    context: '6月 · 项目冲刺期 · 晚上9:47 · 你还在公司',
    chat: [
      { role: 'boss', name: '王总监', content: '@小李 这个页面的交互动画今晚能不能搞定？明天要给客户看。', time: '21:47' },
      { role: 'you', content: '收到，我尽快' },
      { role: 'boss', name: '王总监', content: '👍 其他同事都在线，你搞完可以走。', time: '21:49', highlight: true },
      { role: 'colleague', name: '同事A', content: '[撤回了一条消息]', dim: true },
    ],
    monologue: '同事A撤回了什么？我装作没看见。打开外卖软件看了眼，已经过了配送时间。明天还要早起打卡。',
    quote: '大家都在加班，这是一个团队最基本的觉悟。年轻人多干点，不吃亏的。',
    tags: ['情感勒索', '边界侵犯'],
    emotionalShift: 'confused',
  },

  // ── Chapter 4: 第一次当众批评 ───────────────────────────────
  {
    id: 4,
    type: '否定价值',
    shortTitle: '会议室变成了审判台',
    context: '7月第二个周三 · 下午2点 · 部门全员周会 · 所有人都在',
    chat: [
      { role: 'boss', name: '王总监', content: '小李，上周那个活动页面的数据你看了吗？', time: '14:08' },
      { role: 'you', content: '看了，转化率是2.3%，比上次略低，我分析了一下原因...' },
      { role: 'boss', name: '王总监', content: '2.3%？这是在浪费公司资源。',
        time: '14:10', highlight: true },
      { role: 'boss', name: '王总监', content: '这种水平的东西也敢交付？小李，你是怎么混进来的？',
        time: '14:10', highlight: true },
    ],
    monologue: '会议室安静了大概三秒。没人抬头，没人说话。我能感觉到所有人的目光好像都在天花板上，就是不在我身上。\n\n脸上的热度从脖子一直烧到耳朵。同事A低着头假装看手机。\n\n我张了张嘴，什么声音也没发出来。',
    quote: '你的方案就是反面教材。大家引以为戒，别向她学习。',
    tags: ['否定价值', '孤立排挤', '煤气灯效应'],
    emotionalShift: 'negative',
  },

  // ── Chapter 5: 被质疑记忆 ──────────────────────────────────
  {
    id: 5,
    type: '煤气灯效应',
    shortTitle: '那次谈话，你记得吗？',
    context: '批评会后第二天 · 王总监叫你去办公室',
    chat: [
      { role: 'boss', name: '王总监', content: '昨天那话，我说重了点，但你是自己人我才说的。', time: '10:22' },
      { role: 'you', content: '王总，我想确认一下，您上个月说我Q3会晋升，这个还有吗？' },
      { role: 'boss', name: '王总监', content: '我说过这话？', time: '10:24', highlight: true },
      { role: 'boss', name: '王总监', content: '小李，你记错了吧？我什么时候说过这种话？',
        time: '10:24', highlight: true },
      { role: 'you', content: '...可能是我的问题，我去确认一下会议纪要' },
    ],
    monologue: '走出办公室，我打开邮箱翻记录。发给自己的抄送还在——"Q3晋升名单有她"几个字清清楚楚。\n\n但我开始不确定了。是不是我理解错了？他真的说过吗？\n\n我截图发给他，他没回复。',
    quote: '你记错了。我没说过这种话，你想太多了。',
    tags: ['煤气灯效应', '否定价值'],
    emotionalShift: 'confused',
  },

  // ── Chapter 6: 道德绑架 ──────────────────────────────────────
  {
    id: 6,
    type: '情感勒索',
    shortTitle: '"你要感恩"',
    context: '周五傍晚6:28 · 公司群 · 下班时间到了',
    chat: [
      { role: 'boss', name: '王总监', content: '@全体成员 周末搞一下团建，自愿参加。地点我选。费用AA。', time: '18:28' },
      { role: 'you', content: '王总，周末我有安排，可以请假吗？' },
      { role: 'boss', name: '王总监', content: '你要感恩公司给大家这个机会。大家都在，就你不来，这样合适吗？',
        time: '18:31', highlight: true },
      { role: 'colleague', name: '同事A', content: '+1' },
      { role: 'you', content: '好的，那我去吧' },
    ],
    monologue: '我退掉了那张已经买好的回家车票。\n\n妈在群里说"路上注意安全"，我回了句"加班呢，这次不回了"。她没再问。\n\n我不想让她担心，但我也开始不确定——是不是我真的太自私了？',
    quote: '大家要感恩公司给的平台。别老想着休息，年轻人多吃点苦是福报。',
    tags: ['情感勒索', '情感勒索'],
    emotionalShift: 'negative',
  },

  // ── Chapter 7: 被孤立 ──────────────────────────────────────
  {
    id: 7,
    type: '孤立排挤',
    shortTitle: '那条消息你没收到',
    context: '8月第三周 · 周三上午 · 你发现有什么不对劲',
    chat: [
      { role: 'colleague', name: '同事A', content: '各位，下午2点小会议室，项目对焦会～ @同事B @同事C', time: '11:47', highlight: true },
      { role: 'you', content: '请问这个会是什么内容？我也是项目组的' },
      { role: 'colleague', name: '同事A', content: '哦不好意思@小李 我以为你没参与这个模块[尴尬]', time: '11:50' },
      { role: 'boss', name: '王总监', content: '小李，你手上的模块最近产出不太行，是不是能力跟不上了？', time: '11:52' },
    ],
    monologue: '那条会议通知，没有@我。但我明明是这个项目的核心成员。\n\n同事A那句"我以为"，我反复想了很多遍。是真的搞错了吗？还是我不想承认的理由？\n\n午饭的时候，办公室突然热闹起来。我戴着耳机假装没听见。没人来叫我。',
    quote: '不是你被针对了，是你自己把自己隔离出去了。',
    tags: ['孤立排挤', '煤气灯效应'],
    emotionalShift: 'negative',
  },

  // ── Chapter 8: 再次承诺 ─────────────────────────────────────
  {
    id: 8,
    type: '画大饼',
    shortTitle: '第三次"下季度一定"',
    context: '9月底 · 季度末 · 王总监主动找你谈话',
    chat: [
      { role: 'boss', name: '王总监', content: '小李，进来坐。这次叫你来，是想跟你谈谈发展的事。', time: '15:03' },
      { role: 'boss', name: '王总监', content: '今年的晋升名额很紧张，但我把你的名字报上去了。',
        time: '15:05', highlight: true },
      { role: 'boss', name: '王总监', content: '回去好好干，不要让我失望。我对你期望很高的。', time: '15:06' },
    ],
    monologue: '又是"期望"。\n\n今年3月说"年底一定"，7月说"下季度一定"，这次又说"我把名字报上去了"。\n\n但我已经开始害怕相信了。每次他说"好好干"，我都分不清他是真心还是在给我打鸡血让我继续干活。\n\n走出他办公室，路过HR那个方向的时候我下意识低下头。不想看到任何人的眼神。',
    quote: '我把你的名字已经报上去了。放心，这次稳了。',
    tags: ['画大饼', '否定价值'],
    emotionalShift: 'confused',
  },

  // ── Chapter 9: 承诺再次落空 ────────────────────────────────
  {
    id: 9,
    type: '画大饼',
    shortTitle: '名单上没有我的名字',
    context: '10月第二个周五 · 下午4点 · HR群发了一封邮件',
    chat: [
      { role: 'hr', name: 'HR-陈姐', content: '【通知】Q4晋升名单已确定，恭喜以下同事：@同事A @同事B @同事C @同事D。详细说明会另行通知。', time: '16:02', highlight: true },
      { role: 'you', content: '[@同事A] 请问这次晋升评选的标准是什么？我想了解一下自己的差距在哪里' },
      { role: 'hr', name: 'HR-陈姐', content: '评选是各部门总监综合评定的，具体标准不太方便公开哦～' },
    ],
    monologue: '名单上没有我。\n\n总监说"把你名字报上去了"。HR说"各部门总监综合评定"。\n\n我去找王总监，他端着茶杯笑了："哎呀，这次名额确实不够，我也没想到。你别急，下季度一定第一优先。"',
    quote: '这次确实没预料到。但下季度名额，我第一个给你留着。',
    tags: ['画大饼', '否定价值'],
    emotionalShift: 'negative',
  },

  // ── Chapter 10: 深夜消息 ──────────────────────────────────
  {
    id: 10,
    type: '边界侵犯',
    shortTitle: '11点23分的消息',
    context: '11月 · 周三 · 晚上11:23 · 你刚躺下准备睡觉',
    chat: [
      { role: 'boss', name: '王总监', content: '小李，还没睡吧？', time: '23:23', highlight: true },
      { role: 'you', content: '王总，我在，请问有什么事？' },
      { role: 'boss', name: '王总监', content: '客户刚才给我打电话，说方案有个地方要改。你现在处理一下，明早8点前发我。',
        time: '23:25', highlight: true },
      { role: 'you', content: '...好的收到' },
    ],
    monologue: '我爬起来打开电脑，窗外马路上偶尔有大车经过。\n\n改完方案凌晨2:17。发给他之后我睡不着了，一直盯着手机等回复。\n\n4:30他回了两个字："收到。"\n\n第二天早上客户说，那个改动他们其实还在讨论，不需要那么急。',
    quote: '我不管客户怎么变，他们什么时候变你就什么时候改。这是基本职业素养。',
    tags: ['边界侵犯', '情感勒索'],
    emotionalShift: 'negative',
  },

  // ── Chapter 11: 假借关心施压 ───────────────────────────────
  {
    id: 11,
    type: '情感勒索',
    shortTitle: '"我这是为你好"',
    context: '12月 · 王总监以"绩效辅导"名义找你谈话',
    chat: [
      { role: 'boss', name: '王总监', content: '小李，你最近状态不对啊。我这是关心你，才找你谈。', time: '16:00' },
      { role: 'boss', name: '王总监', content: '你知道外面多少人想进我们公司吗？我顶着多大压力给你争取机会，你就拿这个结果回报我？',
        time: '16:03', highlight: true },
      { role: 'boss', name: '王总监', content: '我把你当自己人才说这些。外面那些人巴不得看我们笑话，你这样让我很难做。', time: '16:05' },
    ],
    monologue: '他说"关心"的时候表情很真诚。他每次施压的时候表情都很真诚。\n\n我突然想不起来，是从什么时候开始，"被关心"变成了一种压力。\n\n我开始怀疑是不是自己不懂感恩。但又隐约觉得哪里不对。',
    quote: '我是为你好才说这些。换成别人，我才懒得管你。',
    tags: ['情感勒索', '煤气灯效应', '否定价值'],
    emotionalShift: 'confused',
  },

  // ── Chapter 12: 做出选择 ──────────────────────────────────
  {
    id: 12,
    type: '边界侵犯',
    shortTitle: '周一的早上，你做了一个决定',
    context: '1月 · 新年后第一个周一 · 早8:47 · 你站在公司楼下',
    chat: [
      { role: 'boss', name: '王总监', content: '@小李 早，今天能把上周五那个方案发我吗？', time: '08:47', highlight: true },
      { role: 'system', content: '你已撤回了一条消息' },
      { role: 'you', content: '好的，王总，9点前发您' },
    ],
    monologue: '我站在公司大堂，空调的冷气从头顶吹下来。\n\n手机屏幕还亮着，显示他那条消息。打卡机"滴"的一声，有人说"周一好"。\n\n我想起第一天入职时，肩膀上那只手。我想说"不"，但不知道该从哪里开口。\n\n我已经不记得，上一次感到轻松是什么时候了。',
    quote: '@小李 这个方案改了没有？客户很急。',
    tags: ['否定价值', '边界侵犯', '情感勒索'],
    emotionalShift: 'confused',
  },
];
