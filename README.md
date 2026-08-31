# 树哥的地下室

`Notes from Shu's Basement`

一个以中文为主的个人博客，记录 AI、数学、独立开发与生活笔记。它是林榕健（Charles Lin）的长期内容母库，社交平台文章会从这里改写和分发。

## 当前状态

第一版开发中，尚未上线。

## 已完成

- [x] 确认品牌、范围与公开仓库策略
- [x] 创建 GitHub 公开仓库
- [x] 建立项目原则与基础文档
- [ ] 完成 Astro 页面、内容模型与视觉
- [ ] 完成本地验证与视觉验收
- [ ] 部署并验证 GitHub Pages

## TODO

- 完成首页、文章列表、文章详情、关于页和 404
- 完成 RSS、Sitemap、robots.txt、Open Graph 和基础 SEO
- 完成中英文文章结构、翻译关联、数学公式与代码高亮
- 完成桌面端、移动端、打印与无障碍检查
- 配置 GitHub Pages 并验证线上地址
- 用户确认社交账号和联系方式后补充关于页链接

## 技术栈

- Astro 7
- TypeScript
- Markdown / MDX
- Astro Content Collections
- KaTeX
- GitHub Actions / GitHub Pages
- npm

第一版是纯静态网站，不使用数据库、登录、CMS、评论、Analytics 或第三方追踪。

## 本地运行

需要 Node.js 22.12 或更高版本。

```bash
npm install
npm run dev
```

完整检查：

```bash
npm run verify
```

生产构建：

```bash
npm run build
npm run preview
```

新建文章：

```bash
npm run new:post -- "文章标题" zh-CN
```

## 写作与发布流程

1. 在仓库外的 `✏️Writing` 目录中写草稿。
2. 与 AI 讨论并修改。
3. 对外文章定稿前使用 `humanizer-zh` 完整处理。
4. 用户明确确认公开后，才把文章加入本仓库。
5. 运行本地预览和 `npm run verify`。
6. Commit 并 push 到 `main`。
7. GitHub Actions 自动部署。
8. AI 再把文章改写成知乎、公众号、小红书或 X 版本。
9. 各平台最终发布由用户本人确认。

博客仓库只保存已经确认公开的文章。不要批量读取、复制或发布 `✏️Writing` 中的私人草稿。

## GitHub Pages 部署

仓库使用 Astro 官方 GitHub Pages Action。推送到 `main` 后，工作流会构建静态站点并部署到：

`https://machinegunlin.github.io`

首次部署需要在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。第一版不绑定自定义域名。
