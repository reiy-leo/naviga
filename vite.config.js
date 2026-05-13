import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import lucidePreprocess from 'vite-plugin-lucide-preprocess';
// import zip from 'vite-plugin-zip-pack';

export default defineConfig({
  base: './',
  oxc: {
    transform: {
      jsxRuntime: 'automatic',
    },
  },
  plugins: [
    lucidePreprocess(),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler', 'eslint-plugin-perfectionist'],
      },
    }),
    tailwindcss(),
    // zip({ outDir: 'release', outFileName: `crx-${manifest.name}-${manifest.version}.zip` }),
  ],
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
        background: resolve(__dirname, 'src/background.js'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
