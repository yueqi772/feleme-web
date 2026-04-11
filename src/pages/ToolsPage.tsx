import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SCRIPT_LIBRARY, PRACTICE_SCENARIOS } from '../data';

interface ToolsPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  initialTab?: string;
}

export default function ToolsPage({ onNavigate, initialTab }: ToolsPageProps) {
  const { achievements } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab === 'scripts' ? 'scripts' : 'practice');
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 pb-3 pt-2">
        <div className="wx-safe-area-top" />
        <h1 className="text-lg font-bold text-gray-800">🔧 应对工具箱</h1>
        <p className="text-xs text-gray-400 mt-0.5">学会保护自己，从容应对职场</p>
      </div>

      <div className="px-4 space-y-4 pt-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setActiveTab('scripts')} className={`card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform ${activeTab === 'scripts' ? 'ring-2 ring-brand-400 bg-brand-50' : ''}`}>
            <span className="text-3xl">📚</span>
            <span className="text-sm font-semibold text-gray-700">话术库</span>
            <span className="text-xs text-gray-400">5大场景 · {SCRIPT_LIBRARY.reduce((a, s) => a + s.scripts.length, 0)}条</span>
          </button>
          <button onClick={() => setActiveTab('practice')} className={`card flex flex-col items-center gap-2 py-5 active:scale-95 transition-transform ${activeTab === 'practice' ? 'ring-2 ring-brand-400 bg-brand-50' : ''}`}>
            <span className="text-3xl">🎭</span>
            <span className="text-sm font-semibold text-gray-700">情景练习室</span>
            <span className="text-xs text-gray-400">模拟对话 · AI反馈</span>
          </button>
        </div>

        {activeTab === 'scripts' && (
          <div className="space-y-3">
            {SCRIPT_LIBRARY.map(item => (
              <button key={item.id} onClick={() => onNavigate('scripts-detail', { script: item })} className="card w-full text-left active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{item.sceneIcon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{item.scene}</p>
                    <p className="text-xs text-gray-400">{item.scripts.length} 条推荐话术</p>
                  </div>
                  <span className="ml-auto text-gray-300">›</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{item.scripts[0]}</p>
                <p className="text-xs text-brand-500 mt-1.5">查看全部 →</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-3">
            {PRACTICE_SCENARIOS.map(s => (
              <button key={s.id} onClick={() => onNavigate('practice', { scenario: s })} className="card w-full text-left active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">{s.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">难度</span>
                      <div className="flex gap-0.5">
                        {[1,2,3].map(d => <span key={d} className={`text-xs ${d <= s.difficulty ? 'text-amber-400' : 'text-gray-200'}`}>★</span>)}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-300">›</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">我的成就</span>
            <span className="text-xs text-gray-400">{unlockedAchievements.length}/{achievements.length} 已解锁</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {achievements.map(a => (
              <div key={a.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${a.unlocked ? 'bg-brand-50' : 'bg-gray-50 opacity-50'}`}>
                <span className={`text-xl ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                <span className="text-xs text-gray-600 text-center leading-tight">{a.name}</span>
                {!a.unlocked && <span className="text-[10px] text-gray-400">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
