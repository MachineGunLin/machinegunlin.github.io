# 个人博客技术审计与增量改造规划（2026-11-03）

> 状态：待用户审核；本文件仅为规划，不授权开始重构。
> 范围：MachineGunLin/machinegunlin.github.io。禁止修改 Writing、其他仓库、DNS、域名、线上部署配置。

## 1. 审计证据与当前状态

已通过 GitHub Connector 读取 main 分支的 README、package.json、astro.config.mjs、.github/workflows/deploy.yml、src/site.config.ts、src/content.config.ts、src/lib/posts.ts、首页、About、文章列表、文章详情组件、分类页、标签页、导航、RSS、robots.txt、示例文章及构建检查脚本。下文“已实现”表示代码存在，不等于已经完成现场浏览器、移动端与线上部署验收；本轮未运行本地构建、未读取 GitHub Actions 的最新运行状态、未进行 Lighthouse 测试，也未穷举仓库每个文件。

- 框架：Astro ^7.2.9、TypeScript ^6.0.3、npm、Node >=22.12。
- 写作：Markdown/MDX，Astro Content Collections，Zod frontmatter（title、description、publishDate、updatedDate、tags、category、lang、translationKey、draft）。
- 渲染：Shiki 代码高亮、remark-math + rehype-katex、文章目录、阅读时间、前后篇、双语关联。
- 路由：/、/posts/、/posts/:slug/、/en/posts/:slug/、/about/、/categories/:category/、/tags/:tag/、/rss.xml。分类有四个：AI 与技术、数学与学习、独立开发、思考与生活。
- SEO：BaseLayout 已输出 description、canonical、OG、Twitter Card、article 时间、翻译对应 hreflang；已配置 sitemap 和 robots；RSS 已实现。尚需逐项验证结构化数据、各文章 OG 图、图片 alt、社交预览和索引情况。
- 部署：push main 或 workflow_dispatch 触发 GitHub Actions；withastro/action@v6 以 Node 24 执行 npm run verify，随后 actions/deploy-pages@v5 发布到 GitHub Pages；未配置自定义域名。**本次在 main 增加 docs 文档也会触发既有部署工作流，但不修改工作流配置与网站代码。**
- 验证：npm run verify = astro check + check-content + build + check-build；构建检查包含路由、内部链接、RSS、Sitemap、隐私字符串、打印样式等断言。
- 目前确认存在的公开文章示例：src/content/posts/zh-CN/welcome.md（draft:false）；不据此推断全部文章数量或最近线上构建结果。
- README 定义 Writing 私有草稿—人工确认公开—博客发布—平台二次改写的人工审批工作流；当前脚本 npm run new:post 创建 draft:true 的模板。
- About 当前有社交链接 TODO，首页已有品牌介绍和分类入口，主导航只有首页、文章、关于、RSS。

### 已识别的改进点（按优先级）

1. **P0：中文 slug 冲突**。scripts/new-post.mjs 通过 ASCII 化生成 slug，纯中文标题会回退为 post-YYYY-MM-DD；同一天新建第二篇中文文章会冲突。后续改为用户显式 slug 或短稳定 ID + 冲突检测，不自动覆盖文件。旧链接必须保持不变。
2. **P0：发布边界**。确保只有用户明确标记为公开且 draft:false 的内容进入博客；发布工具不能直接抓取 Writing 私人草稿或自动发布。
3. **P1：分类和标签可发现性**。分类、标签的动态详情页已存在，但未确认有统一目录页；导航目前未显示分类页入口。优先完善可浏览性而非增加分类数量。
4. **P1：内容结构**。课程笔记、读书笔记、AI/Infra、独立开发可用现有四大类 + 精选标签/系列组织；避免把所有课程建成顶级导航。
5. **P1：SEO/GEO**。在现有 canonical、RSS、Sitemap、OG、hreflang 基础上验证 Article/BlogPosting JSON-LD、作者署名、时间、代码及公式可读性、图片性能、内部链接；不承诺 AI 搜索收录效果。
6. **P1：视觉与内容体验**。手机屏幕阅读、正文宽度、字号行距、代码横向滚动、目录、锚点、夜间主题对比、图片及中英文混排需实际浏览器验收。保留“树哥的地下室”识别度。
7. **P2：文章发布工具**。把 metadata 校验、相对图片资源、预览和多平台分发的手动确认点固化为单一路径。

