import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cowrieApiPlugin } from './cowrie-adapter.js'

export default defineConfig({
  base: './',
  plugins: [react(), cowrieApiPlugin()],
  server: {
  },
})
