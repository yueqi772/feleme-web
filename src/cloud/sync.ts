/**
 * 云数据库同步模块
 *
 * 通信方案（双轨）：
 * - 优先：tcb-js-sdk 直连云数据库（不依赖 postMessage，实时生效）
 * - 降级：wx.miniProgram.postMessage（仅在 SDK 不可用时使用）
 *
 * 为什么需要双轨：
 * - wx.miniProgram.postMessage 存在平台限制：bindmessage 只在后退/销毁/分享时才触发
 * - tcb-js-sdk 直接 HTTP 调用云函数，无此限制
 */

import cloudbase from '@cloudbase/js-sdk';

// ─── 云开发配置 ──────────────────────────────────────────
const ENV_ID = 'cloudbase-3g22c9ce5bcf0e55';

type CloudbaseApp = ReturnType<typeof cloudbase.init>;
type CloudbaseDb = ReturnType<CloudbaseApp['database']>;

// 延迟初始化，避免 SSR 报错
let _app: CloudbaseApp | null = null;
let _db: CloudbaseDb | null = null;
let _sdkReady = false;
let _authReadyPromise: Promise<boolean> | null = null;

function getDb(): CloudbaseDb | null {
  if (_db) return _db;
  try {
    _app = cloudbase.init({
      env: ENV_ID,
      region: 'ap-shanghai',
    });
    _db = _app.database();
    _sdkReady = true;
    console.log('[cloud sync] tcb-js-sdk 初始化成功');
  } catch (e) {
    console.warn('[cloud sync] tcb-js-sdk 初始化失败，将降级使用 postMessage:', e);
    _sdkReady = false;
  }
  return _db;
}

async function ensureCloudAuth(): Promise<boolean> {
  const db = getDb();
  if (!db || !_app || !_sdkReady) return false;
  if (_authReadyPromise) return _authReadyPromise;

  _authReadyPromise = (async () => {
    try {
      const auth = _app!.auth();
      const loginState = auth.hasLoginState();
      if (loginState) {
        console.log('[cloud sync] 已存在云开发登录态');
        return true;
      }
      console.log('[cloud sync] 无登录态，开始匿名登录');
      await auth.signInAnonymously();
      console.log('[cloud sync] 匿名登录成功');
      return true;
    } catch (err) {
      console.error('[cloud sync] 匿名登录失败:', err);
      return false;
    }
  })();

  const ok = await _authReadyPromise;
  if (!ok) _authReadyPromise = null;
  return ok;
}

// ─── postMessage 降级方案 ────────────────────────────────
declare const wx: {
  miniProgram?: {
    postMessage: (payload: { data: { msgId: string; type: string; payload: Record<string, unknown> } }) => void;
  };
};

let _openid = '';
const _pending: Map<string, (data: unknown) => void> = new Map();
let _msgSeq = 0;

// 监听小程序回复（降级方案使用）
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    const d = e.data;
    if (!d || !d.msgId) return;
    const resolve = _pending.get(d.msgId);
    if (resolve) { _pending.delete(d.msgId); resolve(d); }
    else { console.warn('[cloud sync] 未找到待处理回调 msgId:', d.msgId); }
  });
  console.log('[cloud sync] H5 消息监听器已注册');
}

function postToMiniProgram(type: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve) => {
    const msgId = `msg_${++_msgSeq}_${Date.now()}`;
    const timer = setTimeout(() => {
      _pending.delete(msgId);
      console.error(`[cloud sync] 消息超时: ${type}`, payload);
      resolve({ success: false, error: '消息超时，小程序未响应' });
    }, 12000);

    _pending.set(msgId, (data: unknown) => {
      clearTimeout(timer);
      resolve(data);
    });

    try {
      wx.miniProgram?.postMessage({ data: { msgId, type, payload } });
      console.log(`[cloud sync] 已发送 → 小程序: ${type}`, payload);
    } catch (err) {
      clearTimeout(timer);
      _pending.delete(msgId);
      console.error(`[cloud sync] postMessage 失败: ${type}`, err);
      resolve({ success: false, error: String(err) });
    }
  });
}

