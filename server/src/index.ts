/**
 * 微信登录认证后端服务
 *
 * 功能：
 * 1. 用授权码(code)换取 Access Token（Access Token 包含用户的 openid）
 * 2. 获取微信用户基本信息（昵称、头像等）
 *
 * 安全说明：
 * - AppSecret 只在此服务端使用，绝不暴露给浏览器
 * - 生产环境务必启用 HTTPS
 *
 * 启动：
 *   cd server && npm install && npm run dev
 *   默认监听 http://localhost:3001
 */

import express from 'express';
import cors from 'cors';
import tcb from '@cloudbase/node-sdk';

const app = express();
const PORT = process.env.PORT || 3001;

// 微信接口基础地址
const WECHAT_API_BASE = 'https://api.weixin.qq.com';

// ─── 云开发初始化 ─────────────────────────────────────────
const ENV_ID = 'cloudbase-3g22c9ce5bcf0e55';
let _db: ReturnType<ReturnType<typeof tcb.init>['database']> | null = null;

function getDb() {
  if (_db) return _db;
  const secretId = process.env.TCB_SECRET_ID;
  const secretKey = process.env.TCB_SECRET_KEY;
  if (!secretId || !secretKey) {
    console.error('[cloud] 未配置 TCB_SECRET_ID / TCB_SECRET_KEY，请到腾讯云控制台获取');
    return null;
  }
  try {
    const app = tcb.init({ env: ENV_ID, secretId, secretKey });
    _db = app.database();
    console.log('[cloud] node-sdk 初始化成功');
  } catch (e) {
    console.error('[cloud] node-sdk 初始化失败:', e);
  }
  return _db;
}

app.use(cors({
  // 开发时允许前端地址，生产环境请改为你的前端域名
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

/**
 * POST /api/db
 * 通用数据库操作代理（H5 端直接调用，绕过 tcb-js-sdk 鉴权限制）
 * 请求体：{ collection, action, data?, query?, openid?, limit?, skip? }
 */
app.post('/api/db', async (req, res) => {
  const { collection, action, data, query, openid, limit = 20, skip = 0 } = req.body as Record<string, unknown>;

  if (!collection || !action) {
    return res.status(400).json({ success: false, error: '缺少 collection 或 action 参数' });
  }

  const db = getDb();
  if (!db) {
    return res.status(500).json({ success: false, error: '云数据库未初始化' });
  }

  const colName = 'feleme_' + String(collection);
  const col = db.collection(colName);

  try {
    if (action === 'add' && data) {
      const finalData = { ...(data as Record<string, unknown>), createdAt: Date.now() };
      const result = await col.add(finalData);
      console.log(`[cloud] add ${colName}`, result.id);
      return res.json({ success: true, id: result.id });
    }

    if (action === 'list') {
      let q = col.orderBy('createdAt', 'desc').limit(Number(limit)).skip(Number(skip));
      if (openid) q = q.where({ openid });
      const result = await q.get();
      return res.json({ success: true, list: result.data, count: result.data.length });
    }

    if (action === 'get' && query) {
      const result = await col.where(query as Record<string, unknown>).limit(1).get();
      return res.json({ success: true, data: result.data[0] || null });
    }

    if (action === 'update' && query && data) {
      const _ = db.command;
      const dataObj = data as Record<string, unknown>;
      const updateData: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(dataObj)) {
        if (k.endsWith('_delta')) {
          updateData[k.replace(/_delta$/, '')] = _.inc(v as number);
        } else {
          updateData[k] = v;
        }
      }
      const result = await col.where(query as Record<string, unknown>).update(updateData);
      return res.json({ success: true, updated: result.updated });
    }

    if (action === 'upsert' && query && data) {
      const existing = await col.where(query as Record<string, unknown>).limit(1).get();
      if (existing.data.length > 0) {
        await col.doc((existing.data[0] as { _id: string })._id).remove();
      }
      const result = await col.add({ ...(query as object), ...(data as object), createdAt: Date.now() });
      return res.json({ success: true, id: result.id });
    }

    return res.status(400).json({ success: false, error: `不支持的 action: ${action}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[cloud] ${action} ${colName} 失败:`, msg);
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /auth/wechat/exchange
 * 用授权码换取 Access Token 和用户信息
 *
 * 请求体：{ code: string, state: string }
 * 返回：{ openid, nickname, headimgurl } 或错误信息
 */
app.post('/auth/wechat/exchange', async (req, res) => {
  const { code, state } = req.body as { code?: string; state?: string };

  if (!code) {
    return res.status(400).json({ error: '缺少授权码 (code)' });
  }

  // 验证 state（简单验证，生产环境建议使用更安全的 session）
  if (!state) {
    return res.status(400).json({ error: '缺少 state 参数' });
  }

  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('【微信登录】环境变量 WECHAT_APP_ID 或 WECHAT_APP_SECRET 未配置');
    return res.status(500).json({
      error: '服务器未配置微信登录，请联系管理员',
    });
  }

  try {
    // Step 1：用 code 换取 access_token
    const tokenUrl = `${WECHAT_API_BASE}/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json() as Record<string, unknown>;

    if (tokenData.errcode) {
      console.error('【微信登录】换取 Token 失败', tokenData);
      return res.status(400).json({
        error: `微信接口错误: ${tokenData.errmsg || tokenData.errcode}`,
      });
    }

    const accessToken = tokenData.access_token as string;
    const openid = tokenData.openid as string;

    // Step 2：用 access_token 获取用户基本信息（可选）
    const userInfoUrl = `${WECHAT_API_BASE}/sns/userinfo?access_token=${accessToken}&openid=${openid}`;
    const userInfoRes = await fetch(userInfoUrl);
    const userInfo = await userInfoRes.json() as Record<string, unknown>;

    // 允许 userinfo 失败不影响登录（部分用户可能没有设置昵称）
    if (userInfo.errcode) {
      console.warn('【微信登录】获取用户信息失败（非致命）', userInfo.errmsg);
    }

    console.log(`【微信登录】用户 ${openid} 登录成功`);

    return res.json({
      success: true,
      openid,
      nickname: (userInfo.nickname || '微信用户') as string,
      headimgurl: (userInfo.headimgurl || '') as string,
      // 以下是敏感信息，仅在生产环境中通过安全通道传递给前端
      // 前端用 openid 作为用户唯一标识
    });
  } catch (err) {
    console.error('【微信登录】服务器异常', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /health - 健康检查
 */
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🔐 微信登录认证服务已启动`);
  console.log(`   本地地址: http://localhost:${PORT}`);
  console.log(`   环境变量:`);
  console.log(`     WECHAT_APP_ID: ${process.env.WECHAT_APP_ID ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`     WECHAT_APP_SECRET: ${process.env.WECHAT_APP_SECRET ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`\n   配置步骤:`);
  console.log(`   1. 到 https://open.weixin.qq.com 注册并创建网站应用`);
  console.log(`   2. 设置环境变量: export WECHAT_APP_ID=你的AppID`);
  console.log(`   3. 设置环境变量: export WECHAT_APP_SECRET=你的AppSecret`);
  console.log(`   4. 重启服务\n`);
});
