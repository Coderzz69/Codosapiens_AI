import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/leaderboard/',
  plugins: [react()],
  server: { port: 3001 }
});
