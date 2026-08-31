import { access, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const [, , rawTitle, rawLanguage = 'zh-CN'] = process.argv;

if (!rawTitle) {
  console.error('用法：npm run new:post -- "文章标题" zh-CN|en');
  process.exit(1);
}

if (!['zh-CN', 'en'].includes(rawLanguage)) {
  console.error('语言只能是 zh-CN 或 en。');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const asciiSlug = rawTitle
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const slug = asciiSlug || `post-${today}`;
const targetDirectory = path.resolve('src/content/posts', rawLanguage);
const targetPath = path.join(targetDirectory, `${slug}.md`);

try {
  await access(targetPath, constants.F_OK);
  console.error(`文件已存在：${targetPath}`);
  process.exit(1);
} catch {
  // 目标不存在时继续创建。
}

const frontmatter = `---
title: ${JSON.stringify(rawTitle)}
description: "TODO"
publishDate: ${today}
updatedDate: ${today}
tags: []
category: 思考与生活
lang: ${rawLanguage}
translationKey: ${slug}
draft: true
---

从这里开始写。
`;

await mkdir(targetDirectory, { recursive: true });
await writeFile(targetPath, frontmatter, 'utf8');
console.log(`已创建：${targetPath}`);
