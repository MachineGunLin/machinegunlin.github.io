import { strict as assert } from 'node:assert';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

async function mustExist(relativePath) {
  const target = path.join(root, relativePath);
  await access(target);
  return target;
}

const requiredFiles = [
  'index.html',
  'posts/index.html',
  'posts/welcome/index.html',
  'about/index.html',
  '404.html',
  'rss.xml',
  'robots.txt',
  'favicon.svg',
  'og-default.png',
  'og-default.svg',
];

await Promise.all(requiredFiles.map(mustExist));

const files = await listFiles(root);
assert(files.some((file) => /^sitemap.*\.xml$/u.test(path.basename(file))), '没有生成 Sitemap。');

const articleHtml = await readFile(path.join(root, 'posts/welcome/index.html'), 'utf8');
assert(articleHtml.includes('<html lang="zh-CN">'), '中文文章没有设置正确的 HTML lang。');
assert(articleHtml.includes('class="table-of-contents"'), '中文文章没有生成目录。');
assert(articleHtml.includes('rel="canonical"'), '文章缺少 canonical。');
assert(articleHtml.includes('hreflang="zh-CN"'), '文章缺少中文 hreflang。');

const rssXml = await readFile(path.join(root, 'rss.xml'), 'utf8');
assert(rssXml.includes('欢迎来到树哥的地下室'), 'RSS 没有包含欢迎文章。');

assert(
  !files.some((file) => file.includes(`${path.sep}en${path.sep}index.html`)),
  '不应生成空白英文首页。',
);
assert(
  !files.some((file) => file.includes('example-english-post')),
  '英文验证示例不得发布到网站。',
);

const textExtensions = new Set(['.html', '.xml', '.txt', '.svg', '.css', '.js']);
const textFiles = files.filter((file) => textExtensions.has(path.extname(file)));
const privatePatterns = [
  { name: '本机绝对路径', expression: /\/Users\//u },
  { name: '私人写作目录', expression: /✏️Writing/u },
  { name: 'GitHub Token', expression: /gh[opsu]_[A-Za-z0-9]{20,}/u },
  { name: 'OpenAI 风格密钥', expression: /sk-[A-Za-z0-9_-]{20,}/u },
  { name: '未确认邮箱', expression: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu },
];

for (const file of textFiles) {
  const content = await readFile(file, 'utf8');
  for (const pattern of privatePatterns) {
    assert(!pattern.expression.test(content), `${path.relative(root, file)} 包含${pattern.name}。`);
  }
}

const htmlFiles = files.filter((file) => file.endsWith('.html'));
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/gu)].map((match) => match[1]);

  for (const href of hrefs) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathname = decodeURIComponent(new URL(href, 'https://machinegunlin.github.io').pathname);
    if (pathname === '/') {
      await mustExist('index.html');
      continue;
    }

    const relativeTarget = pathname.endsWith('/')
      ? `${pathname.slice(1)}index.html`
      : pathname.slice(1);

    try {
      await mustExist(relativeTarget);
    } catch {
      throw new Error(`${path.relative(root, htmlFile)} 含失效内部链接：${href}`);
    }
  }
}

const css = (
  await Promise.all(files.filter((file) => file.endsWith('.css')).map((file) => readFile(file, 'utf8')))
).join('\n');
assert(css.includes('@media print'), '构建产物缺少打印样式。');

console.log('构建产物、内部链接、RSS、Sitemap、404、隐私和打印样式检查通过。');
