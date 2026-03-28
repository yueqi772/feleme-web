/**
 * 微信登录配置
 *
 * 配置步骤：
 * 1. 到微信开放平台 (https://open.weixin.qq.com) 注册开发者账号
 * 2. 创建一个网站应用，获取 AppID 和 AppSecret
 * 3. 在微信开放平台设置授权回调域：配置你的生产域名
 *    （开发时使用 localhost，部署时替换为你的域名）
 *
 * 环境变量设置（.env 文件）：
 *   VITE_WECHAT_APP_ID=你的AppID
 *   VITE_WECHAT_REDIRECT_URI=http://localhost:5173/wechat-callback
 *
 *   WECHAT_APP_SECRET=你的AppSecret（仅后端使用，永不暴露给前端）
 *   WECHAT_CALLBACK_URL=http://localhost:5173/wechat-callback
 */

export const WECHAT_APP_ID = import.meta.env.VITE_WECHAT_APP_ID || '';
export const WECHAT_REDIRECT_URI = import.meta.env.VITE_WECHAT_REDIRECT_URI || '';

/**
 * 生成微信授权链接
 * 微信开放平台授权登录地址：https://open.weixin.qq.com/connect/qrconnect
 * 公众平台网页授权地址：https://open.weixin.qq.com/connect/oauth2/authorize（已关注公众号场景）
 */
export function getWechatAuthUrl(): string {
  const state = generateState();
  sessionStorage.setItem('wechat_oauth_state', state);

  const params = new URLSearchParams({
    appid: WECHAT_APP_ID,
    redirect_uri: encodeURIComponent(WECHAT_REDIRECT_URI),
    response_type: 'code',
    scope: 'snsapi_login',       // 网页登录获取用户基本信息
    state,
  });

  return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}`;
}

/**
 * 验证 OAuth state，防止 CSRF 攻击
 */
export function validateState(state: string): boolean {
  const saved = sessionStorage.getItem('wechat_oauth_state');
  sessionStorage.removeItem('wechat_oauth_state');
  return saved === state && saved !== null;
}

/**
 * 生成随机 state 参数
 */
function generateState(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 判断是否已配置微信登录
 */
export function isWechatLoginConfigured(): boolean {
  return Boolean(WECHAT_APP_ID && WECHAT_REDIRECT_URI);
}
