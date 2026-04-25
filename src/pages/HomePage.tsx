import { useApp } from '../context/AppContext';
import { EMOTION_MAP, PUA_TYPE_COLORS, PRACTICE_SCENARIOS } from '../data';
import { getRiskInfo, formatTime } from '../utils';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const EMOTIONS = ['愤怒', '委屈', '焦虑', '失落', '麻木'] as const;

export default function HomePage({ onNavigate }: HomePageProps) {
  const { testHistory, diaries, userIndustry, userWorkYears, practiceCount, appName } = useApp();
  const today = new Date();
  const currentMonth = today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  const latestTest = testHistory[0];
  const latestRisk = latestTest ? getRiskInfo(latestTest.score) : null;

  const emotionCalendar = diaries.reduce<Record<string, string>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = d.emotion;
    return acc;
  }, {});

  const emotionStats = EMOTIONS.map(e => ({
    emotion: e,
    count: diaries.filter(d => d.emotion === e).length,
    pct: diaries.length ? Math.round(diaries.filter(d => d.emotion === e).length / diaries.length * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-4 pb-8 pt-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm opacity-80">{userIndustry} · {userWorkYears}</p>
            <h1 className="text-xl font-bold mt-0.5">{appName}</h1>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">🌿</div>
        </div>
        <p className="text-xs opacity-70 mt-1">你的感受是真实的，许多人有类似经历</p>
      </div>

      <div className="px-4 space-y-4 -mt-4">
        {/* Risk Score Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">职场环境评估</span>
            {latestRisk && (
              <span className={`tag ${latestRisk.bg} ${latestRisk.color}`}>
                {latestRisk.emoji} {latestRisk.level}
              </span>
            )}
          </div>
          {latestTest ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-3xl font-bold ${latestRisk?.color}`}>{latestTest.score}</span>
                <span className="text-sm text-gray-400">/100</span>
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: `${latestTest.score}%` }} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">测试时间：{formatTime(new Date(latestTest.date).getTime())}</p>
              <button onClick={() => onNavigate('report', { result: latestTest })} className="btn-secondary text-xs">
                查看完整报告 →
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-3">还没有进行过职场环境评估</p>
              <button onClick={() => onNavigate('test')} className="btn-primary text-sm">
                📖 立即开始测试
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📖', label: '识别测试', page: 'test', color: 'from-blue-50 to-blue-100', textColor: 'text-blue-600', sub: '了解PUA套路' },
            { icon: '🎭', label: '情景练习室', page: 'tools', color: 'from-orange-50 to-orange-100', textColor: 'text-orange-600', sub: 'AI模拟练应对', params: { tab: 'practice' } },
            { icon: '📝', label: '写日记', page: 'treehole', color: 'from-green-50 to-green-100', textColor: 'text-green-600', sub: '记录真实感受' },
            { icon: '💬', label: '互助社区', page: 'community', color: 'from-purple-50 to-purple-100', textColor: 'text-purple-600', sub: '找到同类人' },
          ].map(item => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page, item.params as any)}
              className={`card flex flex-col items-center gap-1 py-3 bg-gradient-to-br ${item.color} active:scale-95 transition-transform`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
              <span className="text-[10px] text-gray-400">{item.sub}</span>
            </button>
          ))}
        </div>

        {/* 💬 9.9 咨询入口 */}
        <div
          className="card bg-gradient-to-br from-brand-500 to-brand-600 text-white cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onNavigate('consult')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">💬</div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold">专属职场咨询</span>
                  <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-medium">¥9.9</span>
                </div>
                <p className="text-xs opacity-80">AI 顾问在线 · 识别PUA · 情绪疏导 · 去留分析</p>
              </div>
            </div>
            <span className="text-white/70 text-lg shrink-0">›</span>
          </div>
        </div>

        {/* 🌟 Featured: Practice Scenarios */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-brand-500">🎭</span>
              <span className="text-sm font-semibold text-gray-700">情景练习室</span>
            </div>
            <div className="flex items-center gap-2">
              {practiceCount > 0 && (
                <span className="tag bg-green-50 text-green-600 text-xs">已练习 {practiceCount} 次</span>
              )}
              <button onClick={() => onNavigate('tools', { tab: 'practice' })} className="text-xs text-brand-500">查看全部 →</button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">AI扮演施加压力的一方，练习设立边界</p>
          <div className="grid grid-cols-3 gap-2">
            {PRACTICE_SCENARIOS.slice(0, 3).map(s => (
              <button
                key={s.id}
                onClick={() => onNavigate('practice', { scenario: s })}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 text-center active:scale-95 transition-transform"
              >
                <span className="text-2xl block mb-1">{s.icon}</span>
                <p className="text-xs text-gray-600 leading-tight">{s.title}</p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1,2,3].map(d => <span key={d} className={`text-[8px] ${d <= s.difficulty ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}
                </div>
              </button>
            ))}
          </div>
          {PRACTICE_SCENARIOS.length > 3 && (
            <button
              onClick={() => onNavigate('tools', { tab: 'practice' })}
              className="w-full mt-2 py-2 bg-gray-50 rounded-xl text-xs text-gray-400 text-center active:scale-[0.98] transition-transform"
            >
              还有 {PRACTICE_SCENARIOS.length - 3} 个场景，点击查看 →
            </button>
          )}
        </div>

        {/* Emotion Calendar */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">情绪日历</span>
            <span className="text-xs text-gray-400">{currentMonth}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
            {Array.from({ length: (today.getDay() || 7) - 1 }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: today.getDate() }, (_, i) => {
              const day = i + 1;
              const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const emotion = emotionCalendar[dateStr];
              return (
                <div key={day} className={`aspect-square rounded-lg flex items-center justify-center text-sm relative ${day === today.getDate() ? 'bg-brand-500 text-white font-bold ring-2 ring-brand-300' : 'bg-gray-50'}`}>
                  {day}
                  {emotion && <span className="absolute -bottom-0.5 text-[8px]">{EMOTION_MAP[emotion]}</span>}
                </div>
              );
            })}
          </div>
          {emotionStats.some(e => e.count > 0) && (
            <div className="space-y-1.5">
              {emotionStats.filter(e => e.count > 0).map(e => (
                <div key={e.emotion} className="flex items-center gap-2">
                  <span className="text-sm w-6">{EMOTION_MAP[e.emotion]}</span>
                  <div className="flex-1 progress-bar">
                    <div className="progress-fill !bg-brand-400" style={{ width: `${e.pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{e.count}天</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PUA Type Distribution */}
        {latestTest && (
          <div className="card">
            <span className="text-sm font-semibold text-gray-700 block mb-3">问题行为分布</span>
            <div className="space-y-2.5">
              {Object.entries(latestTest.counts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const info = PUA_TYPE_COLORS[type] || {};
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-sm w-5">{info.emoji || '•'}</span>
                      <span className="text-xs text-gray-600 w-20">{type}</span>
                      <div className="flex-1 progress-bar">
                        <div className="progress-fill" style={{ width: `${(count / 2) * 100}%`, background: '#f87171' }} />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">×{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
