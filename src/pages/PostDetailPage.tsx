import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PUA_TYPE_COLORS, INDUSTRY_MAP } from '../data';
import { formatTime, generateId } from '../utils';
import type { Post, Comment } from '../types';

interface PostDetailPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  post: Post;
}


export default function PostDetailPage({ onNavigate, post }: PostDetailPageProps) {
  const { posts, comments: allComments, toggleLike, toggleResonate, addComment, userIndustry, userWorkYears } = useApp();
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const livePost = posts.find(p => p.id === post.id) || post;
  const postComments = allComments[post.id] || [];
  
  function handleComment() {
    if (!commentInput.trim()) return;
    const comment: Comment = {
      id: generateId(),
      postId: post.id,
      industry: userIndustry,
      workYears: userWorkYears,
      content: commentInput,
      likes: 0,
      timestamp: Date.now(),
    };
    addComment(post.id, comment);
    setCommentInput('');
    setShowCommentBox(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-white flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('community')} className="text-brand-500 text-sm">← 返回</button>
        <span className="text-sm font-semibold text-gray-700">帖子详情</span>
        
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Post */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm">
              {INDUSTRY_MAP[livePost.industry]}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{livePost.industry} · {livePost.workYears}</p>
              <p className="text-xs text-gray-400">{formatTime(livePost.timestamp)}</p>
            </div>
          </div>
          <h2 className="text-base font-bold text-gray-800 mb-2">{livePost.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{livePost.content}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {livePost.tags.map(t => {
              const info = PUA_TYPE_COLORS[t];
              return (
                <span key={t} className={`tag text-xs ${info.bg} ${info.text}`}>
                  {info.emoji} {t}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => toggleLike(livePost.id)} className={`flex items-center gap-1.5 text-sm ${livePost.liked ? 'text-brand-500' : 'text-gray-400'}`}>
            👍 {livePost.likes}
          </button>
          <button onClick={() => toggleResonate(livePost.id)} className={`flex items-center gap-1.5 text-sm ${livePost.resonated ? 'text-purple-500' : 'text-gray-400'}`}>
            🤝 {livePost.resonances} 我也有过
          </button>
          <span className="flex items-center gap-1 text-sm text-gray-400 ml-auto">
            💬 {livePost.comments}
          </span>
        </div>

        {/* Comment input */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-3">评论</p>
          {showCommentBox ? (
            <div className="space-y-2">
              <textarea
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowCommentBox(false); setCommentInput(''); }} className="text-xs text-gray-400 px-3 py-1.5">取消</button>
                <button onClick={handleComment} disabled={!commentInput.trim()} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">发布</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCommentBox(true)} className="w-full py-3 bg-gray-50 rounded-xl text-sm text-gray-400 text-center">
              写下你的评论...
            </button>
          )}
        </div>

        {/* Comments */}
        {postComments.length > 0 && (
          <div className="space-y-3">
            {postComments.map(c => (
              <div key={c.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500">
                    {INDUSTRY_MAP[c.industry]}
                  </div>
                  <span className="text-xs text-gray-500">{c.industry} · {c.workYears}</span>
                  <span className="text-xs text-gray-300 ml-auto">{formatTime(c.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="text-xs text-gray-400 mt-1.5">回复</button>
                {replyTo === c.id && (
                  <div className="mt-2 space-y-1.5">
                    {c.replies?.map(r => (
                      <div key={r.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2">
                        <span className="text-xs text-gray-500">{r.industry}·{r.workYears}:</span>
                        <p className="text-xs text-gray-600">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
