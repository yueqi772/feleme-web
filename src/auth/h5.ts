/**
 * H5 独立版登录模块
 * 不依赖微信客户端，也不请求任何后端
 * 用 localStorage 生成匿名 ID，全程离线可用
 */

import { setOpenid } from '../cloud/index';

export interface H5User {
  id: string;          // 匿名UUID
  nickname: string;   // 用户自设昵称
  avatar: string;     // 固定emoji头像
}

const STORAGE_KEY = 'feleme_h5_user';

export function getH5User(): H5User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveH5User(user: H5User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function createH5User(nickname: string): H5User {
  const user: H5User = {
    id: generateUUID(),
    nickname: nickname.trim() || '匿名用户',
    avatar: getEmojiAvatar(),
  };
  saveH5User(user);
  return user;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const EMOJIS = ['🌿','🌸','🌙','⭐','🔥','💎','🎯','🌈','🍀','🦋'];
function getEmojiAvatar(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

export function isH5Standalone(): boolean {
  try {
    return !(window.location.search.includes('from=miniprogram') || /miniProgram/i.test(navigator.userAgent));
  } catch { return true; }
}

export function h5Login(nickname: string): void {
  const user = createH5User(nickname);
  setOpenid(user.id);
}
