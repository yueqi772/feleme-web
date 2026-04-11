/**
 * CloudBase 云函数 HTTP 调用层（H5/小程序通用）
 * 集合命名规范：feleme_{collection}
 *
 * 使用方式：
 *   import { tcb } from '@/cloud/tcb';
 *   await tcb.collection('testHistory', 'add', { score: 85 });
 *   await tcb.collection('testHistory', 'list');
 */

export interface TcbResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  list?: T[];
  id?: string;
  updated?: number;
  removed?: number;
  action?: string;
}

const CLOUDBASE_ENV = 'cloudbase-3g22c9ce5bcf0e55';
const TCB_HTTP_BASE = `https://${CLOUDBASE_ENV}.service.cloudbase.cn`;

const HEADERS = { 'Content-Type': 'application/json', 'source': 'h5-webview' };

async function callFunction(name: string, data: Record<string, unknown>): Promise<TcbResponse> {
  try {
    const res = await fetch(`${TCB_HTTP_BASE}/${name}`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error(`[cloud] ${name} error:`, err);
    return { success: false, error: err.message || '网络请求失败' };
  }
}

export async function collection(
  collection: string, action: string, data?: Record<string, unknown>,
  query?: Record<string, unknown>, openid = '', limit = 20, skip = 0
): Promise<TcbResponse> {
  return callFunction('tcb', { collection, action, data, query, openid, limit, skip });
}

export const testHistory = {
  add(r: Record<string, unknown>) { return collection('testHistory', 'add', r); },
  list(l = 20, s = 0) { return collection('testHistory', 'list', undefined, undefined, '', l, s); },
};

export const diaries = {
  add(r: Record<string, unknown>) { return collection('diaries', 'add', r); },
  list(l = 20, s = 0) { return collection('diaries', 'list', undefined, undefined, '', l, s); },
};

export const posts = {
  add(r: Record<string, unknown>) { return collection('posts', 'add', r); },
  list(l = 20, s = 0) { return collection('posts', 'listAll', undefined, undefined, '', l, s); },
};

export async function initUser(data: { openid: string; nickname?: string; avatarUrl?: string }) {
  return callFunction('initUser', data);
}
