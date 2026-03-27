export type EmotionType = '愤怒' | '委屈' | '焦虑' | '失落' | '麻木';
export type PuaType = '否定价值' | '煤气灯效应' | '情感勒索' | '孤立排挤' | '画大饼' | '边界侵犯';
export type RiskLevel = '健康' | '警戒' | '高危';
export type PostType = '吐槽' | '经验' | '求助';
export type Industry = '互联网' | '教育' | '金融' | '医疗' | '其他';
export type WorkYears = '1年以内' | '1-3年' | '3-5年' | '5年以上';
export type AiRole = '温柔倾听者' | '理性分析师' | '行动教练';

export interface PuaQuestion {
  id: number;
  type: PuaType;
  scene: string;
  quote: string;
}

export interface TestResult {
  id: string;
  date: string;
  score: number;
  riskLevel: RiskLevel;
  counts: Record<PuaType, number>;
  totalAnswered: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  emotion: EmotionType;
  events: string[];
  content: string;
  privacy: 'private' | 'public';
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

export interface Post {
  id: string;
  type: PostType;
  industry: Industry;
  workYears: WorkYears;
  title: string;
  content: string;
  tags: PuaType[];
  likes: number;
  resonances: number;
  comments: number;
  timestamp: number;
  liked?: boolean;
  resonated?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  industry: Industry;
  workYears: WorkYears;
  content: string;
  likes: number;
  timestamp: number;
  replies?: Comment[];
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  condition: string;
}

export interface ScriptItem {
  id: string;
  scene: string;
  sceneIcon: string;
  scripts: string[];
  benefit: string;
}

export interface PracticeScenario {
  id: string;
  title: string;
  icon: string;
  difficulty: number;
  intro: string;
  messages: PracticeMessage[];
}

export interface PracticeMessage {
  role: 'ai' | 'system';
  content: string;
}

export interface LeaveDecision {
  id: string;
  date: string;
  score: number;
  pros: string[];
  cons: string[];
  advice: string;
}
