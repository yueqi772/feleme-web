import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PUA_TYPE_COLORS, INDUSTRY_MAP } from '../data';
import { formatTime } from '../utils';
import type { Industry, PuaType, PostType } from '../types';

interface CommunityPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const INDUSTRIES: (Industry | '全部')[] = ['全部', '互联网', '教育', '金融', '医疗', '其他'];
const POST_TYPES: { id: PuaType | '全部'; label: string }[] = [
  { id: '全部', label: '全部' },
  { id: '画大饼', label: '画大饼' },
  { id: '煤气灯效应', label: '煤气灯' },
  { id: '情感勒索', label: '情感勒索' },
  { id: '边界侵犯', label: '边界侵犯' },
  { id: '否定价值', label: '否定价值' },
];

export default function CommunityPage({ onNavigate }: CommunityPageProps) {
  const { posts, toggleLike, toggleResonate } = useApp();
  const [industryFilter, setIndustryFilter] = useState<Industry | '全部'>('全部');
  const [typeFilter, setTypeFilter] = useState<PuaType | '全部'>('全部');

  const filtered = posts.filter(p => {
    if (industryFilter !== '全部' && p.industry !== industryFilter) return false;
    if (typeFilter !== '全部' && !p.tags.includes(typeFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-3 space-y-3 pb-8">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-1.5 shrink-0">
            {INDUSTRIES.map(ind => (
              <button
                key={ind}
                onClick={() => setIndustryFilter(ind)}
                className={`tag transition-colors shrink-0 ${industryFilter === ind ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {ind === '全部' ? '全部' : `${INDUSTRY_MAP[ind] || ''} ${ind}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-1.5 shrink-0">
            {POST_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`tag transition-colors shrink-0 ${typeFilter === t.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {t.id === '全部' ? '全部' : (PUA_TYPE_COLORS[t.id]?.emoji || '') + ' ' + t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl">💬</span>
              <p className="text-sm text-gray-400 mt-2">还没有相关帖子</p>
              <button onClick={() => onNavigate('new-post')} className="btn-secondary text-xs mt-3">发第一个帖子</button>
            </div>
          )}
          {filtered.map(post => {
            const typeInfo = PUA_TYPE_COLORS[post.tags[0]] || PUA_TYPE_COLORS['否定价值'];
            const typeLabel: Record<PostType, string> = { '吐槽': '📢吐槽帖', '经验': '💡经验帖', '求助': '❓求助帖' };
            return (
              <button
                key={post.id}
                onClick={() => onNavigate('post-detail', { post })}
                className="card w-full text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs text-gray-400">{INDUSTRY_MAP[post.industry]} {post.industry}·{post.workYears}</span>
                  <span className={`tag text-xs ${typeInfo.bg} ${typeInfo.text}`}>
                    {typeLabel[post.type]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1.5">{post.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">{post.content}</p>
                <div className="flex items-center gap-3">
                  <button onClick={e => { e.stopPropagation(); toggleLike(post.id); }} className={`flex items-center gap-1 text-xs ${post.liked ? 'text-brand-500' : 'text-gray-400'}`}>
                    👍 {post.likes}
                  </button>
                  <button onClick={e => { e.stopPropagation(); toggleResonate(post.id); }} className={`flex items-center gap-1 text-xs ${post.resonated ? 'text-purple-500' : 'text-gray-400'}`}>
                    🤝 {post.resonances}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-gray-400">💬 {post.comments}</span>
                  <span className="ml-auto text-xs text-gray-300">{formatTime(post.timestamp)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