## 2. 目标信息架构

- **首页 /**：一句话个人定位与写作领域、精选文章（人工设置）、最近文章、内容入口、项目/Now（可第二阶段再加）。不变成工具看板。
- **文章 /posts/**：按时间倒序，建议加清晰分类筛选/标签入口；不需要过早引入客户端搜索。
- **分类 /categories/:slug/**：保留四大类，AI 与技术包含 AI Coding/Agent/LLM/Infra；数学与学习包含 Stanford 课程与学习笔记；独立开发包含产品开发与复盘；思考与生活包含阅读、个人思考。课程作为系列或标签如 Stanford CS146S/CS329Z，读书笔记按书名/阅读标签归档。
- **标签 /tags/:tag/**：作为跨分类主题；未来如 Agent、RAG、Training Infra、CS146S、读书等。建立标签命名规范（避免“Agent/Agents/智能体”近义重复）。
- **About /about/**：个人介绍、研究兴趣、精选项目和联系方式；社交链接需本人确认后公开。
- **文章详情**：标题、摘要、作者、发布日期/更新日期、分类/标签、正文、目录、上一篇/下一篇、可选关联文章；确保静态 HTML 可读。
- **项目页 /projects/**（可选 P2）：只在有足够公开项目后再建立，不作为 MVP 前置条件。
- 双语原则：中文为主，英文仅在有价值时写独立版本；保留已有 /en/posts/ 及翻译关联，不强制每篇双语。

## 3. 三种方案

| 方案 | 实现方式 | 预计投入（有效开发时长） | 后续维护 | 扩展性 | 判断 |
|---|---|---:|---|---|---|
| A 最小修补 | 保留 Astro、现有页面和分类，仅修 slug、元数据与发布文档、有限样式 | 4–8h | 很低 | 中高 | 最快，但信息发现与视觉提升有限 |
| **B Astro 渐进增强（推荐）** | 保留 Astro 7 + Content Collections + Pages；改善首页/文章发现、阅读体验、SEO、发布脚本 | **12–22h**（含测试与验收） | 低 | 高 | 在维护成本和体验之间最优 |
| C 迁移成熟静态主题 | 改用 Hugo/Quartz/其他 Astro 主题并迁移内容、路径及样式 | 20–40h+ | 中，依赖主题升级 | 中高 | 目前缺乏迁移动机，易损伤已有品牌与 SEO |

工时为估算，不含文章内容生产、域名/DNS、第三方统计服务接入，也不包含全面视觉重设计；需在本地测试结果后调整。

## 4. 推荐技术方案

继续采用 Astro 7 + TypeScript + Markdown/MDX + Content Collections + GitHub Pages。尽可能使用 build-time 静态数据，不增加数据库、CMS、登录、服务端 API、评论系统、重型 UI 框架或复杂编排。现有 KaTeX、Shiki、RSS、Sitemap、OG 直接复用。

内容 frontmatter 维持最小集合。可逐步新增可选 fields，如 series、seriesOrder、featured、cover、source/updatedReason；每个新增字段先证明展示需求，再配 Zod 校验。URL slug 优先保持固定且与标题解耦；已经发布的 URL 永不因改标题自动变化。应建立基本的重定向/迁移规则（只有确实需要变更 URL 才实施）。

SEO/GEO：首先修正常规 SEO（标题/摘要差异化、canonical、hreflang、可爬 HTML、Sitemap、OG、Article/BlogPosting JSON-LD），其次增加真实作者信息、明确更新日期、引用来源、论点与示例、稳定站内专题和相关链接。AI 搜索可见度没有可保证的专用开关，避免无验证价值的“GEO 黑科技”。不默认暴露私人联系方式与身份信息。

## 5. Writing → 博客发布边界（此阶段仅设计，不触碰 Writing）

1. 在 Writing 写作与研究；素材、引用与隐私内容留在私有工作区。
2. 用户挑选文章并明确“准许公开”，确认标题、观点、隐私和图片版权。
3. 在博客仓库运行单条导入/新建命令（后续开发），从指定**单个** Markdown 文件复制已审核内容；禁止自动扫描、批量同步 Writing。
4. 工具校验 frontmatter、slug 唯一性、图片相对路径和引用、draft 默认 true；输出差异与预览链接供用户验收。
5. 用户再次确认发布后，才将 draft 改 false 并合入 main；现有 GitHub Actions 完成静态构建部署。
6. 发布后用户另行决定公众号、知乎、X 等平台的改写与发布；博客 canonical URL 可作为原文链接，不允许 AI 自动对外发布。

第一阶段完全可用手工复制实现；自动化只在稳定发表数篇文章后再做。注意不得将 Writing 中未公开草稿、私有绝对路径、密钥、私密素材提交到公开博客。

## 6. 分阶段任务与验收

### Phase 0 — 基线确认（2–3h）
- [ ] 拉取仓库、记录 main SHA，使用 README 的 Node/npm 版本执行 npm ci + npm run verify。
- [ ] 检查线上 Pages 最新 Actions 运行与实际站点是否和 main 一致；不修改部署配置。
- [ ] 截图检查桌面、手机、深浅色阅读；核对首页、文章、分类、标签、About、RSS、Sitemap、404。
- [ ] 盘点现有公开文章及 URL，留存 URL 基线；评估 Lighthouse/可访问性。

**验收**：verify 通过；基线 URL、屏幕截图与问题清单可复现；无私有数据泄露。

### Phase 1 — 发布可靠性（3–5h）
- [ ] 修复纯中文 slug 与同日重名冲突；补命令级测试，默认 draft:true。
- [ ] 制定 frontmatter、分类/标签/系列命名规范及图片路径规范。
- [ ] 验证重复 slug、缺字段、无效分类、草稿外泄均能阻止发布。

**验收**：同日创建多篇中文文章无覆盖；错误 metadata 验证失败；draft 页面/RSS/Sitemap 均不包含未公开文章；旧 URL 全部保留。

### Phase 2 — 内容与视觉（4–8h）
- [ ] 改善首页精选/最近文章信息密度，文章归档和分类/标签发现。
- [ ] 优化文章排版（中文排版、代码、数学、图片、目录、手机浏览）。
- [ ] 保留品牌和既有路由，控制第三方依赖及 JS 体积。

**验收**：360px、768px、1440px 视口无布局溢出；文章目录与锚点可用；长代码可滚动；键盘焦点清晰；原有内容不丢失。

### Phase 3 — SEO / 传播（2–4h）
- [ ] 对 Article/BlogPosting JSON-LD 做静态生成和结构验证。
- [ ] 检查各页 metadata、OG 图片、RSS、Sitemap、robots、hreflang、404。
- [ ] 完善文章内链、作者说明、更新时间；不接入不必要的追踪。

**验收**：每篇公开文章具有唯一 canonical 与有效 metadata；JSON-LD 有效；构建后无死链；图片和文字可正常分享预览。

### Phase 4 — Writing 手动发布试运行（1–2h，另计写作时间）
- [ ] 仅拿**一篇用户明确批准公开**的文章进行人工复制与预览。
- [ ] 在博客仓库通过校验、人工审稿后发布；记下摩擦点。
- [ ] 评估是否需要开发只读的“导入单篇文章”CLI；不改 Writing。

**验收**：可以重复完成“审稿→草稿预览→确认公开→部署→验证”；不能绕过人工确认；Writing 不产生文件改动。

## 7. 本轮边界与待确认事项

本轮只新增这份 docs 规划文件，不修改源码、不运行迁移、不改变 Actions、DNS、域名或 Writing。线上功能与部署状态仍需 Phase 0 实测确认。用户审核方案后才开始代码实现。具体设计建议在 Phase 0 完成后提供页面线框图/视觉方向供单独批准。