// ─── 公开函数 ────────────────────────────────────────────

export function setOpenid(openid: string) { _openid = openid; }
export function getOpenid(): string { return _openid; }

/** 测试连通性 */
export async function pingMp(): Promise<boolean> {
  const db = getDb();
  if (db) {
    console.log('[cloud sync] ping: tcb-js-sdk 可用');
    return true;
  }
  const r = await postToMiniProgram('PING', {}) as { type?: string };
  const ok = r?.type === 'PONG';
  console.log('[cloud sync] ping 结果:', ok);
  return ok;
}

// ─── 通用写入（优先 SDK，降级 postMessage）────────────────

async function dbAdd(collection: string, data: Record<string, unknown>): Promise<void> {
  const finalData = { ...data, createdAt: Date.now() };
  console.log('[cloud sync] dbAdd start', { collection, data: finalData, sdkReady: _sdkReady });
  const db = getDb();
  if (_app && db && _sdkReady) {
    const authOk = await ensureCloudAuth();
    if (authOk) {
      try {
        const res = await _app.callFunction({
          name: 'tcb',
          data: {
            collection,
            action: 'add',
            data: finalData,
          },
        });
        const result = (res && typeof res === 'object' && 'result' in res)
          ? (res.result as { success?: boolean; id?: string; error?: string })
          : null;
        if (result?.success) {
          console.log(`[cloud sync] 云函数写入成功: ${collection}`, result);
          return;
        }
        console.warn(`[cloud sync] 云函数写入返回失败，降级 postMessage: ${collection}`, result);
      } catch (e) {
        console.warn(`[cloud sync] 云函数写入异常，降级 postMessage: ${collection}`, e);
      }
    }
  }
  console.log('[cloud sync] dbAdd fallback to postMessage', { collection, data: finalData });
  await postToMiniProgram('DB_ADD', { collection, data: finalData });
}

async function dbUpdate(collection: string, query: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (db && _sdkReady) {
    const authOk = await ensureCloudAuth();
    if (!authOk) { await postToMiniProgram('DB_UPDATE', { collection, query, data }); return; }
    try {
      const _ = db.command;
      // 处理 _delta 风格增量字段
      const setData: Record<string, unknown> = {};
      const incData: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (k.endsWith('_delta')) {
          incData[k.replace(/_delta$/, '')] = _.inc(v as number);
        } else {
          setData[k] = v;
        }
      }
      const updateData: Record<string, unknown> = {};
      if (Object.keys(setData).length) Object.assign(updateData, setData);
      if (Object.keys(incData).length) Object.assign(updateData, incData);
      await db.collection('feleme_' + collection).where(query).update({ data: updateData });
      console.log(`[cloud sync] SDK 更新成功: ${collection}`);
      return;
    } catch (e) {
      console.warn(`[cloud sync] SDK 更新失败，降级 postMessage: ${collection}`, e);
    }
  }
  await postToMiniProgram('DB_UPDATE', { collection, query, data });
}

async function dbSet(collection: string, query: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (db && _sdkReady) {
    const authOk = await ensureCloudAuth();
    if (!authOk) { await postToMiniProgram('DB_SET', { collection, query, data }); return; }
    try {
      const col = db.collection('feleme_' + collection);
      const existing = await col.where(query).limit(1).get();
      if ((existing.data as unknown[]).length > 0) {
        const oldId = (existing.data as Array<{ _id: string }>)[0]._id;
        await col.doc(oldId).remove();
      }
      await col.add({ data: { ...query, ...data, createdAt: Date.now() } });
      console.log(`[cloud sync] SDK upsert 成功: ${collection}`);
      return;
    } catch (e) {
      console.warn(`[cloud sync] SDK upsert 失败，降级 postMessage: ${collection}`, e);
    }
  }
  await postToMiniProgram('DB_SET', { collection, query, data });
}

// ─── 业务函数 ────────────────────────────────────────────

/** 存储测试结果 */
export async function cloudSaveTestResult(result: Record<string, unknown>): Promise<void> {
  await dbAdd('testHistory', { ...result, openid: _openid, localId: String(result['id'] || '') });
}

