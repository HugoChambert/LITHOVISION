import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/LITHOVISION/',
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'pic/**/*',
          dest: 'pic'
        },
        {
          src: 'Sink/**/*',
          dest: 'Sink'
        },
        {
          src: 'logo.jpg',
          dest: ''
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        work: resolve(__dirname, 'work.html'),
        news: resolve(__dirname, 'news.html'),
        faq: resolve(__dirname, 'faq.html'),
        contact: resolve(__dirname, 'contact.html'),
        warranty: resolve(__dirname, 'warranty.html')
      }
    }
  }
});
