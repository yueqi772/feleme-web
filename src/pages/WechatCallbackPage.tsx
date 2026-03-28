/**
 * 微信登录回调页
 *
 * 微信授权后会回调到这个页面，URL 格式：
 *   /wechat-callback?code=xxxx&state=xxxx
 *
 * 本页逻辑：
 * 1. 从 URL 中提取 code 和 state
 * 2. 验证 state（防止 CSRF）
 * 3. 调用 handleWechatCallback，用 code 换取用户信息
 * 4. 成功后跳转到首页或登录前的页面
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

interface WechatCallbackPageProps {
  onNavigate: (page: string) => void;
}

export default function WechatCallbackPage({ onNavigate }: WechatCallbackPageProps) {
  const { handleWechatCallback, isLoggedIn, error } = useAuth();
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current || isLoggedIn) return;
    hasCalled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      console.error('【微信回调】缺少 code 或 state 参数');
      return;
    }

    handleWechatCallback(code, state).then(() => {
      // 登录成功后，跳转到登录前的页面或首页
      const prePath = sessionStorage.getItem('pre_login_path') || 'home';
      sessionStorage.removeItem('pre_login_path');
      // 清除 URL 中的敏感参数
      window.history.replaceState({}, '', prePath);
      onNavigate(prePath);
    });
  }, [handleWechatCallback, isLoggedIn, onNavigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center max-w-md mx-auto px-6">
      {error ? (
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">授权失败</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => onNavigate('profile')}
            className="bg-brand-500 text-white text-sm px-6 py-2.5 rounded-full font-medium"
          >
            返回
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-700">正在登录…</h2>
          <p className="text-sm text-gray-400 mt-2">正在获取您的微信信息</p>
        </div>
      )}
    </div>
  );
}
