import { useApp } from '../context/AppContext';
import { getRiskInfo, formatDate } from '../utils';

interface TestHistoryPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function TestHistoryPage({ onNavigate }: TestHistoryPageProps) {
  const { testHistory } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('profile')} className="text-brand-500 text-sm">← 返回</button>
        <span className="text-sm font-semibold text-gray-700">识别测试历史</span>
        
      </div>

      <div className="px-4 pt-4 space-y-4 pb-8">
        {testHistory.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl">🔍</span>
            <p className="text-sm text-gray-400 mt-2">还没有测试记录</p>
            <button onClick={() => onNavigate('test')} className="btn-primary text-sm mt-4">去测试</button>
          </div>
        )}
        {testHistory.map((t, i) => {
          const risk = getRiskInfo(t.score);
          const topTypes = Object.entries(t.counts)
            .filter(([, c]) => c > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2);
          return (
            <button
              key={t.id}
              onClick={() => onNavigate('report', { result: t })}
              className="card w-full text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{risk.emoji}</span>
                  <span className={`text-sm font-semibold ${risk.color}`}>{risk.level}</span>
                  <span className="text-lg font-bold text-gray-800">{t.score}分</span>
                </div>
                <span className="text-xs text-gray-400">{i === 0 ? '最新' : `#${testHistory.length - i}`}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{formatDate(t.date)}</p>
              <div className="flex gap-2">
                {topTypes.map(([type, count]) => (
                  <span key={type} className="text-xs text-gray-500">🔸{type} ×{count}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
