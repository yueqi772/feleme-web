import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { TestResult, DiaryEntry, Achievement, Post, Comment, Industry, WorkYears, ChatMessage } from '../types';
import { ACHIEVEMENTS, MOCK_POSTS } from '../data';

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
  toggleLike: (postId: string) => void;
  toggleResonate: (postId: string) => void;
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
      appName: saved.appName || 'Feleme',
    };
  });

  useEffect(() => { persist(state); }, [state]);

  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  const saveTestResult = useCallback((result: TestResult) => {
    setState(s => ({ ...s, testHistory: [result, ...s.testHistory].slice(0, 20), currentTestResult: result }));
  }, []);
  const saveDiary = useCallback((diary: DiaryEntry) => {
    setState(s => ({ ...s, diaries: [diary, ...s.diaries] }));
  }, []);
  const addChatMessage = useCallback((diaryId: string, message: ChatMessage) => {
    setState(s => ({ ...s, diaries: s.diaries.map(d => d.id === diaryId ? { ...d, messages: [...d.messages, message] } : d) }));
  }, []);
  const addPost = useCallback((post: Post) => { setState(s => ({ ...s, posts: [post, ...s.posts] })); }, []);
  const toggleLike = useCallback((postId: string) => {
    setState(s => ({ ...s, posts: s.posts.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p) }));
  }, []);
  const toggleResonate = useCallback((postId: string) => {
    setState(s => ({ ...s, posts: s.posts.map(p => p.id === postId ? { ...p, resonated: !p.resonated, resonances: p.resonated ? p.resonances - 1 : p.resonances + 1 } : p) }));
  }, []);
  const addComment = useCallback((postId: string, comment: Comment) => {
    setState(s => ({
      ...s,
      posts: s.posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p),
      comments: { ...s.comments, [postId]: [...(s.comments[postId] || []), comment] },
    }));
  }, []);
  const unlockAchievement = useCallback((id: string) => {
    setState(s => ({ ...s, achievements: s.achievements.map(a => a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a) }));
  }, []);
  const setUserInfo = useCallback((industry: Industry, workYears: WorkYears) => {
    setState(s => ({ ...s, userIndustry: industry, userWorkYears: workYears }));
  }, []);
  const toggleFavoriteScript = useCallback((scriptId: string) => {
    setState(s => ({ ...s, favoriteScripts: s.favoriteScripts.includes(scriptId) ? s.favoriteScripts.filter(id => id !== scriptId) : [...s.favoriteScripts, scriptId] }));
  }, []);
  const incrementPracticeCount = useCallback(() => {
    setState(s => ({ ...s, practiceCount: s.practiceCount + 1 }));
  }, []);
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
      ...state, saveTestResult, saveDiary, addChatMessage, addPost,
      toggleLike, toggleResonate, addComment, unlockAchievement,
      setUserInfo, toggleFavoriteScript, incrementPracticeCount, setDeepseekKey,
      completeOnboarding, toggleDarkMode,
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
