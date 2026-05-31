import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
	'/api': 'https://collab-backend-v2.onrender.com',
	'/socket.io': {
  	target: 'https://collab-backend-v2.onrender.com',
  	ws: true,
  	changeOrigin: true,
	},
    },
  },
})
