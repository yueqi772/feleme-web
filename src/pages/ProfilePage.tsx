import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EMOTION_MAP } from '../data';
import { getRiskInfo, formatTime } from '../utils';
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
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(deepseekKey);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const today = new Date().toISOString().slice(0, 10);
  const todayDiaries = diaries.filter(d => d.date === today);

  const handleSaveApiKey = () => {
    setDeepseekKey(apiKeyInput.trim());
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-4 pb-8 pt-4">
        <div className="wx-safe-area-top" />
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">🌿</div>
          <div>
            <h1 className="text-lg font-bold">{appName}</h1>
            <p className="text-sm opacity-80">{userIndustry} · {userWorkYears}</p>
            <p className="text-xs opacity-60 mt-0.5">使用 {Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24))} 天</p>
          </div>
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
