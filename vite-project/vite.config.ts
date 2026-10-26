import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // host: true để điện thoại cùng Wi-Fi truy cập được qua IP của máy tính.
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Web Client gọi đường dẫn tương đối /api và /uploads, Vite chuyển sang backend.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
