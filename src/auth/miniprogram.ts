export interface MiniProgramLoginData {
  openid: string;
  unionid?: string;
  nickname: string;
  avatar: string;
  gender: number;
  province: string;
  city: string;
  from: 'miniprogram';
}

export function handleMiniProgramLogin(): MiniProgramLoginData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const mpLogin = params.get('__mp_login');
    if (from !== 'miniprogram' || mpLogin !== '1') return null;

    return {
      openid: decodeURIComponent(params.get('openid') || ''),
      unionid: decodeURIComponent(params.get('unionid') || ''),
      nickname: decodeURIComponent(params.get('nickname') || ''),
      avatar: decodeURIComponent(params.get('avatar') || ''),
      gender: Number(params.get('gender') || 0),
      province: decodeURIComponent(params.get('province') || ''),
      city: decodeURIComponent(params.get('city') || ''),
      from: 'miniprogram',
    };
  } catch { return null; }
}

export function isRunningInMiniProgram(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('from') === 'miniprogram';
  } catch { return false; }
}
