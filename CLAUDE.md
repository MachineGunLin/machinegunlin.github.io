# 树哥的地下室：项目协作原则

## 项目范围

- 网站名称：树哥的地下室
- 英文名称：Notes from Shu's Basement
- 定位：林榕健的个人博客与长期内容母库
- 内容方向：AI 与技术、数学与学习、独立开发、思考与生活
- 第一版目标：静态、轻量、可长期维护，并部署到 GitHub Pages 默认地址

## 技术原则

- 使用 Astro、TypeScript、Markdown / MDX 和 Astro Content Collections。
- 使用 npm、GitHub Actions 和 GitHub Pages。
- 保持纯静态，不引入数据库、登录、CMS、评论、Analytics 或第三方追踪。
- 除非确实需要，不引入 React、Vue 或其他客户端运行时。
- 优先小而可审查的改动；行为变化要补充对应检查。
- 敏感信息只放在本地 `.env`，不得提交；同步维护 `.env.example`。

## 内容与隐私

- 中文为主；英文文章只在确实存在时发布到 `/en/`。
- Frontmatter 维护 `title`、`description`、`publishDate`、`updatedDate`、`tags`、`category`、`lang`、`translationKey`、`draft`。
- 对外文案和文章定稿前必须完整使用 `humanizer-zh`，不能改变事实和用户观点。
- 博客仓库只保存用户确认公开的文章。
- 不得自行读取、复制或发布仓库外 `✏️Writing` 目录中的私人草稿。
- 不得猜测联系方式、社交账号、收入、用户数量或其他未确认事实。

## 版本控制与部署

- 公开仓库：`MachineGunLin/machinegunlin.github.io`。
- 主分支：`main`。
- Commit message 必须具体、有意义；每个明确阶段及时 commit 并 push。
- 使用 Astro 官方 GitHub Pages Action，不绑定自定义域名，不使用付费服务。
- 推送前至少运行 `npm run verify`；部署后必须打开真实网址验证。

## 文档同步

- `AGENTS.md` 和 `CLAUDE.md` 记录同一套项目原则；原则变化时必须同步修改。
- README 持续维护当前状态、已完成功能、TODO、技术栈、运行方式、写作流程和部署方式。

## 通知

每完成明确子任务、需要用户登录/授权/决策或遇到卡点时，调用上级全局原则指定的通知脚本。会话标签固定为“树哥的地下室”，通知正文以 `[Codex GPT-5 Effort:<级别>]` 开头。
