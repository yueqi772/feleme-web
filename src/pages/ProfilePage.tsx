import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/AuthContext';
import { EMOTION_MAP } from '../data';
import { getRiskInfo, formatTime } from '../utils';
import { isWechatLoginConfigured, getWechatAuthUrl } from '../auth/wechat';
import { isRunningInMiniProgram } from '../auth/miniprogram';
import type { Industry, WorkYears } from '../types';

interface ProfilePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const INDUSTRIES: Industry[] = ['互联网', '教育', '金融', '医疗', '其他'];
const WORK_YEARS: WorkYears[] = ['1年以内', '1-3年', '3-5年', '5年以上'];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const {
    testHistory, diaries, achievements, practiceCount, favoriteScripts,
    setUserInfo, userIndustry, userWorkYears, joinDate,
    isDarkMode, toggleDarkMode, deepseekKey, setDeepseekKey, appName,
  } = useApp();
  const { isLoggedIn, wechatUser, loginWithWechat, logout, isLoading: authLoading, error: authError, clearError } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(deepseekKey);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const today = new Date().toISOString().slice(0, 10);
  const todayDiaries = diaries.filter(d => d.date === today);
  const inMiniProgram = isRunningInMiniProgram();

  const handleSaveApiKey = () => {
    setDeepseekKey(apiKeyInput.trim());
    setShowSettings(false);
  };

  const handleMpLoginHint = () => {
    // 在 H5 环境提示用户打开小程序
    wx?.showModal?.({
      title: '请在微信小程序中登录',
      content: '请在微信中搜索"职场清醒笔记"小程序 → 首页 → 点击"微信授权登录"',
      showCancel: false,
    }) || alert('请在微信中搜索"职场清醒笔记"小程序，从首页点击"微信授权登录"');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-4 pb-8 pt-4">
        <div className="wx-safe-area-top" />
        <div className="flex items-center gap-3">
          {isLoggedIn && wechatUser?.headimgurl ? (
            <img
              src={wechatUser.headimgurl}
              alt={wechatUser.nickname}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">🌿</div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold">{isLoggedIn ? wechatUser?.nickname || appName : appName}</h1>
            {isLoggedIn ? (
              <p className="text-xs opacity-80 truncate">微信授权用户</p>
            ) : (
              <>
                <p className="text-sm opacity-80">{userIndustry} · {userWorkYears}</p>
                <p className="text-xs opacity-60 mt-0.5">使用 {Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24))} 天</p>
              </>
            )}
          </div>
        </div>

        {/* 微信登录 / 退出登录按钮 */}
        <div className="mt-4">
          {isLoggedIn ? (
            <div className="space-y-2">
              {authError && (
                <div className="bg-red-500/20 text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>{authError}</span>
                  <button onClick={clearError} className="opacity-70 hover:opacity-100">✕</button>
                </div>
              )}
              <button
                onClick={logout}
                className="w-full bg-white/15 hover:bg-white/25 text-white text-sm py-2 rounded-lg font-medium transition-colors"
              >
                退出登录
              </button>
            </div>
          ) : inMiniProgram ? (
            // 小程序环境：不显示登录按钮（由小程序容器处理登录）
            <div className="bg-white/10 text-white/70 text-xs text-center py-2 rounded-lg">
              {inMiniProgram ? '小程序环境登录' : '请在小程序内登录'}
            </div>
          ) : isWechatLoginConfigured() ? (
            <button
              onClick={loginWithWechat}
              disabled={authLoading}
              className="w-full bg-white text-brand-600 text-sm py-2.5 rounded-lg font-semibold hover:bg-brand-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                  登录中…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.004-.272-.012-.406-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                  微信登录
                </>
              )}
            </button>
          ) : (
            // 未配置任何登录方式时，提示用户打开小程序
            <button
              onClick={handleMpLoginHint}
              className="w-full bg-white/15 hover:bg-white/25 text-white text-sm py-2.5 rounded-lg font-medium transition-colors"
            >
              打开小程序登录
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 -mt-4 pt-4 pb-8">
        {/* Stats */}
        <div className="card">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: '测试', value: testHistory.length, icon: '🔍' },
              { label: '日记', value: diaries.length, icon: '📝' },
              { label: '练习', value: practiceCount, icon: '🎭' },
              { label: '话术', value: favoriteScripts.length, icon: '💬' },
            ].map(s => (
              <div key={s.label} className="py-2">
                <p className="text-lg font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Today's mood */}
        {todayDiaries.length > 0 && (
          <div className="card bg-brand-50">
            <p className="text-xs font-semibold text-brand-700 mb-2">今天的情绪</p>
            <div className="flex gap-2">
              {todayDiaries.map(d => (
                <span key={d.id} className="text-2xl">{EMOTION_MAP[d.emotion]}</span>
              ))}
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-1">
          {[
            { icon: '📊', label: '识别测试历史', page: 'test-history' },
            { icon: '📅', label: '情绪日历', page: 'emotion-calendar' },
            { icon: '🏅', label: '我的成就', page: 'achievements', badge: `${unlockedAchievements.length}/${achievements.length}` },
            { icon: '⚖️', label: '离职决策助手', page: 'leave-decision' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => item.page === 'test-history' && onNavigate('test-history')}
              className="card w-full flex items-center gap-3 py-3 active:scale-[0.99] transition-transform"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
              {item.badge && <span className="text-xs text-gray-400">{item.badge}</span>}
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>

        {/* Recent Test Results */}
        {testHistory.length > 0 && (
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">最近测试</p>
            <div className="space-y-2">
              {testHistory.slice(0, 3).map(t => {
                const risk = getRiskInfo(t.score);
                return (
                  <div key={t.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span>{risk.emoji}</span>
                      <span className="text-sm text-gray-700">{risk.level} · {t.score}分</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatTime(new Date(t.date).getTime())}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">设置</p>
          <button onClick={() => setShowSettings(s => !s)} className="w-full flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span className="text-sm text-gray-700">个人信息</span>
            </div>
            <span className="text-gray-300">›</span>
          </button>
          {showSettings && (
            <div className="space-y-3 mt-2 pt-2 border-t">
              <div>
                <label className="text-xs text-gray-500">行业</label>
                <select
                  value={userIndustry}
                  onChange={e => setUserInfo(e.target.value as Industry, userWorkYears)}
                  className="w-full mt-1 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">工作年限</label>
                <select
                  value={userWorkYears}
                  onChange={e => setUserInfo(userIndustry, e.target.value as WorkYears)}
                  className="w-full mt-1 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                >
                  {WORK_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">DeepSeek API Key</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  />
                  <button onClick={handleSaveApiKey} className="bg-brand-500 text-white text-xs px-3 py-2 rounded-lg">
                    保存
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {deepseekKey ? '✅ 已设置' : '⚠️ 未设置，请填写后保存'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🌙</span>
                  <span className="text-sm text-gray-700">暗黑模式</span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-brand-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-300">{appName} v1.0</p>
          <p className="text-xs text-gray-300 mt-0.5">你的感受是真实的</p>
        </div>
      </div>
    </div>
  );
}
