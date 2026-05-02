import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 禁用压缩，保留完整的变量名和错误信息
    minify: false,
    // 生成源码映射
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'newtab.html'),
      },
    },
  },
  publicDir: 'public',
})
