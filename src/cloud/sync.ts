/**
 * 数据库同步模块 — Supabase H5 独立版（原生fetch版）
 * 直接调用 Supabase REST API，无需 SDK，彻底避免跨域/Invocation 问题
 */
const SUPABASE_URL = 'https://zphandtlrxbvfwbwucvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaGFuZHRscnhidmZ3Ynd1Y3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDM0ODgsImV4cCI6MjA5MDE3OTQ4OH0.4FYehdmhw5AmTAVZcrBehHodLzkIsyuwC654XtKL72Q';
const OID_KEY = '_feleme_openid';

export function setOpenid(id: string) { try { localStorage.setItem(OID_KEY, id); } catch {} }
export function getOpenid(): string { try { return localStorage.getItem(OID_KEY) || ''; } catch { return ''; } }

// ─── 工具函数 ─────────────────────────────────────────────
function uid(): string {
  const id = getOpenid();
  if (id) return id;
  const newId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  setOpenid(newId);
  console.log('[supabase] 生成新用户ID:', newId);
  return newId;
}

async function request(
  table: string,
  method: 'POST' | 'GET' | 'PATCH' | 'DELETE',
  body?: Record<string, unknown>
): Promise<void> {
  const userId = uid();
  const payload = body
    ? { ...body, user_id: userId, created_at: new Date().toISOString() }
    : undefined;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  console.log(`[supabase] ${method} ${url}`, payload);
  try {
    const opts: RequestInit = {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        // upsert：POST 时主键冲突则更新而非报错（避免重复写入 409）
        'Prefer': method === 'POST' ? 'return=minimal,resolution=merge-duplicates' : 'return=minimal',
      },
    };
    if (payload) opts.body = JSON.stringify(payload);
    const res = await fetch(url, opts);
    const text = await res.text();
    if (!res.ok) {
      console.error(`[supabase] 失败 ${res.status}:`, text);
    } else {
      console.log(`[supabase] 成功 ${table}`);
    }
  } catch (e) {
    console.error(`[supabase] 异常 ${table}:`, e);
  }
}

// ─── 业务函数 ─────────────────────────────────────────────

export async function cloudSaveTestResult(result: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudSaveTestResult called');
  // 统一将驼峰字段转为下划线，与 Supabase 表结构对齐；counts 列为 jsonb，直接传对象
  await request('test_history', 'POST', {
    local_id:       result['id'],
    date:           result['date'],
    score:          result['score'],
    risk_level:     result['riskLevel'],
    total_answered: result['totalAnswered'],
    counts: result['counts'],
  });
}

export async function cloudSaveDiary(diary: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudSaveDiary called', diary);
  await request('diaries', 'POST', { ...diary, local_id: diary['id'] });
}

export async function cloudAddChatMessage(
  diaryId: string,
  message: Record<string, unknown>
): Promise<void> {
  console.log('[supabase] cloudAddChatMessage called', diaryId);
  await request('diary_messages', 'POST', { diary_id: diaryId, ...message, local_id: message['id'] });
}

export async function cloudAddPost(post: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudAddPost called', post);
  await request('posts', 'POST', { ...post, local_id: post['id'] });
}

