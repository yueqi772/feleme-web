/**
 * 微信登录状态管理
 *
 * 设计说明：
 * - 当前端已通过微信授权获得 openid 时，通过后端 API 换取用户信息
 * - 将登录态持久化到 localStorage，支持页面刷新后保持登录状态
 * - accessToken 仅存储在内存中（关闭浏览器后需重新登录）
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { handleMiniProgramLogin } from './miniprogram';

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
  loginWithWechat: () => void;         // 触发微信扫码登录
  handleWechatCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'feleme_wechat_user';

/**
 * 从 localStorage 恢复登录态
 */
function loadSavedUser(): WechatUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wechatUser, setWechatUser] = useState<WechatUser | null>(loadSavedUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 启动时检测是否从小程序 WebView 传来登录态
  useEffect(() => {
    const mpData = handleMiniProgramLogin();
    if (mpData) {
      setWechatUser({
        openid: '',  // 小程序没有 openid，用 nickname 作标识
        nickname: mpData.nickname || '微信用户',
        headimgurl: mpData.avatar || '',
      });
    }
  }, []);

  // 将用户信息持久化到 localStorage
  useEffect(() => {
    if (wechatUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wechatUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [wechatUser]);

  /**
   * 触发微信扫码登录
   * 跳转到微信授权页面，用户扫码并授权后，会回调到 redirect_uri
   */
  const loginWithWechat = useCallback(() => {
    const { getWechatAuthUrl, isWechatLoginConfigured } = require('./wechat');

    if (!isWechatLoginConfigured()) {
      setError('微信登录未配置，请联系管理员');
      return;
    }

    // 保存当前页面路径，登录/授权后可以跳转回来
    sessionStorage.setItem('pre_login_path', window.location.pathname);

    // 跳转到微信授权页
    window.location.href = getWechatAuthUrl();
  }, []);

  /**
   * 处理微信授权回调
   * 微信授权后会回调到 redirect_uri?code=xxx&state=xxx
   */
  const handleWechatCallback = useCallback(async (code: string, state: string) => {
    const { validateState } = require('./wechat');

    // 验证 state 防止 CSRF
    if (!validateState(state)) {
      setError('授权验证失败，请重试');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调用后端 API，用 code 换取用户信息
      const response = await fetch(`${import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:3001'}/auth/wechat/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json() as { error?: string; openid?: string; nickname?: string; headimgurl?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || '登录失败');
      }

      setWechatUser({
        openid: data.openid!,
        nickname: data.nickname || '微信用户',
        headimgurl: data.headimgurl || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 退出登录
   */
  const logout = useCallback(() => {
    setWechatUser(null);
    sessionStorage.removeItem('wechat_oauth_state');
    sessionStorage.removeItem('pre_login_path');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      isLoggedIn: wechatUser !== null,
      wechatUser,
      isLoading,
      error,
      loginWithWechat,
      handleWechatCallback,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
