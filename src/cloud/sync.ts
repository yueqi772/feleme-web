/**
 * 云数据库同步模块
 *
 * 通信方案：
 * - 优先：fetch 调用本地 server /api/db（Node.js @cloudbase/node-sdk，无鉴权限制）
 * - 降级：wx.miniProgram.postMessage（小程序 webview 环境，后退时触发）
 */

// ─── 服务端代理配置 ───────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:3001';

async function dbViaServer(
  collection: string,
  action: string,
  opts: { data?: Record<string, unknown>; query?: Record<string, unknown>; openid?: string; limit?: number; skip?: number } = {}
): Promise<{ success: boolean; [k: string]: unknown }> {
  try {
    const res = await fetch(`${API_BASE}/api/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, action, ...opts }),
    });
    const json = await res.json() as { success: boolean; [k: string]: unknown };
    return json;
  } catch (e) {
    console.error(`[cloud sync] server proxy 失败 ${collection}/${action}:`, e);
    return { success: false, error: String(e) };
  }
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

function visualDebug(message: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    }
  } catch (err) {
    console.warn('[cloud sync] visualDebug alert 失败', err);
  }

  try {
    const toastMsgId = `debug_${++_msgSeq}_${Date.now()}`;
    wx.miniProgram?.postMessage({
      data: {
        msgId: toastMsgId,
        type: 'DEBUG_TOAST',
        payload: { title: message.slice(0, 7), fullText: message },
      },
    });
  } catch (err) {
    console.warn('[cloud sync] DEBUG_TOAST 发送失败', err);
  }
}

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
  const result = await dbViaServer('_ping', 'list', { limit: 1 });
  if (result.success !== false) {
    console.log('[cloud sync] ping: server proxy 可用');
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
  console.log('[cloud sync] dbAdd start', { collection });
  // 优先走服务端代理（Node.js @cloudbase/node-sdk，无 SDK 鉴权限制）
  const result = await dbViaServer(collection, 'add', { data: finalData });
  if (result.success) {
    console.log(`[cloud sync] server proxy 写入成功: ${collection}`, result.id);
    return;
  }
  console.warn(`[cloud sync] server proxy 写入失败，降级 postMessage: ${collection}`, result.error);
  visualDebug(`[proxy fail] ${collection}: ${String(result.error).slice(0, 50)}`);
  await postToMiniProgram('DB_ADD', { collection, data: finalData });
}

async function dbUpdate(collection: string, query: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
  const result = await dbViaServer(collection, 'update', { query, data });
  if (result.success) {
    console.log(`[cloud sync] server proxy 更新成功: ${collection}`);
    return;
  }
  console.warn(`[cloud sync] server proxy 更新失败，降级 postMessage: ${collection}`, result.error);
  await postToMiniProgram('DB_UPDATE', { collection, query, data });
}

async function dbSet(collection: string, query: Record<string, unknown>, data: Record<string, unknown>): Promise<void> {
  const result = await dbViaServer(collection, 'upsert', { query, data });
  if (result.success) {
    console.log(`[cloud sync] server proxy upsert 成功: ${collection}`);
    return;
  }
  console.warn(`[cloud sync] server proxy upsert 失败，降级 postMessage: ${collection}`, result.error);
  await postToMiniProgram('DB_SET', { collection, query, data });
}

// ─── 业务函数 ────────────────────────────────────────────

/** 存储测试结果 */
export async function cloudSaveTestResult(result: Record<string, unknown>): Promise<void> {
  await dbAdd('testHistory', { ...result, localId: String(result['id'] || '') });
}

/** 存储情绪日记 */
export async function cloudSaveDiary(diary: Record<string, unknown>): Promise<void> {
  const payload = { ...diary, localId: String(diary['id'] || '') };
  console.log('[cloud sync] cloudSaveDiary hit', payload);
  visualDebug('[cloud] saveDiary');
  await dbAdd('diaries', payload);
  console.log('[cloud sync] cloudSaveDiary done', diary['id'] || payload.localId || 'unknown');
}

/** 日记追加对话消息 */
export async function cloudAddChatMessage(diaryId: string, message: Record<string, unknown>): Promise<void> {
  await dbAdd('diaryMessages', { diaryId, ...message, localId: String(message['id'] || '') });
}

/** 发布社区帖子 */
export async function cloudAddPost(post: Record<string, unknown>): Promise<void> {
  await dbAdd('posts', { ...post, localId: String(post['id'] || '') });
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
  await dbAdd('comments', { ...comment, localId: String(comment['id'] || '') });
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
