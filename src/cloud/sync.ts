/**
 * 云数据库同步模块 — H5 独立版
 *
 * 通信方案（单轨）：
 * - tcb-js-sdk 直连云数据库，匿名登录
 * - 不依赖任何微信客户端 API
 */

import cloudbase from '@cloudbase/js-sdk';

const ENV_ID = 'cloudbase-3g22c9ce5bcf0e55';
const OID_KEY = '_feleme_openid';

type CloudbaseApp = ReturnType<typeof cloudbase.init>;
type CloudbaseDb = ReturnType<CloudbaseApp['database']>;

// ─── SDK 初始化 ──────────────────────────────────────────
let _app: CloudbaseApp | null = null;
let _db: CloudbaseDb | null = null;
let _ready = false;

function getDb(): CloudbaseDb | null {
  if (_db) return _db;
  try {
    _app = cloudbase.init({ env: ENV_ID, region: 'ap-shanghai' });
    _db = _app.database();
    _ready = true;
    console.log('[cloud] SDK 初始化成功');
  } catch (e) {
    console.warn('[cloud] SDK 初始化失败:', e);
    _ready = false;
  }
  return _db;
}

// ─── openid 管理（localStorage 匿名）──────────────────────
export function setOpenid(id: string) {
  try { localStorage.setItem(OID_KEY, id); } catch {}
}
export function getOpenid(): string {
  try { return localStorage.getItem(OID_KEY) || ''; } catch { return ''; }
}

// ─── 匿名登录 ────────────────────────────────────────────
let _authPromise: Promise<boolean> | null = null;

async function ensureAuth(): Promise<boolean> {
  if (!_ready) return false;
  if (_authPromise) return _authPromise;
  _authPromise = (async () => {
    try {
      const auth = _app!.auth();
      if (auth.hasLoginState()) return true;
      await auth.signInAnonymously();
      return true;
    } catch (e) {
      console.warn('[cloud] 匿名登录失败:', e);
      return false;
    }
  })();
  return _authPromise;
}

// ─── 内部工具 ────────────────────────────────────────────
function openidOf(): string {
  return getOpenid();
}

async function dbAdd(collection: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) return;
  await ensureAuth();
  const finalData = { ...data, openid: openidOf(), createdAt: Date.now() };
  try {
    const res = await db.collection('feleme_' + collection).add({ data: finalData });
    console.log(`[cloud] 云端写入成功: ${collection}`, res.id);
  } catch (e) {
    console.warn(`[cloud] 云端写入失败: ${collection}`, e);
  }
}

async function dbUpdate(
  collection: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await ensureAuth();
  const setData: Record<string, unknown> = {};
  const incData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (String(k).endsWith('_delta')) {
      incData[String(k).replace(/_delta$/, '')] = v;
    } else {
      setData[k] = v;
    }
  }
  const update: Record<string, unknown> = {};
  if (Object.keys(setData).length) update.$set = setData;
  if (Object.keys(incData).length) update.$inc = incData;
  try {
    await db.collection('feleme_' + collection).where(query).update({ data: update });
  } catch (e) {
    console.warn(`[cloud] 云端更新失败: ${collection}`, e);
  }
}

async function dbSet(
  collection: string,
  query: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await ensureAuth();
  try {
    const col = db.collection('feleme_' + collection);
    const existing = await col.where(query).get();
    if ((existing.data as unknown[]).length > 0) {
      const oldId = (existing.data as Array<{ _id: string }>)[0]._id;
      await col.doc(oldId).update({ data: { ...data, updatedAt: Date.now() } });
    } else {
      await col.add({ data: { ...query, ...data, createdAt: Date.now() } });
    }
  } catch (e) {
    console.warn(`[cloud] 云端 set 失败: ${collection}`, e);
  }
}

// ─── 业务函数 ────────────────────────────────────────────

export async function cloudSaveTestResult(result: Record<string, unknown>): Promise<void> {
  await dbAdd('testHistory', { ...result, localId: String(result['id'] || '') });
}

export async function cloudSaveDiary(diary: Record<string, unknown>): Promise<void> {
  await dbAdd('diaries', { ...diary, localId: String(diary['id'] || '') });
}

export async function cloudAddChatMessage(
  diaryId: string,
  message: Record<string, unknown>
): Promise<void> {
  await dbAdd('diaryMessages', { diaryId, ...message, localId: String(message['id'] || '') });
}

export async function cloudAddPost(post: Record<string, unknown>): Promise<void> {
  await dbAdd('posts', { ...post, localId: String(post['id'] || '') });
}

export async function cloudToggleLike(
  postId: string,
  cloudId: string,
  liked: boolean
): Promise<void> {
  if (!cloudId) return;
  await dbUpdate('posts', { _id: cloudId }, { likes_delta: liked ? 1 : -1 });
}

export async function cloudToggleResonate(
  postId: string,
  cloudId: string,
  resonated: boolean
): Promise<void> {
  if (!cloudId) return;
  await dbUpdate('posts', { _id: cloudId }, { resonances_delta: resonated ? 1 : -1 });
}

export async function cloudAddComment(comment: Record<string, unknown>): Promise<void> {
  await dbAdd('comments', { ...comment, localId: String(comment['id'] || '') });
}

export async function cloudUnlockAchievement(achievement: Record<string, unknown>): Promise<void> {
  await dbAdd('achievements', { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() });
}

export async function cloudUpdateUserProfile(profile: Record<string, unknown>): Promise<void> {
  const oid = openidOf();
  if (!oid) { console.warn('[cloud] cloudUpdateUserProfile: 无 openid'); return; }
  await dbSet('userProfile', { openid: oid }, { ...profile, openid: oid });
}

export async function cloudToggleFavoriteScript(scriptId: string, liked: boolean): Promise<void> {
  const oid = openidOf();
  if (!oid) return;
  await dbSet('userProfile', { openid: oid }, { favoriteScripts: liked ? [scriptId] : [], openid: oid });
}

export async function cloudIncrementPracticeCount(): Promise<void> {
  const oid = openidOf();
  if (!oid) return;
  await dbUpdate('userProfile', { openid: oid }, { practiceCount_delta: 1 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cloudSavePracticeRecord(record: Record<string, any>): Promise<void> {
  await dbAdd('practiceRecords', { ...record });
}

export async function cloudSyncAll(_localData: Record<string, unknown>): Promise<void> {
  console.log('[cloud] cloudSyncAll called (H5 standalone)');
}

export async function postShare(options: {
  type: 'miniprogram' | 'h5';
  title: string;
  path: string;
  imageUrl?: string;
}): Promise<void> {
  console.log('[cloud] postShare called:', options);
}

// ─── AI 对话（腾讯云开发 Hunyuan）────────────────────────
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIStreamCallbacks {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChunk?: (text: string, accumulated?: string) => void;
  onComplete?: () => void;
  onDone?: (fullText: string) => void;
  onError?: (e: Error) => void;
}

const AI_MODEL_NAME = 'hunyuan-turbos-latest';

export async function callAIStream(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks
): Promise<AbortController | null> {
  const db = getDb();
  if (!db) { callbacks.onError?.(new Error('SDK 未就绪')); return null; }

  const systemPrompt =
    '你是一个专业、温暖的心理咨询师，擅长职场情绪管理和PUA识别。请根据用户描述的场景，给出专业的心理分析和应对建议。回复简洁、有同理心，控制在200字以内。';

  const fullMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  const controller = new AbortController();

  try {
    const base = 'https://cloudbase-3g22c9ce5bcf0e55.service.cloudbase.cn';
    const res = await fetch(`${base}/api/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
