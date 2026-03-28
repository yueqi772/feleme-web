/**
 * 小程序登录态接收
 *
 * 当 H5 页面被微信小程序 WebView 嵌入时，
 * 小程序会通过 URL 参数将用户登录信息传递过来。
 *
 * 调用方式：在 App 入口或 AuthContext 初始化时调用一次即可。
 *
 * @returns 登录数据（如果有）；null（如果没有）
 */
export interface MiniProgramLoginData {
  nickname: string;
  avatar: string;
  gender: number;
  province: string;
  city: string;
  from: 'miniprogram';
}

export function handleMiniProgramLogin(): MiniProgramLoginData | null {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const mpLogin = params.get('__mp_login');
  const nickname = params.get('nickname');
  const avatar = params.get('avatar');

  if (from === 'miniprogram' && mpLogin === '1' && (nickname || avatar)) {
    return {
      nickname: decodeURIComponent(nickname || ''),
      avatar: decodeURIComponent(avatar || ''),
      gender: Number(params.get('gender') || 0),
      province: decodeURIComponent(params.get('province') || ''),
      city: decodeURIComponent(params.get('city') || ''),
      from: 'miniprogram',
    };
  }
  return null;
}

/**
 * 检测当前是否运行在微信小程序 WebView 中
 */
export function isRunningInMiniProgram(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('from') === 'miniprogram';
}
