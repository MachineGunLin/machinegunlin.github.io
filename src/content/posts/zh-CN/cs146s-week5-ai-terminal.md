---
title: "Stanford CS146S Week 5：AI 增强命令行与终端自动化"
description: "从 AI 为什么回到终端，到 Warp 与 CLI Agent 的差别，梳理 Block、Workflow、多模型、可视化 diff 等能力，并记录因预算取舍放弃 Warp Agent 作业的过程。"
publishDate: 2026-09-23
updatedDate: 2026-09-23
tags:
  - AI
  - Agent
  - Stanford
category: AI 与技术
lang: zh-CN
translationKey: cs146s-week5-ai-terminal
draft: false
---

## 2026 年了，为什么还要用终端

图形界面已经覆盖了大部分日常操作，但有几类工作，命令行到现在都没被替代掉：

| 场景 | GUI 应用 | 终端命令行 |
| --- | --- | --- |
| 批量处理几十上百个文件（改名、转格式） | 要一个个点，或者专门装软件 | 一行命令解决 |
| 远程服务器上操作 | 大部分服务器没有桌面环境 | 天然支持，SSH 直接进去 |
| 自动化 / 脚本化重复任务 | 很难录制成可靠脚本 | 天然就是脚本 |
| 版本控制、部署、包管理 | 图形化工具功能总慢官方一拍 | 官方工具都是命令行优先 |
| AI Agent 自主执行任务 | Agent 要在图形界面里一个个点按钮 | 命令行是 Agent 最自然的执行环境 |

不是情怀问题，是这几类场景的性质决定的：批量、重复、可脚本化的操作，文字指令天然比"点击几十次鼠标"更适合描述和复用。最后一行是这几年才多出来的新理由——AI Agent 能自主执行任务之后，首选的落地环境也是终端，不是图形界面上的按钮。

## 现在主流的终端有哪些

终端本身这两年也在被重新设计，大致分成两条路：一路给终端装 AI，一路死磕原生速度和体验。目前活跃的选手：

| 终端 | 背景 | 核心定位 | AI 原生 | 平台 |
| --- | --- | --- | --- | --- |
| Warp | 独立公司 | 定位"AI 开发环境" | 是 | Mac / Windows / Linux |
| Wave Terminal | 开源 | Block + Workspace + AI 重构，评测称其"最激进也最冒险" | 是 | Mac / Windows / Linux |
| Ghostty | Mitchell Hashimoto（Terraform、Vagrant 作者） | 官方自述 "fast, native, feature-rich"，不做 AI | 否 | Mac（SwiftUI + Metal）/ Linux（GTK） |
| WezTerm | 开源 | 跨平台 GPU 加速，Lua 配置 | 否 | 跨平台 |
| Alacritty / Kitty | 开源 | 极简、GPU 加速，纯拼速度 | 否 | 跨平台 |
| iTerm2 | 开源 | Mac 老牌经典 | 否 | 仅 Mac |

两条路线不是谁淘汰谁。过去一年都在往前跑，说明这是两种真实存在、并不互相替代的需求。

## 为什么选 Warp

选 Warp 是因为要解决的具体问题本身就是"AI 相关的操作太分散"：想用哪个模型就得开哪个装了对应插件的窗口，同一个 session 换不了模型；终端里的报错想分享给别人，只能截图。这些正好是 Warp 这条路线要解决的问题，不是 Ghostty 那条路线要解决的问题：

| 需求 | Ghostty 这类速度党 | Warp |
| --- | --- | --- |
| 想要 AI 直接嵌进终端 | 不支持 | 支持 |
| 想在同一个地方切换 Claude / GPT / Gemini | 不适用 | 支持 |
| 终端输出想方便地分享给别人 | 没有对应功能 | Block 分享 |
| 只在意启动速度和资源占用 | 更优 | 一般 |

如果日常卡点是前三条，Ghostty 这类工具再快也解决不了；如果卡点是启动速度和资源占用，Warp 也给不出更好的答案。选哪个终端，先看自己被哪一类问题卡住，不是看哪个更"新"。

## Warp 能做什么，比其他终端好在哪

![Warp 六个核心功能全景：Block 分享、Workflow 共享库、多模型切换、可视化 diff、Quake 模式、MCP 规则 UI 化，六个功能共同指向把 AI 操作从命令行文本搬进图形界面](/images/posts/cs146s-week5-ai-terminal/warp-feature-overview.png)

六个功能里，前三个是纯速度党的终端完全没有的东西：

**Block 分享**：每条命令加它的输出，在 Warp 里是一个独立的"Block"，可以单独复制、搜索，或者生成一个网页链接分享出去，颜色、缩进都保留。Warp 工程师 David Stern 分享过一个真实案例：以前团队里分享终端报错靠截图或者复制粘贴，截图只能看一屏、还容易丢格式，文本没法搜索；换成 Block 分享之后，一段 `cargo clippy` 的报错链接发过去，颜色和文件行号都在，同事直接点开就能定位问题。他的原话是这个功能"完全取代了团队里截图和复制粘贴终端输出的做法"。

