import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getRiskInfo, formatDate } from '../utils';
import { image_synthesize } from 'image_synthesize';
import type { TestResult } from '../types';

interface TestHistoryPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function TestHistoryPage({ onNavigate }: TestHistoryPageProps) {
  const { testHistory, appName } = useApp();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const generateSharePoster = async (t: TestResult) => {
    setGeneratingId(t.id);
    const risk = getRiskInfo(t.score);
    const dateStr = formatDate(t.date);
    const prompt = `A clean, modern social media share card for workplace wellness app "${appName}". Square 1:1 format. 

Card layout: White rounded card on light gray background. Top has app name "${appName} · 职场清醒笔记" in small text. Center has large score ${t.score}/100 in bold teal (#0d9488). Below shows risk level "${risk.level}" with emoji ${risk.emoji}. Bottom shows date "${dateStr}" and tagline "你的感受是真实的". 

Style: Modern Chinese app aesthetic, minimal, professional, warm. Soft shadow, rounded corners. Decorative leaf 🌿 icon. No English text except score.`;

    try {
      const result = await image_synthesize({
        requests: [{
          prompt,
          output_file: `/tmp/poster_${t.id}.png`,
          aspect_ratio: '1:1',
          resolution: '1K',
        }],
      });
      if (result?.[0]?.output_file) {
        // Trigger download
        const link = document.createElement('a');
        link.href = `file://${result[0].output_file}`;
        link.download = `${appName}_测试报告_${t.date}.png`;
        link.click();
      }
    } catch (e) {
      console.error('Failed to generate poster:', e);
    }
    setGeneratingId(null);
  };

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
            <div key={t.id} className="card">
              <button
                onClick={() => onNavigate('report', { result: t })}
                className="w-full text-left active:scale-[0.99] transition-transform"
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
                <div className="flex gap-2 flex-wrap">
                  {topTypes.map(([type, count]) => (
                    <span key={type} className="text-xs text-gray-500">🔸{type} ×{count}</span>
                  ))}
                </div>
              </button>
              <button
                onClick={() => generateSharePoster(t)}
                disabled={generatingId === t.id}
                className={`mt-3 w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-transform active:scale-[0.98] ${
                  generatingId === t.id
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gradient-to-r from-brand-50 to-brand-100 text-brand-600'
                }`}
              >
                {generatingId === t.id ? '生成中...' : '🎨 生成分享海报'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
