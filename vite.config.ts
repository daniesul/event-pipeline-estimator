import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative asset paths so the build also works from a sub-folder
  // (e.g. yoursite.com/tools/pipeline-estimator/).
  base: './',
});
