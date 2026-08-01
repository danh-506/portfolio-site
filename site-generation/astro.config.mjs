import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
// https://astro.build/config
export default defineConfig({
  site: 'https://portfolio-site-dh.netlify.app',
  integrations: [sitemap()]
});