
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // دڵنیابوونەوە لەوەی process.env لە هەردوو کاتی گەشەپێدان و build کردن بەردەستە
    'process.env': process.env
  },
  build: {
    target: 'esnext'
  }
});