export async function cloudToggleLike(
  _postId: string,
  cloudId: string,
  liked: boolean
): Promise<void> {
  if (!cloudId) return;
  try {
    const userId = uid();
    const url = `${SUPABASE_URL}/rest/v1/posts?id=eq.${cloudId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ likes: liked ? 1 : -1, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) console.error('[supabase] cloudToggleLike失败', res.status);
    else console.log('[supabase] cloudToggleLike成功');
  } catch (e) { console.error('[supabase] cloudToggleLike异常', e); }
}

export async function cloudToggleResonate(
  _postId: string,
  cloudId: string,
  resonated: boolean
): Promise<void> {
  if (!cloudId) return;
  try {
    const url = `${SUPABASE_URL}/rest/v1/posts?id=eq.${cloudId}`;
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ resonances: resonated ? 1 : -1, updated_at: new Date().toISOString() }),
    });
  } catch (e) { console.error('[supabase] cloudToggleResonate异常', e); }
}

export async function cloudAddComment(comment: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudAddComment called');
  await request('comments', 'POST', { ...comment, local_id: comment['id'] });
}

export async function cloudUnlockAchievement(achievement: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudUnlockAchievement called');
  await request('achievements', 'POST', { ...achievement, unlocked: true, unlocked_at: new Date().toISOString() });
}

export async function cloudRegisterUser(nickname: string, phone: string): Promise<void> {
  console.log('[supabase] cloudRegisterUser called');
  await request('user_profile', 'POST', {
    user_id: uid(),
    nickname,
    phone,
    registered_at: new Date().toISOString(),
  });
}

export async function cloudSavePayment(options: {
  amount: number;       // 单位：分，如 990 = ¥9.9
  product: string;      // 商品名称
  status: 'pending_verify'; // 待核验（赞赏码模式，人工确认）
}): Promise<void> {
  console.log('[supabase] cloudSavePayment called', options);
  await request('payments', 'POST', {
    user_id: uid(),
    amount: options.amount,
    product: options.product,
    status: options.status,
    paid_at: new Date().toISOString(),
  });
}

export async function cloudUpdateUserProfile(profile: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudUpdateUserProfile called', profile);
  await request('user_profile', 'POST', { ...profile, user_id: uid() });
}

export async function cloudToggleFavoriteScript(scriptId: string, liked: boolean): Promise<void> {
  console.log('[supabase] cloudToggleFavoriteScript', scriptId, liked);
  await request('user_profile', 'POST', { favorite_scripts: liked ? [scriptId] : [], user_id: uid() });
}

export async function cloudIncrementPracticeCount(): Promise<void> {
  console.log('[supabase] cloudIncrementPracticeCount called');
  try {
    const userId = uid();
    const url = `${SUPABASE_URL}/rest/v1/user_profile?user_id=eq.${userId}&select=id,practice_count`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/user_profile?id=eq.${data[0].id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ practice_count: (data[0].practice_count || 0) + 1, updated_at: new Date().toISOString() }),
      });
    } else {
      await request('user_profile', 'POST', { user_id: userId, practice_count: 1 });
    }
  } catch (e) { console.error('[supabase] cloudIncrementPracticeCount异常', e); }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cloudSavePracticeRecord(record: Record<string, any>): Promise<void> {
  console.log('[supabase] cloudSavePracticeRecord called', record);
  // 统一转换为下划线字段名，与 Supabase 表结构对齐
  await request('practice_records', 'POST', {
    scenario_id:    record['scenarioId']    ?? record['scenario_id'],
    scenario_title: record['scenarioTitle'] ?? record['scenario_title'],
    difficulty:     record['difficulty'],
    messages:       record['messages'],
    score:          record['score'],
    score_label:    record['scoreLabel']    ?? record['score_label'],
    ai_analysis:    record['aiAnalysis']    ?? record['ai_analysis'],
    finished_at:    record['finishedAt']    ?? record['finished_at'],
  });
}

export async function cloudSyncAll(_localData: Record<string, unknown>): Promise<void> {
  console.log('[supabase] cloudSyncAll called (no-op, writes are immediate)');
}

// ─── 微信分享 ──────────────────────────────────────────────

/** 判断是否在微信浏览器中 */
export function isWechatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/** 判断是否在微信小程序 WebView 中 */
export function isWechatMiniProgram(): boolean {
  return /miniProgram/i.test(navigator.userAgent) ||
    window.location.search.includes('from=miniprogram');
}

// 微信 JS-SDK 签名接口（需要后端提供，这里预留接入点）
const WX_JSSDK_API = ''; // 填入你的后端签名接口地址

interface WxSDK {
  config: (cfg: Record<string, unknown>) => void;
  ready: (fn: () => void) => void;
  updateAppMessageShareData?: (opts: Record<string, string>) => void;
  updateTimelineShareData?: (opts: Record<string, string>) => void;
  onMenuShareAppMessage?: (opts: Record<string, string>) => void;
  onMenuShareTimeline?: (opts: Record<string, string>) => void;
}

function getWx(): WxSDK | null {
  return (window as unknown as { wx?: WxSDK }).wx ?? null;
}

/** 初始化微信 JS-SDK 配置 */
async function initWxConfig(): Promise<boolean> {
  if (!WX_JSSDK_API) return false;
  try {
    const res = await fetch(`${WX_JSSDK_API}?url=${encodeURIComponent(window.location.href)}`);
    const cfg = await res.json();
    const wx = getWx();
    if (!wx) return false;
    wx.config({
      debug: false,
      appId: cfg.appId,
      timestamp: cfg.timestamp,
      nonceStr: cfg.nonceStr,
      signature: cfg.signature,
      jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData', 'onMenuShareAppMessage', 'onMenuShareTimeline'],
    });
    return true;
  } catch { return false; }
}

export async function postShare(options: {
  type: 'miniprogram' | 'h5';
  title: string;
  path: string;
  imageUrl?: string;
  desc?: string;
}): Promise<void> {
  const shareTitle = options.title;
  const shareDesc = options.desc || '职场情绪管理 · PUA识别 · 边界设立';
  const shareLink = window.location.origin + (options.path || '/');
  const shareImg = options.imageUrl || window.location.origin + '/favicon.svg';

  // ── 微信内置浏览器：使用 JS-SDK ───────────────────────────
  if (isWechatBrowser()) {
    const wx = getWx();
    const configOk = wx ? await initWxConfig() : false;

    if (configOk && wx) {
      wx.ready(() => {
        // 分享给朋友
        if (wx.updateAppMessageShareData) {
          wx.updateAppMessageShareData({ title: shareTitle, desc: shareDesc, link: shareLink, imgUrl: shareImg });
        } else {
          wx.onMenuShareAppMessage?.({ title: shareTitle, desc: shareDesc, link: shareLink, imgUrl: shareImg });
        }
        // 分享到朋友圈
        if (wx.updateTimelineShareData) {
          wx.updateTimelineShareData({ title: shareTitle, link: shareLink, imgUrl: shareImg });
        } else {
          wx.onMenuShareTimeline?.({ title: shareTitle, link: shareLink, imgUrl: shareImg });
        }
      });
      return;
    }

    // JS-SDK 未配置时，引导用户手动分享
    const msg = `点击右上角「···」→「分享给朋友」或「分享到朋友圈」`;
    alert(msg);
    return;
  }

  // ── 非微信环境：使用原生 Web Share API ───────────────────
  if (navigator.share) {
    try {
      await navigator.share({ title: shareTitle, text: shareDesc, url: shareLink });
      return;
    } catch { /* 用户取消，忽略 */ }
  }

  // ── 最终降级：复制链接 ────────────────────────────────────
  try {
    await navigator.clipboard.writeText(shareLink);
    alert('链接已复制，粘贴给朋友吧 🌿');
  } catch {
    alert(`复制此链接分享：${shareLink}`);
  }
}

// ─── AI 对话（DeepSeek via OpenAI 兼容接口）────────────────────────
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIStreamCallbacks {
  onChunk?: (text: string, accumulated?: string) => void;
  onComplete?: () => void;
  onDone?: (fullText: string) => void;
  onError?: (e: Error) => void;
}

const DEEPSEEK_API_KEY = 'sk-da717cc4b6164e7eb36d2c423f12a13e';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const AI_MODEL_NAME = 'deepseek-chat';

export async function callAIStream(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  systemPromptOverride?: string,
): Promise<AbortController | null> {
  const systemPrompt = systemPromptOverride ||
    '你是一个专业、温暖的心理咨询师，擅长职场情绪管理和PUA识别。请根据用户描述的场景，给出专业的心理分析和应对建议。回复简洁、有同理心，控制在200字以内。';

  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const controller = new AbortController();

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({ model: AI_MODEL_NAME, messages: fullMessages, stream: false }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('AI request failed: ' + res.status);
    const json = await (res.json() as Promise<{ choices?: Array<{ message?: { content?: string } }> }>);
    const text = json?.choices?.[0]?.message?.content || '';
    callbacks.onChunk?.(text, text);
    callbacks.onDone?.(text);
    callbacks.onComplete?.();
    return controller;
  } catch (e) {
    if ((e as Error).name === 'AbortError') return null;
    callbacks.onError?.(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}