/** 存储情绪日记 */
export async function cloudSaveDiary(diary: Record<string, unknown>): Promise<void> {
  const payload = { ...diary, openid: _openid, localId: String(diary['id'] || '') };
  console.log('[cloud sync] cloudSaveDiary hit', payload);
  await dbAdd('diaries', payload);
  console.log('[cloud sync] cloudSaveDiary done', diary['id'] || payload.localId || 'unknown');
}

/** 日记追加对话消息 */
export async function cloudAddChatMessage(diaryId: string, message: Record<string, unknown>): Promise<void> {
  await dbAdd('diaryMessages', { diaryId, openid: _openid, ...message, localId: String(message['id'] || '') });
}

/** 发布社区帖子 */
export async function cloudAddPost(post: Record<string, unknown>): Promise<void> {
  await dbAdd('posts', { ...post, openid: _openid, localId: String(post['id'] || '') });
}

/** 帖子点赞 */
export async function cloudToggleLike(postId: string, cloudId: string, liked: boolean): Promise<void> {
  if (!cloudId) return;
  await dbUpdate('posts', { _id: cloudId }, { likes_delta: liked ? 1 : -1 });
}

/** 帖子共鸣 */
export async function cloudToggleResonate(postId: string, cloudId: string, resonated: boolean): Promise<void> {
  if (!cloudId) return;
  await dbUpdate('posts', { _id: cloudId }, { resonances_delta: resonated ? 1 : -1 });
}

/** 添加评论 */
export async function cloudAddComment(comment: Record<string, unknown>): Promise<void> {
  await dbAdd('comments', { ...comment, openid: _openid, localId: String(comment['id'] || '') });
}

/** 解锁成就 */
export async function cloudUnlockAchievement(achievement: Record<string, unknown>): Promise<void> {
  await dbAdd('achievements', { ...achievement, openid: _openid, unlocked: true, unlockedAt: new Date().toISOString() });
}

/** 更新用户档案 */
export async function cloudUpdateUserProfile(profile: Record<string, unknown>): Promise<void> {
  if (!_openid) { console.warn('[cloud sync] cloudUpdateUserProfile: 无 openid'); return; }
  await dbSet('userProfile', { openid: _openid }, { ...profile, openid: _openid, updatedAt: Date.now() });
}

/** 话术收藏 */
export async function cloudToggleFavoriteScript(scriptId: string, liked: boolean): Promise<void> {
  if (!_openid) return;
  await dbSet('userProfile', { openid: _openid }, {
    openid: _openid,
    favoriteScripts: liked ? [scriptId] : [],
    updatedAt: Date.now(),
  });
}

/** 练习次数 +1 */
export async function cloudIncrementPracticeCount(): Promise<void> {
  if (!_openid) return;
  await dbUpdate('userProfile', { openid: _openid }, { practiceCount_delta: 1 });
}

/** 触发小程序分享 */
export async function postShare(options: {
  title: string;
  path: string;
  imageUrl: string;
  timeline?: boolean;
}): Promise<void> {
  try {
    wx.miniProgram?.postMessage({
      data: {
        msgId: `share_${Date.now()}`,
        type: options.timeline ? 'SHARE_TIMELINE' : 'SHARE_FRIEND',
        payload: {
          title: options.title,
          path: options.path,
          imageUrl: options.imageUrl,
        },
      },
    });
    console.log('[cloud sync] 分享消息已发送:', options.timeline ? '朋友圈' : '好友');
  } catch (e) {
    console.warn('[cloud sync] 分享消息发送失败:', e);
  }
}

