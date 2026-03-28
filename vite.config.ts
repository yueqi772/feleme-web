import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 微信回调页 /wechat-callback 是 SPA 路由，需确保直接访问该路径时返回 index.html
  server: {
    fallback: 'index.html',
  },
  preview: {
    fallback: 'index.html',
  },
})
