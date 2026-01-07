import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Static output mode only - no SSR
  output: 'static',
  
  // Site URL for canonical links and sitemap
  site: 'https://whofound.me',
  
  // Build configuration
  build: {
    // Inline small assets for performance
    inlineStylesheets: 'auto',
  },
  
  // Vite configuration
  vite: {
    build: {
      // Generate source maps for debugging
      sourcemap: true,
    },
  },
});

