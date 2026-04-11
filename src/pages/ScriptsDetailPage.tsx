import type { ScriptItem } from '../types';
import { useApp } from '../context/AppContext';

interface ScriptsDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  script: ScriptItem;
}

export default function ScriptsDetailPage({ onNavigate, script }: ScriptsDetailPageProps) {
  const { toggleFavoriteScript, favoriteScripts } = useApp();
  const isFav = (id: string) => favoriteScripts.includes(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('tools')} className="text-brand-500 text-sm">← 返回</button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{script.sceneIcon}</span>
          <span className="font-semibold text-gray-700">{script.scene}</span>
        </div>
        
      </div>

      <div className="px-4 space-y-4 pt-4 pb-8">
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-1">使用说明</p>
          <p className="text-xs text-gray-500 leading-relaxed">{script.benefit}</p>
        </div>

        <p className="text-sm font-semibold text-gray-700 px-1">推荐话术</p>
        {script.scripts.map((s, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
              </div>
              <button
                onClick={() => {
                  toggleFavoriteScript(`${script.id}-${i}`);
                  navigator.clipboard?.writeText(s);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${isFav(`${script.id}-${i}`) ? 'bg-brand-50 border-brand-300 text-brand-600' : 'bg-white border-gray-200 text-gray-400'}`}
              >
                {isFav(`${script.id}-${i}`) ? '★ 已收藏' : '☆ 收藏'}
              </button>
            </div>
            {isFav(`${script.id}-${i}`) && (
              <p className="text-xs text-green-600 mt-1.5">✓ 已复制到剪贴板</p>
            )}
          </div>
        ))}

        <div className="card bg-amber-50">
          <p className="text-xs font-semibold text-amber-700 mb-1">💡 使用技巧</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            不要死记硬背，理解背后的逻辑：<strong>承认对方的情绪 + 清晰表达你的边界 + 给出替代方案</strong>。灵活运用比照搬话术更有效。
          </p>
        </div>

        <button onClick={() => onNavigate('practice')} className="w-full btn-primary py-3">
          🎭 去情景练习室模拟练习
        </button>
      </div>
    </div>
  );
}
