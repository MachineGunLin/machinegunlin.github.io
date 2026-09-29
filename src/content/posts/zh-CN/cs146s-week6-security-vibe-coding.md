---
title: "Stanford CS146S Week 6：安全 Vibe Coding、漏洞检测与 AI 生成测试"
description: "从 SAST、DAST 到 AI Agent 的提示注入，梳理 AI 代码安全的能力边界、上下文衰退，以及一次用 Semgrep 修复漏洞的实战。"
publishDate: 2026-09-29
updatedDate: 2026-09-29
tags:
  - AI
  - 安全
  - Stanford
category: AI 与技术
lang: zh-CN
translationKey: cs146s-week6-security-vibe-coding
draft: false
---

## 一、AI 写代码越来越快，安全跟上了吗

Veracode 的《2026 GenAI Code Security Report》里有两个数字：让 AI 完成编码任务，大约 44% 的任务会引入有风险的漏洞；各家模型的平均安全通过率是 56%，一年前是 55%。这一年 AI 写代码快了不少，代码安不安全，几乎原地踏步。

Stanford CS146S Week 6 讲的就是这件事，主题是安全 vibe coding，嘉宾是 Semgrep CEO Isaac Evans。7 篇阅读材料从传统的安全测试讲起，一路讲到 AI Agent 被攻破的真实案例、拿 AI 反过来找漏洞的实验，最后落在一份真挖出过漏洞的 prompt 上。它们放在一起读，大致能回答 AI 在安全这件事上能帮多少忙、又会添多少乱。

