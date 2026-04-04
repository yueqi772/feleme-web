import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { handleMiniProgramLogin } from './miniprogram';
import { getWechatAuthUrl, isWechatLoginConfigured, validateState } from './wechat';

export interface WechatUser {
  openid: string;
  nickname: string;
  headimgurl: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  wechatUser: WechatUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithWechat: () => void;
  handleWechatCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = 'feleme_wechat_user';

function loadSavedUser(): WechatUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wechatUser, setWechatUser] = useState<WechatUser | null>(loadSavedUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mpData = handleMiniProgramLogin();
    if (mpData) {
      setWechatUser({ openid: '', nickname: mpData.nickname || '微信用户', headimgurl: mpData.avatar || '' });
    }
  }, []);

  useEffect(() => {
    if (wechatUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(wechatUser));
    else localStorage.removeItem(STORAGE_KEY);
  }, [wechatUser]);

  const loginWithWechat = useCallback(() => {
    if (!isWechatLoginConfigured()) { setError('微信登录未配置'); return; }
    sessionStorage.setItem('pre_login_path', window.location.pathname);
    window.location.href = getWechatAuthUrl();
  }, []);

  const handleWechatCallback = useCallback(async (code: string, state: string) => {
    if (!validateState(state)) { setError('授权验证失败'); return; }
    setIsLoading(true); setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001'}/auth/wechat/exchange`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, state }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || '登录失败');
      setWechatUser({ openid: data.openid!, nickname: data.nickname || '微信用户', headimgurl: data.headimgurl || '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setWechatUser(null);
    sessionStorage.removeItem('wechat_oauth_state');
    sessionStorage.removeItem('pre_login_path');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: wechatUser !== null, wechatUser, isLoading, error, loginWithWechat, handleWechatCallback, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
