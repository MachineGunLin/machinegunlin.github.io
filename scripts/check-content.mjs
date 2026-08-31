import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const fixtureUrl = new URL('../docs/examples/post.en.mdx', import.meta.url);
const source = await readFile(fixtureUrl, 'utf8');
const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/u);

assert(match, '英文示例必须包含完整 Frontmatter。');

const [, frontmatter, body] = match;
const requiredFields = [
  'title',
  'description',
  'publishDate',
  'updatedDate',
  'tags',
  'category',
  'lang',
  'translationKey',
  'draft',
];

for (const field of requiredFields) {
  assert(new RegExp(`^${field}:`, 'mu').test(frontmatter), `英文示例缺少 ${field}。`);
}

assert(/^lang: en$/mu.test(frontmatter), '英文示例的 lang 必须是 en。');
assert(/^draft: true$/mu.test(frontmatter), '英文示例必须保持 draft: true。');
assert(body.includes('```ts'), '英文示例必须包含 TypeScript 代码块。');
assert(body.includes('$E = mc^2$'), '英文示例必须包含行内公式。');
assert(body.includes('$$'), '英文示例必须包含块级公式。');

const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
  syntaxHighlight: 'shiki',
  shikiConfig: {
    theme: 'github-light',
  },
});
const rendered = await processor.render(body, { fileURL: fixtureUrl });

assert(rendered.code.includes('class="katex"'), 'KaTeX 没有渲染数学公式。');
assert(/class="astro-code(?:\s|")/u.test(rendered.code), 'Shiki 没有渲染代码高亮。');
console.log('英文结构、Markdown 代码块和数学公式检查通过。');
