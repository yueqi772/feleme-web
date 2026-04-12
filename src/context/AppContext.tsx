import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  TestResult, DiaryEntry, Achievement, Post, Comment,
  Industry, WorkYears, ChatMessage,
} from '../types';
import { ACHIEVEMENTS, MOCK_POSTS } from '../data';
import {
  cloudSaveTestResult, cloudSaveDiary, cloudAddChatMessage,
  cloudAddPost, cloudToggleLike, cloudToggleResonate,
  cloudAddComment, cloudUnlockAchievement,
  cloudUpdateUserProfile, cloudToggleFavoriteScript,
  cloudIncrementPracticeCount,
} from '../cloud';

// ─── 类型定义 ──────────────────────────────────────────────

interface AppState {
  testHistory: TestResult[];
  currentTestResult: TestResult | null;
  diaries: DiaryEntry[];
  posts: Post[];
  comments: Record<string, Comment[]>;
  achievements: Achievement[];
  practiceCount: number;
  favoriteScripts: string[];
  totalCommentLikes: number;
  joinDate: string;
  userIndustry: Industry;
  userWorkYears: WorkYears;
  deepseekKey: string;
  onboardingDone: boolean;
  isDarkMode: boolean;
  appName: string;
}

interface AppContextType extends AppState {
  saveTestResult: (result: TestResult) => void;
  saveDiary: (diary: DiaryEntry) => void;
  addChatMessage: (diaryId: string, message: ChatMessage) => void;
  addPost: (post: Post) => void;
  toggleLike: (postId: string, cloudId?: string) => void;
  toggleResonate: (postId: string, cloudId?: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  unlockAchievement: (id: string) => void;
  setUserInfo: (industry: Industry, workYears: WorkYears) => void;
  toggleFavoriteScript: (scriptId: string) => void;
  incrementPracticeCount: () => void;
  setDeepseekKey: (key: string) => void;
  completeOnboarding: () => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'zhichang_qingxing_v1';

// ─── 本地持久化 ──────────────────────────────────────────────

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      testHistory: state.testHistory,
      currentTestResult: state.currentTestResult,
      diaries: state.diaries,
      posts: state.posts,
      comments: state.comments,
      achievements: state.achievements,
      practiceCount: state.practiceCount,
      favoriteScripts: state.favoriteScripts,
      totalCommentLikes: state.totalCommentLikes,
      joinDate: state.joinDate,
      userIndustry: state.userIndustry,
      userWorkYears: state.userWorkYears,
      deepseekKey: state.deepseekKey,
      onboardingDone: state.onboardingDone,
      isDarkMode: state.isDarkMode,
      appName: state.appName,
    }));
  } catch {}
}

