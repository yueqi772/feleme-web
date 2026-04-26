import { useState, useRef } from 'react';
import { callAIStream } from '../cloud/sync';
import type { AIMessage } from '../cloud/sync';
import { cloudSavePayment } from '../cloud';

interface ConsultPageProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

// ── 付费状态持久化 key ──────────────────────────────────────
const PAID_KEY = 'feleme_consult_paid';
function isPaid(): boolean {
  return localStorage.getItem(PAID_KEY) === '1';
}
function markPaid(): void {
  localStorage.setItem(PAID_KEY, '1');
}

// ── 咨询方向 ────────────────────────────────────────────────
const CONSULT_TYPES = [
  { id: 'pua', icon: '🔍', title: '识别 PUA', desc: '帮你判断是否正在遭受职场 PUA，分析具体套路' },
  { id: 'boundary', icon: '🛡️', title: '边界设立', desc: '如何温柔但坚定地拒绝越界要求' },
  { id: 'emotion', icon: '💆', title: '情绪疏导', desc: '倾听你的委屈，帮你找到情绪出口' },
  { id: 'decision', icon: '🚦', title: '去留决策', desc: '理性分析当前处境，协助判断是否该离职' },
];

const SYSTEM_PROMPT = `你是一位专业的职场心理顾问，拥有10年以上职场心理咨询经验。
你擅长：识别职场PUA套路、帮助用户设立心理边界、情绪支持与疏导、职业去留决策分析。
请以温暖、专业的态度回应用户，给出有实际价值的建议。
回复要有结构感，可以适当使用小标题或列表，控制在300字以内。
不要说"作为AI"或暴露自己是AI，直接以咨询师身份交流。`;

// ── 支付宝收款码图片路径 ──────────────────────────────────────
const QR_CODE_URL = '/alipay-qr.jpg';
// 付款备注
const QR_PAY_NOTE = '职场咨询9.9';
// 付款后引导添加的微信号
const WECHAT_ID = 'selavie_01';