| Reading | 讲什么 | 用在哪部分 |
| --- | --- | --- |
| [SAST vs DAST](https://www.splunk.com/en_us/blog/learn/sast-vs-dast.html)（Splunk） | 传统安全测试的分类：SAST、DAST、RASP | SAST、DAST、RASP |
| [Copilot Remote Code Execution via Prompt Injection](https://embracethered.com/blog/posts/2025/github-copilot-remote-code-execution-via-prompt-injection/)（Embrace The Red） | 一段藏起来的文字，让 Copilot 执行任意命令 | Agent 新风险 |
| [Finding Vulnerabilities in Modern Web Apps Using Claude Code and OpenAI Codex](https://semgrep.dev/blog/2025/finding-vulnerabilities-in-modern-web-apps-using-claude-code-and-openai-codex/)（Semgrep） | 用 AI Agent 扫 11 个真实 Web 应用找漏洞 | 让 AI 找漏洞、时灵时不灵 |
| [Agentic AI Threats: Identity Spoofing and Impersonation Risks](https://unit42.paloaltonetworks.com/agentic-ai-threats/)（Unit 42） | Agent 面临的 7 类威胁，以及 9 种实测攻击 | Agent 新风险 |
| [OWASP Top Ten](https://owasp.org/www-project-top-ten/)（OWASP） | 2025 版 Web 应用十大安全风险，以及排名方法 | 让 AI 找漏洞 |
| [Context Rot](https://www.trychroma.com/research/context-rot)（Chroma） | 输入越长，模型的表现怎么退化 | 时灵时不灵 |
| [Vulnerability Prompt Analysis with O3](https://github.com/SeanHeelan/o3_finds_cve-2025-37899/blob/master/system_prompt_uafs.prompt)（Sean Heelan） | 一份让 o3 在 Linux 内核里找到零日漏洞的 prompt 原文 | 时灵时不灵、漏洞挖掘 prompt |

## 二、SAST、DAST、RASP 分别是什么

这三个缩写对应安全测试的三道关。SAST 像体检，开发阶段就检查代码本身有没有毛病；DAST 像渗透测试，应用上线以后从外面攻一遍；RASP 像贴身保镖，应用正式跑起来以后贴身护着，攻击一发生就拦，不等出报告。

SAST（Static Application Security Testing，静态应用安全测试）是白盒测试，程序不用跑，直接读源码找问题。Splunk 的文章列了七种做法。

![SAST 的七种方法：模式匹配、数据流分析、控制流分析、自定义规则、依赖扫描、语义分析与机器学习模型](/images/posts/cs146s-week6-security-vibe-coding/sast-seven-methods.png)

SAST 的好处是发现得早，问题在开发阶段就暴露出来，修起来便宜；代价是误报多，而且它只看得到代码本身，运行时才冒出来的问题它看不见。七种做法里的数据流分析，包含污点追踪（taint tracking）：盯住一段不可信的数据，看它从入口一路流到危险的地方，中间有没有被正确处理。传统 SAST 引擎为这件事专门做了图遍历。

DAST（Dynamic Application Security Testing，动态应用安全测试）反过来，是黑盒测试，把程序跑起来从外面戳，一共四步。

![DAST 的四个步骤：扫描找入口、发送恶意请求模拟攻击、分析响应检测漏洞、生成报告](/images/posts/cs146s-week6-security-vibe-coding/dast-four-steps.png)

只有运行时或特定环境下才会出现的问题，DAST 能发现，它也不关心应用是用什么语言和框架写的。代价是发现得晚，修起来贵；看不到内部结构，漏报也更多。

| 比较维度 | SAST | DAST |
| --- | --- | --- |
| 测试方式 | 白盒测试，能看到源码，从内部检查 | 黑盒测试，看不到源码，只从外部测试 |
| 所处开发阶段 | 开发早期 | 开发后期，往往是部署中或部署后 |
| 能发现的问题 | SQL 注入、XSS、缓冲区溢出等代码缺陷 | 服务器配置错误、拒绝服务、应用层运行时问题 |
| 修复成本 | 较低，发现得早 | 较高，经常需要紧急修复 |
| 运行时/环境问题 | 很难发现 | 能发现特定环境下出现的问题 |
| 误报/漏报 | 分析深入，误报率较高 | 误报较少，但看不到内部，漏报风险较高 |

RASP（Runtime Application Self-Protection，运行时应用自我防护）又不在同一个层面。SAST 和 DAST 测完出报告，等人去修；RASP 直接装进应用运行环境，发现异常行为当场拦截。原文对 RASP 只是一笔带过，IAST 也只提了名字。

原文的结论是组合着用：SAST 放在开发早期抓代码问题，DAST 放在测试和部署阶段模拟真实攻击，两个都接进 CI/CD 持续扫，有余力再加 IAST 或 RASP。

> The future of application testing lies in combining SAST, DAST, and RASP to create a comprehensive security strategy.

这周作业用的 Semgrep 就是开源 SAST 工具。读完这篇再看作业，为什么要先把代码扫一遍，心里就有数了。

## 三、AI Agent 带来了什么新风险

2025 年 6 月底，Embrace The Red 博客作者向微软报告了 GitHub Copilot 的一个漏洞；8 月的 Patch Tuesday 修掉，编号 CVE-2025-53773。攻击从一段藏起来的文字开始，一路走到远程执行任意命令。

![CVE-2025-53773 攻击链：攻击者把指令藏进文件，Copilot 将其当成指令，改写 settings.json 开启自动批准，最后执行终端命令](/images/posts/cs146s-week6-security-vibe-coding/copilot-attack-chain.png)

关键在第四步：Copilot 往 `.vscode/settings.json` 写了一行 `"chat.tools.autoApprove": true`。这行一生效，Agent 模式就进了作者说的“YOLO 模式”，之后什么操作都不用再问用户，跑终端命令也一样。作者演示时弹了个计算器，还把 VS Code 主题改成红色，图的是一眼能看见；换成任意 shell 命令，同一条路照样走得通。

读这篇时，我的第一反应是加一道权限检查不就行了，往下读才发现没这么简单。模型没办法可靠地区分用户真正下的指令，和它正在处理的内容里恰好写着的文字。让它解释一个文件，它就得读文件；文件里混进一句像指令的话，模型没有可靠的办法把这句话单独标成数据。SQL 能靠参数化查询把代码和数据严格隔开，今天的 LLM 没有对应机制，指令和数据挤在同一个上下文窗口里。所以到 2026 年，prompt injection 还是整个行业都没解决的问题，Copilot 只是撞上它的其中一家。

这有点像一个照着信件办事的助理：让他读一封信，信里夹了一句“顺便把保险箱打开”，他分不清这是老板的吩咐还是信纸上的字，可能真就去开了。这次的漏洞还要更过分一点，助理能自己改员工手册，把“开保险箱之前先问老板”划掉，然后马上照新规矩办事。

所以微软这次修掉的是一个很窄的点：Agent 不能再自己改自己的权限配置。作者原话是：

> AI that can set its own permissions and configuration settings is wild!

能自己松开约束自己的规则，这种设计放在哪个 Agent 身上都是隐患。全文没提 Copilot 背后用的是哪个模型，因为这本来就是产品设计上的问题，跟模型聪不聪明关系不大。Week 4 讲过 Agent 的自主程度，这个 CVE 就是自主程度失控的真实样本，本该由人点头的操作，被 Agent 自己一步步松绑成了不用点头。

回头拿 SAST 和 DAST 去套这个漏洞，会发现套不上。SAST 查代码结构，判断不了一段自然语言像不像攻击指令；DAST 从网络层面发攻击载荷，也没考虑过模型会不会被一段话忽悠。这次的攻击载荷，就是文件里一段普通文字。

Prompt injection 只是 Agent 面临的威胁之一。Palo Alto Networks 旗下 Unit 42 用 OWASP 的 agentic AI 威胁框架做过实测，拿 CrewAI 和 AutoGen 两个框架各实现同一个模拟的股票投资顾问应用，逐个试了 9 种攻击，结论是这些风险跟用哪个框架没关系。这个框架把威胁分成 7 类，Copilot 的 CVE 同时占了其中两类。

| 威胁类别 | 攻击者做了什么 | 本周的例子 |
| --- | --- | --- |
| Prompt injection（提示注入） | 注入隐藏指令，改变 Agent 行为 | Copilot 攻击链 |
| Tool misuse（工具滥用） | 操纵 Agent 滥用接入工具 | — |
| Intent breaking（意图篡改） | 改变 Agent 以为的目标或推理过程 | — |
| Identity spoofing / impersonation（身份冒充） | 偷凭证或 token，以别人的身份行动 | 云元数据偷 token、BOLA |
| Unexpected RCE（意外远程代码执行） | 注入恶意代码，拿到执行权限 | Copilot 攻击链 |
| Agent communication poisoning（通信投毒） | 污染多 Agent 间传递的内容 | — |
| Resource overload（资源耗尽） | 耗尽算力、内存或服务配额 | — |

防御部分原文给了五层：收紧 prompt、过滤内容、校验工具输入参数、扫描工具本身的漏洞，以及把代码执行器关进沙箱。扫描工具漏洞这一层点名要用 SAST、DAST 和 SCA（软件成分分析，检查第三方依赖）。传统工具在这里还用得上，只是扫描对象从应用换成了 Agent 接入的那些工具。没有哪一层能单独扛住所有威胁，只能叠起来用。

## 四、让 AI 反过来找漏洞，效果怎么样

Semgrep 团队做过一次挺认真的实验，用 Claude Code 和 OpenAI Codex 扫 11 个真实开源 Python Web 应用，盯 6 类高危漏洞：认证绕过、IDOR、路径穿越、SQL 注入、SSRF、XSS。AI 一共报了 445 条发现，团队一条条人工复核；IDOR、认证绕过这类还真的跑了一遍，确认能不能被利用。文章测的是 2025 年的模型，具体分数到今天参考意义不大；这套“AI 先筛、人来验证”的流程倒是换什么模型都能照搬。

结果划出一条清楚的能力边界：AI 擅长推理权限逻辑，不擅长跨文件追踪数据流。IDOR（Insecure Direct Object Reference，不安全的直接对象引用）要判断的是一个用户到底有没有权限碰这个资源，这是语义推理，离 LLM 本来擅长的事很近。SQL 注入和 XSS 要追一段不可信数据从入口一路到危险位置，中间有没有被正确处理，也就是 SAST 引擎的污点追踪；LLM 读代码更像读文本做推理，这种跨文件、跨函数的长链条追踪它做不好。

|  | 相对擅长：权限推理类 | 相对吃力：跨文件追踪类 |
| --- | --- | --- |
| 典型漏洞 | IDOR 这类访问控制问题 | SQL 注入、XSS |
| 要做的判断 | 这个用户有没有权限碰这个资源 | 数据从入口到危险位置有没有被正确处理 |
| 更适合交给谁 | AI 能帮忙找，结果要人工验证 | 传统 SAST 引擎的污点追踪 |
| OWASP Top 10 2025 | A01 访问控制缺陷 | A05 注入 |

准确率也不高：Claude Code 报出来的发现里只有 14% 是真的，Codex 是 18%，剩下八成多都是误报。误报里有的至少加固了代码，有的则会把代码改坏。漏报根本没法统计，用的是真实应用，没人知道里面一共藏着多少漏洞。

Claude Code 自带的 `/security-review` 命令也被拉来试了：扫 3 个应用的整个代码库，一共只挑出 1 个 XSS，原文评价“pretty mid”。不过这个命令本来是审单个 PR 改动的，拿去扫整个仓库，效果差也正常。

OWASP Top 10 的最新版本是 2025 版。比起榜单本身，它的排名方法更有意思：一条腿是超过 280 万个应用的真实数据，看有多少比例的应用存在这类弱点；另一条腿是 221 名从业者的问卷。数据只能看到已经被测出来的问题，访问控制这类要结合业务上下文的逻辑问题，自动化工具本来就不容易测出来，只看数据会系统性地低估，所以得靠经验补上。而访问控制缺陷已经连续多年排第一。

几篇材料放在一起就对上了：Semgrep 的实验里 AI 在 IDOR 上表现最好，Unit 42 说 BOLA 很难自动检测，OWASP 承认只靠数据测不准访问控制，访问控制又常年排第一。机器先把面铺开，判断不了的部分交给人。

Semgrep 在 2026 年也照着这条边界做了产品：Agentic Workflows 用 Pro Engine 做确定性的污点追踪和跨文件分析，再让前沿大模型判断这条路径到底能不能被利用。追踪交给引擎，判断交给模型，跟 SAST、DAST 组合着用是一个路数。

## 五、为什么 AI 时灵时不灵

Semgrep 的实验里还有一个更意外的结果：同一个 prompt 扫同一个代码库，跑三次，找到的漏洞分别是 3 个、6 个、11 个，几次之间重叠的部分也对不齐。传统 SAST 工具跑一次和跑十次结果一模一样，几乎不花钱；LLM 扫一遍不光结果不稳，还贵，这次实验光 Claude Code 的 token 就花了 114 美元。扫一次觉得干净，不代表真的干净，单次扫描很容易给人虚假的安全感。

Semgrep 把原因归到 context rot 和 compaction 上：AI 处理大代码库时会做有损压缩，函数名、路径这些细节在压缩摘要过程中丢了，每次记住的东西都不一样。

Context Rot 这篇一开始看不出和安全有什么关系，它讲的是输入越长模型表现怎么变差，通篇没提漏洞。排进这周，是因为 Semgrep 把扫描结果不稳定归因到 context rot，而这篇正是把 context rot 讲透的原始研究。Chroma 测了 18 个当时最先进的模型，Claude、GPT、Gemini 系列都在里面，做了 5 组实验。

| 实验 | 在测什么 | 结果 |
| --- | --- | --- |
| 词汇匹配 vs 语义匹配 | 问题和答案字面重合，还是只有意思相近 | 越是只有意思相近，输入变长时掉得越厉害 |
| 干扰项 | 加 0、1、4 个语义相似但错误的干扰项 | 一个干扰项就会拉低表现，四个更糟 |
| 连贯 vs 打乱 | 背景文本保持原有逻辑顺序，还是打乱句子 | 反直觉：保持连贯时表现反而更差 |
| 对话记忆（LongMemEval） | 只给约 300 token 的相关历史，还是给约 11.3 万 token、大部分无关的完整历史 | 所有模型都是只给相关部分时明显更好 |
| 重复词复制 | 把一段重复文字照抄一遍 | 输入越长，所有模型都越差 |

失败的方式也分家族：有干扰项时，Claude 系列倾向于不确定就拒答，GPT 系列的幻觉率最高，经常自信地给出错误答案。没有哪个模型五组都最强，表现跟任务类型关系很大。原文也只在单一检索任务中观察到：上下文里信息放在 11 个位置之间没有明显差别。

原文最后给了三条建议：模型在不同长度输入上的表现并不均匀；正确的信息放进上下文还不够，怎么呈现同样重要；想做可靠的 AI 应用，得在上下文工程上下功夫。实践上就是“编排器 + 子 Agent”：主 Agent 拆任务，每个子 Agent 各管一份干净、只装相关内容的上下文，只把最相关的结论交回来。这跟 Week 4 讲的 Subagent 隔离是一个思路。

这些结论落到安全研究上，有一组直观数字。安全研究员 Sean Heelan 拿 o3 做过基准测试：Linux 内核 SMB 服务模块 ksmbd 里有个已知漏洞 CVE-2025-37778，只把相关代码喂给模型，大约 3,300 行、2.7 万 token，跑 100 次，o3 找到 8 次；把输入扩大到全部命令处理函数，大约 1.2 万行、10 万 token，再跑 100 次，只找到 1 次。

![o3 找已知漏洞的基准：输入从约 2.7 万 token 增加到约 10 万 token，100 次运行中命中从 8 次降到 1 次](/images/posts/cs146s-week6-security-vibe-coding/context-rot-hit-rate.png)

代码量涨了不到 4 倍，命中率掉到八分之一。Semgrep 那篇引用的“8% 成功率”，说的就是这个 8/100。

## 六、一份管用的漏洞挖掘 prompt 长什么样

这周最后一篇 reading 是 Heelan 仓库里的一份 system prompt，也就是上面实验用的原文。它不长，核心有四个技巧。

| 技巧 | prompt 里怎么写 | 针对什么问题 |
| --- | --- | --- |
| 角色 + 窄任务 | 只找 use-after-free：`look for dangling pointers that lead to use-after-free vulnerabilities` | 任务越宽，模型越容易跑偏 |
| 把“仔细检查”拆成步骤 | 写出从入口到漏洞点的代码路径，逐个检查路径上的条件判断 | “想清楚再说”太抽象 |
| 诚实处理信息缺口 | 缺关键函数或类型就问；只在确定时按 Linux 内核 API 的常见定义假设 | 防止编造看似合理的假设 |
| 宁可不报 | 必须引用全部相关代码并完整演示漏洞发生过程 | 误报太多 |

最有意思的是第二条。“仔细检查”是谁都会写的一句空话，这份 prompt 把它拆成能照着做的动作：要求写出从入口到漏洞点的完整路径，逐个检查条件，说明攻击者怎么让每个条件成立，最后检查有没有矛盾和假设。它等于让模型用自然语言把 SAST 引擎的路径追踪做一遍。第四条对付的是误报：前面 Semgrep 实验里 AI 的误报率超过八成，这份 prompt 干脆把门槛抬高，证据不完整宁可不报。

即使这样，噪音还是不小。前面 100 次基准测试里，o3 找对 8 次，另外有 28 次报出了根本不存在的漏洞。

CVE-2025-37899 就是在命中率掉到 1/100 的那组扩大测试里撞出来的。把全部命令处理代码交给 o3 后，已知漏洞只找到了 1 次；其中某一次运行却报出一个之前没人发现过的漏洞：ksmbd 处理 SMB2 LOGOFF 命令时的 use-after-free。

![CVE-2025-37899 时序：连接 A 处理 LOGOFF 时释放 sess->user，而同一 session 的连接 B 仍在使用该指针，形成 use-after-free](/images/posts/cs146s-week6-security-vibe-coding/ksmbd-uaf-timeline.png)

SMB 协议允许多条连接绑到同一个 session 上。session 本身有引用计数保护，`sess->user` 这个指针没有；一条连接处理 LOGOFF 时只等自己这条连接空闲，就把 `sess->user` 释放了，另一条连接上的线程可能还在用它。三个条件凑齐才会触发，得看懂并发时序才找得到，靠模式匹配扫不出来。这个漏洞被广泛报道为第一个由 LLM 在 Linux 内核这类大型真实代码库里独立找到的远程零日漏洞。

Heelan 自己很冷静。他说这份 system prompt 还只是推测，没做过足够的评估，说不准到底有没有用；也说用不着相信 LLM 真的在推理，把它当成模糊测试的采样器就行。多跑几次，再用严格的人工验证把真漏洞挑出来，这就是它在 Linux 内核里挖出零日漏洞的用法。

## 七、哪些交给 AI，哪些还得靠人

Veracode 那个一年只涨一个百分点的通过率说明，AI 写出来的代码没有跟着模型变强而变安全。这周几篇材料拼起来，更像一份分工表。

| 问题类型 | AI 能做到什么 | 还需要谁 | 怎么搭配 |
| --- | --- | --- | --- |
| 访问控制类（IDOR、BOLA） | 语义推理相对擅长，能帮忙找出来 | 人工复核、动态验证 | AI 初筛，人来验证 |
| 注入类（SQL 注入、XSS） | 跨文件追踪数据流吃力 | 传统 SAST 引擎的污点追踪 | 引擎做追踪，模型判断能不能被利用 |
| 并发、内存类深层漏洞（如 use-after-free） | 严格 prompt 下能挖出真漏洞，但噪音很大 | 研究员逐条验证 | 窄任务、控制上下文、多跑几次 |
| Agent 自身风险（prompt injection 等） | 模型分不清指令和数据，自己防不住 | 产品和工具层的设计 | Agent 不能改自己的权限，防御分层叠加 |

想让 AI 在表里这几格真正派上用场，prompt 就照 Heelan 那份写：任务收窄，检查拆成步骤，缺信息就问，宁可不报也别乱报，喂进去的代码也别贪多，一次给太多，命中率会掉。

Splunk 让 SAST、DAST、RASP 配合，Semgrep 让 AI 跟静态分析引擎分工，Unit 42 的防御是五层叠起来。没有一篇给出单点解法。AI 在这套组合里能占的位置也清楚了：访问控制这类要读懂业务逻辑才能判断的问题，它比传统自动化工具更有希望；并发时序这类藏得深的漏洞，配上足够严格的 prompt，它也挖得出真东西。两种情况下，最后拍板真假的都还是人。

## 八、Assignment：给一个故意埋了漏洞的应用排雷

这周作业给了一个 FastAPI 后端加 JS 前端的小应用，外带一份 `requirements.txt`，里面故意埋了一批典型漏洞：f-string 拼 SQL、对用户输入直接 `eval()`、用 `shell=True` 跑命令、拿用户给的 URL 直接发请求、拿用户给的路径直接读文件，依赖也钉在一堆带已知 CVE 的老版本上。要做的是用 Semgrep 扫一遍，从结果里挑至少三个问题，用 AI 编程工具修掉；每修一处都重扫，确认这个问题没了、也没冒出新的，app 还能跑，测试还能过。

这个作业把前面那套 SAST 的说法落到了手上。扫描、挑问题、修复、重扫、跑测试，这个循环就是 SAST 接进 CI/CD 后天天在跑的流程。它也逼着人读扫描结果，分清哪些是真问题、哪些是噪音，这一步工具替不了。

作业指定的 `semgrep ci` 一共扫出 36 条：12 条代码层面的 SAST，覆盖 SQL 注入、代码注入、命令注入、SSRF、路径穿越和 CORS 配置错误；24 条是依赖扫描（SCA），集中在 `requirements.txt` 里 5 个老版本的包上。密钥扫描没有启用，因此没有数据。这些结果正好对应前面讲过的概念。

![Week 6 作业概念图：SAST、依赖扫描、污点追踪、误报、SAST 与 DAST 的区别，以及人和 AI 的分工](/images/posts/cs146s-week6-security-vibe-coding/assignment-concept-map.png)

最能说明问题的是路径穿越。免费规则集没扫到它，完整规则集靠跨文件污点分析才抓到；前面讲 Semgrep 的 Agentic Workflows 时说追踪交给引擎，这次用上的就是引擎那一半，干的正是 LLM 最不擅长的跨文件追踪。倒是手动读代码一眼能看出来的 MD5 弱哈希、前端用 `innerHTML` 拼用户内容的 DOM XSS，这次扫描都没报。扫描器有自己的盲区，扫完没报不等于没有。

12 条代码问题里有 2 条是误报：`generic-sql-fastapi` 把 `notes.py` 和 `action_items.py` 的 `db.execute(stmt.offset(skip).limit(limit))` 当成了原始 SQL 拼接。回去核对，`stmt` 是用 SQLAlchemy 的 `select()`、`.where()`、`.order_by()` 一步步构造出来的查询对象，中间没有字符串拼接；规则分不清安全的 ORM 调用和裸 SQL，所以不修。规则引擎的误报比 AI 少得多，12 条里 2 条，但也得有人一条条核实。

最后挑的三个，两个是代码漏洞，一个是依赖漏洞，SAST 和 SCA 各占一头。

| 漏洞 | 怎么修 | 重扫后的发现数 | 测试 |
| --- | --- | --- | --- |
| SQL 注入：`unsafe_search` 用 f-string 拼 SQL | 改成绑定参数，顺手修好路由顺序 | 36 → 33 | 4/4 |
| 代码注入：`debug_eval` 对用户输入 `eval()` | 删掉整个端点 | 33 → 31 | 5/5 |
| Werkzeug 0.14.1，带 9 个已知 CVE | 升到 3.1.9 | 31 → 22 | 5/5 |

SQL 注入那处还有一个意外：这段漏洞代码从来没被真实 HTTP 请求执行过。`unsafe_search` 路由注册在 `/{note_id}` 后面，Starlette 按注册顺序匹配，发往 `/notes/unsafe-search` 的请求全被 `/{note_id}` 先接走，把 `unsafe-search` 当成 `note_id` 解析成整数，失败后返回 422。

![unsafe_search 路由被截胡的前后对比：修复前动态路由先注册并返回 422；修复后具体路径排在前面，参数化查询返回 200](/images/posts/cs146s-week6-security-vibe-coding/route-shadowing.png)

这件事正好对上 SAST 和 DAST 的区别。SAST 只看代码长什么样，不管外面能不能碰到，所以照样报了；换成 DAST 从外面打，这个端点根本打不通，反而永远发现不了。它算一段睡着的漏洞，攻击者暂时碰不到，可只要哪天路由顺序一调，它就醒了。解决办法是先把路由挪到 `/{note_id}` 前面，让修复能在真实请求里验证，再把 f-string 拼接改成绑定参数。

```diff
-    sql = text(f"""
+    sql = text("""
         SELECT id, title, content, created_at, updated_at
         FROM notes
-        WHERE title LIKE '%{q}%' OR content LIKE '%{q}%'
+        WHERE title LIKE :pattern OR content LIKE :pattern
         ORDER BY created_at DESC LIMIT 50
         """)
-    rows = db.execute(sql).all()
+    rows = db.execute(sql, {"pattern": f"%{q}%"}).all()
```

绑定参数会被数据库驱动当成纯数据处理，`q` 里塞什么字符都改变不了查询结构。新加的测试用 `O'Brien` 这类带单引号的搜索词去打，修之前请求直接失败，修之后正常返回，正常搜索也不受影响。

`eval()` 那处没有安全的折中：它对用户传进来的字符串直接求值，等于在服务器上开了任意执行 Python 代码的后门。前端和测试都没用到这个端点，所以整个删掉，再加测试确认这个路径返回 404。

Werkzeug 0.14.1 带着 9 个已知 CVE，其中 CVE-2024-34069 是 24 条依赖漏洞里唯一被 Semgrep 标成 Reachable 的；但这个包在 app 代码里一次都没被 import，实际运行环境里也没装它。这份 `requirements.txt` 更像专门给依赖扫描准备的靶子。所以升到 3.1.9 改的只是依赖清单，正在跑的 app 行为不会变化。这正是 SCA 要检查的东西：依赖声明有没有跟上已知漏洞，跟前两处真能被请求触发的代码漏洞不能混为一谈。

三处修完，发现数从 36 降到 22，每次重扫都是对应问题消失，没有新增；测试从 4 个加到 5 个，一直全绿。最后把服务起起来，从外面发请求走了一遍：建笔记、搜索、请求 `debug/eval`（返回 404）、查待办事项都正常。剩下的命令注入、SSRF、路径穿越和 CORS 配置这次没修，作业只要求三个。

整个作业是上面分工表的一个小样本：扫描、分析、改代码、写测试、重扫验证，AI 编程工具可以跑得很快；哪些是误报、修哪三个、修复方案行不行，这几个判断还是得由人来做。
