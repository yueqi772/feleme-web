import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
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
  const [shareImgUrl, setShareImgUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // dataURL → File 对象
  function dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? 'image/png';
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  }

  // 生成分享卡片并尝试直接调起系统分享
  async function generateShareCard() {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');

      // 优先用 Web Share API 直接分享图片（手机端可直接发到微信等）
      if (navigator.share && navigator.canShare) {
        const file = dataUrlToFile(dataUrl, 'feleme-report.png');
        const shareData: ShareData = {
          title: `我测了一下职场环境，抗PUA能力：${result.score}分（${risk.desc}）`,
          text: '你也来测测？职场PUA识别，免费测试 🕵️',
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
            return; // 分享成功，不弹预览窗
          } catch (err) {
            // 用户取消分享，也不弹窗，静默处理
            if ((err as Error).name === 'AbortError') return;
          }
        }
      }

      // 降级：弹出图片预览，让用户长按保存
      setShareImgUrl(dataUrl);
    } catch (e) {
      console.error('生成分享卡片失败', e);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }

  function closeShareCard() {
    setShareImgUrl('');
  }

  const topTypes = sortedTypes.slice(0, 3);

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
          <p className="text-sm text-gray-500 mb-2">抗PUA能力</p>
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
          <p className="text-xs text-gray-400 mt-3">完成 {result.totalAnswered} 题 · {formatDate(result.date)}</p>
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
          <p className="text-xs text-brand-500 mt-1">— A里味</p>
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

        {/* 分享按钮 */}
        <button
          onClick={generateShareCard}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#07c160] to-[#00a854] text-white rounded-xl py-3.5 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
        >
          {generating ? (
            <>
              <span className="animate-spin inline-block">⏳</span> 生成中...
            </>
          ) : shareSuccess ? (
            <>✅ 分享成功！</>
          ) : (
            <>📸 生成卡片，分享给朋友炫耀</>
          )}
        </button>

        <div className="card">
          <p className="text-xs text-gray-400 text-center">你的测试结果已保存，可以在「我的」→「识别测试历史」中查看</p>
        </div>
      </div>

      {/* ── 隐藏的卡片模板（用于截图） ─────────────────────── */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '360px',
          background: 'linear-gradient(135deg, #fff9f0 0%, #fff 60%, #f0faf5 100%)',
          borderRadius: '20px',
          padding: '28px 24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* 顶部装饰 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '2px' }}>职场PUA识别测试</div>
            <div style={{ fontSize: '11px', color: '#bbb' }}>A里味 · 职场情绪管理</div>
          </div>
          <div style={{ fontSize: '28px' }}>🕵️</div>
        </div>

        {/* 分数区 */}
        <div style={{
          background: risk.bg.includes('red') ? '#fff1f2' : risk.bg.includes('orange') ? '#fff7ed' : '#f0fdf4',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '4px' }}>{risk.emoji}</div>
          <div style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: risk.color.includes('red') ? '#ef4444' : risk.color.includes('orange') ? '#f97316' : '#22c55e',
            lineHeight: 1,
          }}>
            {result.score}
          </div>
          <div style={{ fontSize: '13px', color: '#999', margin: '4px 0' }}>/ 100 分</div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '999px',
            padding: '4px 16px',
            fontSize: '14px',
            fontWeight: '600',
            color: risk.color.includes('red') ? '#ef4444' : risk.color.includes('orange') ? '#f97316' : '#16a34a',
            marginTop: '4px',
          }}>
            {risk.desc}
          </div>
        </div>

        {/* 问题类型 TOP3 */}
        {topTypes.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>检测到的PUA手段</div>
            {topTypes.map(([type, count]) => {
              const info = PUA_TYPE_COLORS[type] || PUA_TYPE_COLORS['否定价值'];
              return (
                <div key={type} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8f8f8',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '18px' }}>{info.emoji}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#333', fontWeight: '500' }}>{type}</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>×{count}</span>
                </div>
              );
            })}
            {topTypes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '13px', color: '#666' }}>
                🎉 未检测到明显问题行为
              </div>
            )}
          </div>
        )}
        {topTypes.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: '#f0fdf4',
            borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎉</div>
            <div style={{ fontSize: '13px', color: '#16a34a' }}>未检测到明显问题行为，太棒了！</div>
          </div>
        )}

        {/* 金句 */}
        <div style={{
          textAlign: 'center',
          padding: '12px',
          borderTop: '1px solid #f0f0f0',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#888' }}>"你的感受是真实的。"</div>
        </div>

        {/* 底部 CTA */}
        <div style={{
          background: 'linear-gradient(90deg, #07c160, #00a854)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>你也来测测？</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', marginTop: '2px' }}>职场PUA识别 · 免费测试</div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            color: '#07c160',
            fontWeight: '600',
          }}>
            立即测试 →
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#ccc' }}>
          {formatDate(result.date)} · 完成 {result.totalAnswered} 题
        </div>
      </div>

      {/* ── 分享卡片预览弹窗 ───────────────────────────────── */}
      {shareImgUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-6"
          onClick={closeShareCard}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">分享给朋友 📸</span>
              <button onClick={closeShareCard} className="text-gray-400 text-lg leading-none">✕</button>
            </div>

            {/* 图片预览 */}
            <div className="p-3 bg-gray-50">
              <img
                src={shareImgUrl}
                alt="分享卡片"
                className="w-full rounded-xl shadow-sm"
                style={{ display: 'block' }}
              />
            </div>

            {/* 提示文字 + 操作按钮 */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-center text-sm text-gray-600 font-medium">
                👆 长按图片 → 保存到相册
              </p>
              <p className="text-center text-xs text-gray-400">
                保存后发给朋友，让他们也来测一测 🕵️
              </p>
              {/* 系统分享按钮（支持直接发微信）*/}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  className="w-full flex items-center justify-center gap-1.5 bg-[#07c160] text-white rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-transform"
                  onClick={async () => {
                    const file = dataUrlToFile(shareImgUrl, 'feleme-report.png');
                    const sd: ShareData = {
                      title: `我测了一下职场环境，抗PUA能力：${result.score}分（${risk.desc}）`,
                      text: '你也来测测？职场PUA识别，免费测试 🕵️',
                      files: [file],
                    };
                    try { await navigator.share(sd); closeShareCard(); } catch { /* 用户取消 */ }
                  }}
                >
                  📤 直接分享到微信 / 朋友圈
                </button>
              )}
              {/* 下载按钮（桌面端备用） */}
              <a
                href={shareImgUrl}
                download="feleme-report.png"
                className="block w-full text-center bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-medium active:scale-95 transition-transform"
              >
                💾 保存图片到相册
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