// ─── Provider ──────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadState();
    return {
      testHistory: saved.testHistory || [],
      currentTestResult: saved.currentTestResult || null,
      diaries: saved.diaries || [],
      posts: saved.posts || MOCK_POSTS,
      comments: saved.comments || {},
      achievements: saved.achievements || ACHIEVEMENTS,
      practiceCount: saved.practiceCount || 0,
      favoriteScripts: saved.favoriteScripts || [],
      totalCommentLikes: saved.totalCommentLikes || 0,
      joinDate: saved.joinDate || new Date().toISOString(),
      userIndustry: saved.userIndustry || '互联网',
      userWorkYears: saved.userWorkYears || '1-3年',
      deepseekKey: saved.deepseekKey || '',
      onboardingDone: saved.onboardingDone ?? false,
      isDarkMode: saved.isDarkMode ?? false,
      appName: saved.appName || 'A里味',
    };
  });

  // 状态变化时持久化到 localStorage
  useEffect(() => { persist(state); }, [state]);

  // 暗黑模式 class 切换
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.isDarkMode);
  }, [state.isDarkMode]);

  // ─── 1. 保存测试结果 ─────────────────────────────────────
  const saveTestResult = useCallback((result: TestResult) => {
    setState(s => ({
      ...s,
      testHistory: [result, ...s.testHistory].slice(0, 20),
      currentTestResult: result,
    }));
    cloudSaveTestResult(result as unknown as Record<string, unknown>);
  }, []);

  // ─── 2. 保存情绪日记 ────────────────────────────────────
  const saveDiary = useCallback((diary: DiaryEntry) => {
    setState(s => ({ ...s, diaries: [diary, ...s.diaries] }));
    cloudSaveDiary(diary as unknown as Record<string, unknown>);
  }, []);

  // ─── 3. 添加日记聊天消息 ────────────────────────────────
  const addChatMessage = useCallback((diaryId: string, message: ChatMessage) => {
    setState(s => ({
      ...s,
      diaries: s.diaries.map(d =>
        d.id === diaryId ? { ...d, messages: [...d.messages, message] } : d
      ),
    }));
    cloudAddChatMessage(diaryId, message as unknown as Record<string, unknown>);
  }, []);

  // ─── 4. 发布社区帖子 ───────────────────────────────────
  const addPost = useCallback((post: Post) => {
    setState(s => ({ ...s, posts: [post, ...s.posts] }));
    cloudAddPost(post as unknown as Record<string, unknown>);
  }, []);

  // ─── 5. 帖子点赞 / 取消点赞 ─────────────────────────────
  const toggleLike = useCallback((postId: string, cloudId?: string) => {
    setState(s => ({
      ...s,
      posts: s.posts.map(p => {
        if (p.id !== postId) return p;
        const liked = !p.liked;
        return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
      }),
    }));
    if (cloudId) cloudToggleLike(postId, cloudId, true);
  }, []);

  // ─── 6. 帖子共鸣 / 取消共鸣 ────────────────────────────
  const toggleResonate = useCallback((postId: string, cloudId?: string) => {
    setState(s => ({
      ...s,
      posts: s.posts.map(p => {
        if (p.id !== postId) return p;
        const resonated = !p.resonated;
        return { ...p, resonated, resonances: resonated ? p.resonances + 1 : p.resonances - 1 };
      }),
    }));
    if (cloudId) cloudToggleResonate(postId, cloudId, true);
  }, []);

  // ─── 7. 添加评论 ───────────────────────────────────────
  const addComment = useCallback((postId: string, comment: Comment) => {
    setState(s => ({
      ...s,
      posts: s.posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p),
      comments: { ...s.comments, [postId]: [...(s.comments[postId] || []), comment] },
    }));
    cloudAddComment(comment as unknown as Record<string, unknown>);
  }, []);

  // ─── 8. 解锁成就 ───────────────────────────────────────
  const unlockAchievement = useCallback((id: string) => {
    setState(s => ({
      ...s,
      achievements: s.achievements.map(a =>
        a.id === id && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ),
    }));
    const ach = state.achievements.find(a => a.id === id);
    if (ach) cloudUnlockAchievement(ach as unknown as Record<string, unknown>);
  }, [state.achievements]);

  // ─── 9. 更新用户信息 ──────────────────────────────────
  const setUserInfo = useCallback((industry: Industry, workYears: WorkYears) => {
    setState(s => ({ ...s, userIndustry: industry, userWorkYears: workYears }));
    cloudUpdateUserProfile({ industry, workYears });
  }, []);

  // ─── 10. 话术收藏 / 取消 ────────────────────────────────
  const toggleFavoriteScript = useCallback((scriptId: string) => {
    setState(s => ({
      ...s,
      favoriteScripts: s.favoriteScripts.includes(scriptId)
        ? s.favoriteScripts.filter(id => id !== scriptId)
        : [...s.favoriteScripts, scriptId],
    }));
    const liked = !state.favoriteScripts.includes(scriptId);
    if (liked) cloudToggleFavoriteScript(scriptId, liked);
  }, [state.favoriteScripts]);

  // ─── 11. 练习次数 +1 ───────────────────────────────────
  const incrementPracticeCount = useCallback(() => {
    setState(s => ({ ...s, practiceCount: s.practiceCount + 1 }));
    cloudIncrementPracticeCount();
  }, []);

  // ─── 其他设置 ───────────────────────────────────────────
  const setDeepseekKey = useCallback((key: string) => {
    setState(s => ({ ...s, deepseekKey: key }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(s => ({ ...s, onboardingDone: true, joinDate: new Date().toISOString() }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(s => ({ ...s, isDarkMode: !s.isDarkMode }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      saveTestResult, saveDiary, addChatMessage, addPost,
      toggleLike, toggleResonate, addComment, unlockAchievement,
      setUserInfo, toggleFavoriteScript, incrementPracticeCount,
      setDeepseekKey, completeOnboarding, toggleDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