// ─── AI 直连（@cloudbase/js-sdk ai() 流式接口）────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIStreamCallbacks {
  onChunk: (chunk: string, accumulated: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

/**
 * 通过 @cloudbase/js-sdk 的 ai() 接口流式调用大模型
 * - 直接 HTTP 调用，无需 postMessage，真正实时
 * - 支持 hunyuan-lite / hunyuan-turbos-latest / deepseek 等模型
 * - 返回 AbortController，可随时取消
 */
// createModel 的 provider 名 → 对应 streamText 里应传的 model 字段
// hunyuan: 混元 API，model 字段用 hunyuan-turbos-latest / hunyuan-pro 等
// deepseek: deepseek-chat / deepseek-r1-0528 等
const AI_PROVIDER = 'hunyuan';           // createModel 的 provider key
const AI_MODEL_NAME = 'hunyuan-pro';     // streamText 里的 model 字段（混元具体模型）

export async function callAIStream(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  modelName = AI_MODEL_NAME,
): Promise<AbortController> {
  const ctrl = new AbortController();

  getDb(); // 触发 SDK 初始化（确保 _app 已创建）
  const authOk = await ensureCloudAuth();

  console.log('[AI] 开始流式调用, provider=', AI_PROVIDER, ' model=', modelName, ' messages=', messages.length, ' authOk=', authOk, ' _app=', !!_app);

  if (!_app) {
    callbacks.onError('tcb-js-sdk 初始化失败，请检查网络');
    return ctrl;
  }

  // authOk=false 时（匿名登录失败）也尝试继续，部分环境不需要登录态
  // 异步执行，不阻塞调用方
  (async () => {
    try {
      console.log('[AI] 步骤1: 创建 ai() 实例');
      const aiInstance = _app!.ai();
      console.log('[AI] 步骤2: createModel provider=', AI_PROVIDER);
      const aiModel = aiInstance.createModel(AI_PROVIDER);
      console.log('[AI] 步骤3: 调用 streamText, model=', modelName, ' messages=', JSON.stringify(messages).slice(0, 100));

      type StreamResult = {
        textStream: AsyncIterable<string>;
        messages: Promise<Array<{ role: string; content: unknown }>>;
      };
      const res = await (aiModel.streamText as unknown as (input: Record<string, unknown>) => Promise<StreamResult>)({
        model: modelName,
        messages,
        abortSignal: ctrl.signal,
      });

      console.log('[AI] 步骤4: streamText 返回，开始消费 textStream');
      let accumulated = '';
      for await (const text of res.textStream) {
        if (ctrl.signal.aborted) break;
        accumulated += text;
        callbacks.onChunk(text, accumulated);
      }

      console.log('[AI] 步骤5: textStream 消费完毕，accumulated.length=', accumulated.length);

      // 等待最终完整文本
      const finalMessages = await res.messages;
      const fullText = finalMessages
        .filter(m => m.role === 'assistant')
        .map(m => (typeof m.content === 'string' ? m.content : ''))
        .join('') || accumulated;

      console.log('[AI] 流式完成，总长度:', fullText.length);
      callbacks.onDone(fullText || accumulated);
    } catch (err: unknown) {
      if (ctrl.signal.aborted) return; // 主动取消不报错
      // 深度序列化错误，方便排查 SDK 抛出的非标准错误对象
      console.error('[AI] 流式调用失败 (原始):', err);
      let msg = '未知错误';
      if (err instanceof Error) {
        msg = err.message || String(err);
      } else if (typeof err === 'string') {
        msg = err;
      } else {
        try {
          msg = JSON.stringify(err) || String(err);
        } catch {
          msg = String(err);
        }
      }
      console.error('[AI] 流式调用失败 (message):', msg);
      callbacks.onError(msg);
    }
  })();

  return ctrl;
}

/** 批量同步 */
export async function cloudSyncAll(localData: Record<string, unknown>): Promise<void> {
  if (!_openid) return;
  const lists: Array<{ key: string; fn: (item: Record<string, unknown>) => Promise<void> }> = [
    { key: 'testHistory', fn: cloudSaveTestResult },
    { key: 'diaries', fn: cloudSaveDiary },
    { key: 'posts', fn: cloudAddPost },
  ];
  for (const { key, fn } of lists) {
    const arr = localData[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr as Record<string, unknown>[]) {
      if (item?.id) {
        try { await fn(item); } catch (e) { console.error('[cloud sync] 批量同步失败:', key, e); }
      }
    }
  }
}
