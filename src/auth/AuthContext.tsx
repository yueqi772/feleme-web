import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { handleMiniProgramLogin } from './miniprogram';
import { getH5User, createH5User, isH5Standalone, type H5User, h5Login as doH5Login } from './h5';
import { setOpenid, cloudSyncAll, getOpenid } from '../cloud';

export interface WechatUser {
  openid: string;
  unionid?: string;
  nickname: string;
  headimgurl: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  wechatUser: WechatUser | null;
  h5User: H5User | null;
  isLoading: boolean;
  error: string | null;
  loginWithWechat: () => void;
  handleWechatCallback: (code: string, state: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const WX_STORAGE_KEY = 'feleme_wechat_user';

function loadSavedWxUser(): WechatUser | null {
  try {
    const raw = localStorage.getItem(WX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wechatUser, setWechatUser] = useState<WechatUser | null>(loadSavedWxUser);
  const [h5User, setH5User] = useState<H5User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mpData = handleMiniProgramLogin();
    if (mpData) {
      const openid = mpData.openid || '';
      if (openid) setOpenid(openid);
      const user: WechatUser = {
        openid,
        unionid: mpData.unionid || '',
        nickname: mpData.nickname || '微信用户',
        headimgurl: mpData.avatar || '',
      };
      setWechatUser(user);
      if (openid) {
        try {
          const raw = localStorage.getItem('zhichang_qingxing_v1');
          if (raw) cloudSyncAll(JSON.parse(raw));
        } catch (_) { /* ignore */ }
      }
    } else if (isH5Standalone()) {
      const saved = getH5User();
      if (saved) { setH5User(saved); setOpenid(saved.id); }
    }
  }, []);

  useEffect(() => {
    if (wechatUser) {
      if (wechatUser.openid) setOpenid(wechatUser.openid);
      localStorage.setItem(WX_STORAGE_KEY, JSON.stringify(wechatUser));
    } else {
      localStorage.removeItem(WX_STORAGE_KEY);
    }
  }, [wechatUser]);

  const loginWithWechat = useCallback(() => {
    setError('微信授权登录仅在小程序中可用');
  }, []);

  const handleWechatCallback = useCallback(async (_code: string, _state: string) => {
    setError('微信授权登录仅在小程序中可用');
  }, []);

  const logout = useCallback(() => {
    setWechatUser(null);
    setH5User(null);
    localStorage.removeItem(WX_STORAGE_KEY);
    localStorage.removeItem('feleme_h5_user');
  }, []);

  const clearError = useCallback(() => { setError(null); }, []);

  if (!wechatUser && !h5User) {
    // 尝试恢复 H5 用户
    const saved = getH5User();
    if (saved) { setH5User(saved); setOpenid(saved.id); }
  }

  return (
    <AuthContext.Provider value={{
      isLoggedIn: wechatUser !== null || h5User !== null,
      wechatUser,
      h5User,
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

// 暴露给外部调用的 H5 登录（设置昵称）
export { doH5Login as h5Login };
