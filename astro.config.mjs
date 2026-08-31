import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const markdownPlugins = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
};

export default defineConfig({
  site: 'https://machinegunlin.github.io',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith('/404.html'),
    }),
  ],
  markdown: {
    processor: unified(markdownPlugins),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
});
