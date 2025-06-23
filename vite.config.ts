// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { diPlugin } from './vite-plugin-di'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    diPlugin({
      verbose: true,
      watch: true,
      enableFunctionalDI: true,
      generateDebugFiles: true // Generate .di-transformed files for debugging
    }),
    react()
  ],
})