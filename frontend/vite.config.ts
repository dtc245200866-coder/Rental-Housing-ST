import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lắng nghe trên mọi interface để Docker có thể map port ra ngoài.
    host: true,
    port: 5173,
    strictPort: true,
    // Dùng polling để hot reload hoạt động ổn định khi chạy trong Docker trên Windows.
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      // Cổng HMR mà trình duyệt kết nối tới (khớp với cổng host đã map).
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        // Trong Docker dev, VITE_PROXY_TARGET=http://backend:8080 (tên service).
        // Chạy thủ công trên máy thì mặc định dùng localhost:8080.
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