// ── 赞赏码支付弹窗 ───────────────────────────────────────────
function PayModal({ onPay, onClose }: { onPay: () => void; onClose: () => void }) {
  const [step, setStep] = useState<'qr' | 'confirm' | 'wechat'>('qr');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WECHAT_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // 降级：选中文本提示手动复制
    });
  };

  const handleConfirm = () => {
    markPaid();
    // 记录支付信息到 Supabase（赞赏码模式，标记为待核验）
    cloudSavePayment({ amount: 990, product: '职场咨询9.9', status: 'pending_verify' });
    setStep('wechat');
  };

  const handleStartConsult = () => {
    onPay();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={step === 'wechat' ? undefined : onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl px-6 pt-5 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {/* 把手 */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        {/* ── Step 1: 扫码支付 ── */}
        {step === 'qr' && (
          <>
            <div className="text-center mb-4">
              <h2 className="text-base font-bold text-gray-800">支付宝扫码 · ¥9.9</h2>
              <p className="text-xs text-gray-400 mt-1">打开支付宝 → 扫一扫</p>
            </div>

            {/* 二维码 */}
            <div className="flex justify-center mb-3">
              <img
                src={QR_CODE_URL}
                alt="支付宝收款码"
                className="w-52 h-52 rounded-2xl object-contain shadow-sm border border-gray-100"
              />
            </div>

            {/* 备注提示 */}
            <div className="bg-blue-50 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
              <span className="text-blue-500 text-sm">💡</span>
              <p className="text-xs text-blue-700">
                付款时备注「<span className="font-semibold">{QR_PAY_NOTE}</span>」，方便核对订单
              </p>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm active:scale-95 transition-transform"
            >
              我已完成支付 →
            </button>
            <button onClick={onClose} className="w-full py-2 text-xs text-gray-400 mt-2">
              取消
            </button>
          </>
        )}

        {/* ── Step 2: 确认付款 ── */}
        {step === 'confirm' && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-base font-bold text-gray-800">确认已付款？</h2>
              <p className="text-xs text-gray-400 mt-1">勾选确认后即可解锁咨询</p>
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 mb-4 cursor-pointer active:bg-gray-100">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-sm text-gray-600">
                我已通过支付宝支付了 <span className="font-semibold text-brand-600">¥9.9</span>
              </span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!confirmed}
              className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm active:scale-95 transition-transform disabled:opacity-40"
            >
              确认，下一步
            </button>
            <button onClick={() => setStep('qr')} className="w-full py-2 text-xs text-gray-400 mt-2">
              ← 返回重新扫码
            </button>
          </>
        )}

        {/* ── Step 3: 添加微信 ── */}
        {step === 'wechat' && (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-base font-bold text-gray-800">付款成功！</h2>
              <p className="text-sm text-gray-500 mt-1">添加顾问微信，开始你的专属咨询</p>
            </div>

            {/* 微信号卡片 */}
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg shrink-0">
                  💬
                </div>
                <div>
                  <p className="text-xs text-gray-500">顾问微信号</p>
                  <p className="text-base font-bold text-gray-800 tracking-wide">{WECHAT_ID}</p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-green-300 text-green-600'
                }`}
              >
                {copied ? '✅ 已复制微信号' : '📋 复制微信号'}
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                复制微信号后，打开微信 → 搜索 → 粘贴即可添加顾问。
                添加时备注「<span className="font-medium text-gray-700">职场咨询</span>」，顾问会优先通过。
              </p>
            </div>

            <button
              onClick={handleStartConsult}
              className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm active:scale-95 transition-transform"
            >
              同时开始 AI 咨询 →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────────
export default function ConsultPage({ onNavigate }: ConsultPageProps) {
  const [paid, setPaid] = useState(() => isPaid());
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const cancelRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function handleStart() {
    if (!paid) {
      setShowPayModal(true);
      return;
    }
    if (!selectedType) return;
    const typeInfo = CONSULT_TYPES.find(t => t.id === selectedType)!;
    const greeting = `你好，我是你的专属职场顾问。我看到你选择了「${typeInfo.title}」方向的咨询。\n\n请告诉我你现在的具体情况，比如发生了什么事、你有什么感受？我在这里，可以慢慢说。`;
    setMessages([{ role: 'ai', content: greeting }]);
    setStarted(true);
    scrollToBottom();
  }

  function sendMessage() {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    const newMsgs = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    const history: AIMessage[] = newMsgs.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

    callAIStream(
      history,
      {
        onDone: (fullText) => {
          setIsTyping(false);
          setMessages(m => [...m, { role: 'ai' as const, content: fullText || '请继续说，我在认真听。' }]);
          scrollToBottom();
        },
        onError: () => {
          setIsTyping(false);
          setMessages(m => [...m, { role: 'ai' as const, content: '网络有点问题，可以重新发一遍吗？' }]);
        },
      },
      SYSTEM_PROMPT,
    ).then(ctrl => { cancelRef.current = ctrl; });
  }

  // ── 聊天界面 ─────────────────────────────────────────────
  if (started) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="text-center">
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {CONSULT_TYPES.find(t => t.id === selectedType)?.icon}{' '}
              {CONSULT_TYPES.find(t => t.id === selectedType)?.title} · 专属咨询
            </span>
          </div>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-1">
                  💬
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-sm'
                  : 'bg-white text-gray-700 shadow-sm rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm shrink-0 mr-2">💬</div>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
                <span className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 输入框 */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="说说你的情况…"
            className="input-field flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform shrink-0"
          >
            发送
          </button>
        </div>
      </div>
    );
  }

  // ── 选择咨询方向界面 ──────────────────────────────────────
  return (
    <div className="min-h-full bg-gray-50 pb-8">
      {/* 头部介绍 */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-5 pt-6 pb-10">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-xl font-bold mb-1">专属职场咨询</h1>
          <p className="text-sm opacity-80">AI 顾问全程陪伴，专业、保密、随时在线</p>
          {!paid && (
            <div className="mt-3 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
              <span>¥9.9</span>
              <span className="opacity-70">解锁一次咨询</span>
            </div>
          )}
          {paid && (
            <div className="mt-3 inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 text-sm font-medium">
              ✅ 已解锁 · 随时开始咨询
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* 选择咨询方向 */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-3">选择咨询方向</p>
          <div className="grid grid-cols-2 gap-3">
            {CONSULT_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedType === t.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className={`text-xs font-semibold mb-0.5 ${selectedType === t.id ? 'text-brand-600' : 'text-gray-700'}`}>
                  {t.title}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={handleStart}
          disabled={!selectedType}
          className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base active:scale-95 transition-transform disabled:opacity-40 shadow-md"
        >
          {paid ? '开始咨询 →' : `¥9.9 解锁并开始咨询`}
        </button>

        {/* 说明卡片 */}
        <div className="card bg-amber-50 border-0">
          <div className="flex gap-2">
            <span className="text-lg shrink-0">💡</span>
            <div>
              <p className="text-xs font-medium text-amber-800 mb-1">关于这次咨询</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• 一次付费，本次咨询不限对话轮次</li>
                <li>• AI 顾问 24 小时在线，随时响应</li>
                <li>• 对话内容仅保存在本地，完全保密</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 用户评价 */}
        <div className="card">
          <p className="text-sm font-semibold text-gray-700 mb-3">用户反馈</p>
          <div className="space-y-3">
            {[
              { name: '互联网打工人', avatar: '🌿', text: '帮我分析出来老板的打压套路，终于想清楚了。', time: '2天前' },
              { name: '小白鹿', avatar: '🦌', text: '倾诉了很久，感觉好多了，顾问很有耐心。', time: '5天前' },
              { name: '匿名用户', avatar: '⭐', text: '9.9真的值，帮我做了去留决策分析，清晰多了。', time: '1周前' },
            ].map((r, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-sm shrink-0">{r.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-700">{r.name}</span>
                    <span className="text-[10px] text-gray-400">{r.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">"{r.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayModal && (
        <PayModal
          onPay={() => {
            setPaid(true);
            setShowPayModal(false);
          }}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </div>
  );
}
