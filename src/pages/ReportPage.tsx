import type { TestResult } from '../types';
import { getRiskInfo, formatDate } from '../utils';
import { PUA_TYPE_COLORS } from '../data';

interface ReportPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  result: TestResult;
}

export default function ReportPage({ onNavigate, result }: ReportPageProps) {
  const risk = getRiskInfo(result.score);
  const sortedTypes = Object.entries(result.counts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a) as [string, number][];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="wx-nav-bar bg-transparent flex items-center justify-between px-4 py-2">
        <button onClick={() => onNavigate('home')} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-500">✕</button>
        <span className="text-sm font-semibold text-gray-700">侦探报告</span>
        <div className="w-8" />
      </div>

      <div className="px-4 space-y-4 pt-2 pb-8">
        {/* Hero Score */}
        <div className={`card text-center py-8 ${risk.bg}`}>
          <p className="text-sm text-gray-500 mb-2">你的职场环境</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl">{risk.emoji}</span>
            <div className="text-left">
              <p className={`text-3xl font-bold ${risk.color}`}>{result.score}</p>
              <p className="text-sm text-gray-500">/100</p>
            </div>
          </div>
          <p className={`tag text-sm px-4 py-1.5 ${risk.bg} ${risk.color} mx-auto`} style={{ width: 'fit-content' }}>
            {risk.desc}
          </p>
          <p className="text-xs text-gray-400 mt-3">识别准确率 {Math.round((result.totalAnswered / 12) * 100)}% · {formatDate(result.date)}</p>
        </div>

        {/* Hotlines for high risk */}
        {result.riskLevel === '高危' && (
          <div className="card bg-red-50 border border-red-100">
            <p className="text-sm font-semibold text-red-700 mb-2">⚠️ 如果你现在感到很难受...</p>
            <p className="text-xs text-red-600 mb-2">你不是一个人。以下资源可以帮你：</p>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700">全国心理援助热线</p>
                <p className="text-sm text-red-600 font-bold">400-161-9995</p>
                <p className="text-xs text-gray-400">24小时</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700">北京心理危机研究与干预中心</p>
                <p className="text-sm text-red-600 font-bold">010-82951332</p>
                <p className="text-xs text-gray-400">24小时</p>
              </div>
            </div>
          </div>
        )}

        {/* Problem Types */}
        {sortedTypes.length > 0 ? (
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-3">发现的问题行为</p>
            <div className="space-y-3">
              {sortedTypes.map(([type, count]) => {
                const info = PUA_TYPE_COLORS[type] || PUA_TYPE_COLORS['否定价值'];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xl">{info.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                        <span className="text-xs text-gray-400">× {count}次</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(count / 2) * 100}%`, background: '#f87171' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card text-center py-6">
            <span className="text-3xl">🎉</span>
            <p className="text-sm text-gray-500 mt-2">在所有场景中，你都没有发现问题行为</p>
          </div>
        )}

        {/* Quote */}
        <div className="card bg-brand-50 text-center">
          <p className="text-lg italic text-brand-700">"你的感受是真实的。"</p>
          <p className="text-xs text-brand-500 mt-1">— 职场清醒笔记</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => onNavigate('treehole')} className="flex-1 btn-primary py-3">
            🌳 去树洞倾诉
          </button>
          <button onClick={() => onNavigate('tools', { tab: 'scripts' })} className="flex-1 btn-secondary py-3">
            🛡️ 学应对技巧
          </button>
        </div>

        {/* Histogram of test history could go here */}
        <div className="card">
          <p className="text-xs text-gray-400 text-center">你的测试结果已保存，可以在「我的」→「识别测试历史」中查看</p>
        </div>
      </div>
    </div>
  );
}
