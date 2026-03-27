import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PUA_TYPE_COLORS } from '../data';
import type { Industry, WorkYears, PuaType, PostType } from '../types';

interface NewPostPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

const INDUSTRIES: Industry[] = ['互联网', '教育', '金融', '医疗', '其他'];
const WORK_YEARS: WorkYears[] = ['1年以内', '1-3年', '3-5年', '5年以上'];
const POST_TYPES: PostType[] = ['吐槽', '经验', '求助'];
const PUA_TAGS: PuaType[] = ['画大饼', '煤气灯效应', '情感勒索', '边界侵犯', '否定价值'];

export default function NewPostPage({ onNavigate }: NewPostPageProps) {
  const { addPost, userIndustry, userWorkYears, unlockAchievement } = useApp();
  const [postType, setPostType] = useState<PostType>('吐槽');
  const [industry, setIndustry] = useState<Industry>(userIndustry);
  const [workYears, setWorkYears] = useState<WorkYears>(userWorkYears);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<PuaType[]>([]);

  function submit() {
    if (!title.trim() || !content.trim()) return;
    const post = {
      id: Date.now().toString(36),
      type: postType,
      industry,
      workYears,
      title,
      content,
      tags,
      likes: 0,
      resonances: 0,
      comments: 0,
      timestamp: Date.now(),
    };
    addPost(post);
    unlockAchievement('a4');
    onNavigate('community');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('community')} className="text-gray-400 text-sm">取消</button>
        <span className="text-sm font-semibold text-gray-700">发布帖子</span>
        <button onClick={submit} disabled={!title.trim() || !content.trim()} className="text-brand-500 text-sm font-semibold disabled:opacity-40">发布</button>
      </div>

      <div className="px-4 space-y-4 pt-4 pb-8">
        <div className="card">
          <p className="text-xs font-semibold text-gray-700 mb-2">帖子类型</p>
          <div className="flex gap-2">
            {POST_TYPES.map(t => {
              const icons: Record<PostType, string> = { '吐槽': '📢', '经验': '💡', '求助': '❓' };
              return (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm border-2 transition-colors ${postType === t ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}
                >
                  {icons[t]}{t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-gray-700 mb-2">你的身份（模糊显示）</p>
          <div className="flex gap-2">
            <select value={industry} onChange={e => setIndustry(e.target.value as Industry)} className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm">
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select value={workYears} onChange={e => setWorkYears(e.target.value as WorkYears)} className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm">
              {WORK_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">→ 将显示为 "{industry}·{workYears}"</p>
        </div>

        <div className="card">
          <input
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 30))}
            placeholder="写个标题...（30字内）"
            className="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none"
          />
          <p className="text-xs text-gray-400 text-right">{title.length}/30</p>
        </div>

        <div className="card">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="说说你的故事...（1000字内）"
            maxLength={1000}
            rows={8}
            className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none"
          />
          <p className="text-xs text-gray-400 text-right">{content.length}/1000</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-gray-700 mb-2">职场压力类型（可多选）</p>
          <div className="flex flex-wrap gap-2">
            {PUA_TAGS.map(t => {
              const info = PUA_TYPE_COLORS[t];
              return (
                <button
                  key={t}
                  onClick={() => setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])}
                  className={`tag transition-colors ${tags.includes(t) ? `${info.bg} ${info.text} ring-1 ring-current` : 'bg-gray-100 text-gray-400'}`}
                >
                  {info.emoji} {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