**Workflow 共享库**：把常用命令存成带参数说明的模板，可搜索、可复用。工程师 Ian Hodge 的团队把值班时才会用到、平时很难凭记忆想起来的复杂命令（比如撤销一次破坏性变更的 cherry-pick 操作）存成了共享 Workflow，新人不用再去 Slack 求助频道里重复问同样的问题。

**多模型切换**：同一个对话框里能换着用 Claude、GPT、Gemini，不用为了换一家模型重开一个窗口或者装另一个插件。

**可视化 Diff**：Agent 改代码时，改动直接在面板里呈现，接受、拒绝，或者在面板里直接改几个字，鼠标点几下就行，不用切到命令行里一行行读 patch。

**Quake 模式**：一个全局快捷键就能唤出或者收起终端，系统层面生效，跨哪个桌面都能用。增长负责人 Michelle Lim 原本在 VS Code 里用集成终端，但那个终端用不了 Block 分享、存不了 Workflow，也没法拆成独立窗口，她后来把 Warp 配成 Quake 模式解决了这个问题。

**MCP / 规则 UI 化**：常用的 MCP server、给 Agent 定的规则、不同的 Agent 配置，都在设置里做成可视化表单去配置，不用手写命令行参数或者配置文件。

还有一个没画进图里但值得一提：**AI 自然语言转命令**。工程师 Agata Cieplik 调试性能问题要从日志里筛数据、分列、排序，以前得一步步试命令组合，现在直接用英文描述想要什么，比如"搜索 redraw，取第一列和第三列，再排序"，后台直接生成一整条 pipeline 命令。

## 用 Warp 和用 Claude Code / Codex 有什么区别

Claude Code、Codex 这类工具走的是另一条路：一个装在终端里的 CLI 程序，靠文字对话和手动敲命令交互，终端本身没有变，只是里面多了一个能聊天的程序。Warp 是把 AI 直接做成终端的一部分。差别具体在哪：

| 维度 | Claude Code / Codex（CLI Agent） | Warp（AI 开发环境） |
| --- | --- | --- |
| 改动怎么看 | CLI 里读 diff 文本，或切到外部编辑器 | 可视化 diff 面板，接受 / 拒绝 / 内联改 |
| 能用哪些模型 | 各自厂商锁定一家 | 同一对话框切 Claude / GPT / Gemini |
| 怎么圈定上下文 | 纯文字描述 | `@函数名` 符号引用 + 文件树浏览 |
| 保存的 workflow / 规则 | 没有对应产品功能 | Warp Drive，表单化配置 |
| 多任务并发状态 | 多个 CLI 标签页，靠自己盯 | 原生状态指示、阻塞提醒 |

这个差距不是模型能力上的。同一个 Sentry 报错，Warp 自己做过一次对照测试：Claude Code（用 Sonnet）花了 2-4 分钟修完，还留了点没删干净的冗余逻辑；Warp（用 GPT-5）平均 1 分 20 秒，输出更干净。两边比的不是谁的模型更聪明，是从发现问题到确认改对，中间要绕多少步。

**参考**：[Warp 文档](https://docs.warp.dev/)、[Warp vs Claude Code](https://docs.warp.dev/guides/agent-workflows/warp-vs-claude-code/)、[How Warp Uses Warp](https://www.warp.dev/blog/how-warp-uses-warp)、[Ghostty GitHub](https://github.com/ghostty-org/ghostty)

## Assignment

题目：*Agentic Development with Warp*。跟 Week 4 是同一个脚手架应用（FastAPI + SQLite + 静态前端），但这次要求用 Warp 而不是纯 Claude Code 做自动化，硬性要求两类都要有：

- **Warp Drive**（保存的 prompt / 规则 / MCP server 集成），至少 1 个
- **多 Agent 并发工作流**（在 Warp 的不同标签页里，多个 Agent 同时处理独立任务，用 `git worktree` 避免互相冲突），至少 1 个

限定只能改 `week5/` 内部，不能动其他周的内容。`writeup.md` 要写清楚：每个自动化的目标、输入输出、步骤、改造前后对比、每个任务用了什么自主程度的权限、多 Agent 部分的角色分工和并发情况，以及具体解决了什么痛点。

这周最终不做这个 Assignment。实际测试中，Warp 原生 Agent 对当前免费账号显示 `Out of credits`。BYOK 虽然可行，但意味着要再接一套 API 计费路径；已有 Codex 和 Claude 的订阅后，我不想只为这项作业再增加费用和工具链。Warp 会继续作为日常终端使用，但这周不产出 Warp Drive / 多 Agent 的作业代码，精力转向把阅读和真实踩坑经历写成这篇文章。
