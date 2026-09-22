import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://decision-tools.org',
  integrations: [
    sitemap(),
    {
      name: 'sitemap-alias',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const outDir = fileURLToPath(dir);
          const indexFile = `${outDir}/sitemap-index.xml`;
          const xmlFile = `${outDir}/sitemap.xml`;
          if (fs.existsSync(indexFile) && !fs.existsSync(xmlFile)) {
            fs.copyFileSync(indexFile, xmlFile);
          }
        },
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
