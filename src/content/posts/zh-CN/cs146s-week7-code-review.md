---
title: "Stanford CS146S Week 7：Code Review，从“人评人”到“AI 评 AI”"
description: "AI 写代码提速后，代码审查如何跟上？从 code review 的历史、AI 的能力边界，到同一批代码的四种审法。"
publishDate: 2026-10-02
updatedDate: 2026-10-02
tags:
  - AI
  - Agent
  - Stanford
category: AI 与技术
lang: zh-CN
translationKey: cs146s-week7-code-review
draft: false
---

## 一、写得快了，审不过来

一个 PR 动辄几千行，人是审不完的。用 AI 写代码的人多半碰到过这种局面：代码几分钟就出来，堆在那里等 review；真要一行行读下去，别的事就不用干了。Google 这类公司近两年公开说过，新写代码里 AI 生成的部分已占大多数。写得越快，要审的东西也越多。

Stanford CS146S Week 7 讲的是 code review，嘉宾是 Graphite 联合创始人 Tomas Reimers。Graphite 做的是 AI 代码审查平台。他在课上把软件开发拆成内外两个循环：内环是写代码、构建、调试，外环是提交、测试、review、合并、部署。AI 已经把内环加速了约十倍，外环会怎么样，是这堂课想回答的问题。

![软件开发的内外两个循环：内循环 Code、Build、Debug 被 AI 加速约十倍；外循环 Author、Test、Review、Merge、Deploy 中的 Review 被突出标出](/images/posts/cs146s-week7-code-review/01-inner-outer-loop.png)

这周有六篇阅读材料和一份课件，从 2006 年的博客读到 2026 年 Google 上线的审查工具。它们关心的是同一件事：review 还要不要人做，AI 能接手哪一部分，接手前得准备什么。

| Reading | 讲什么 | 用在哪部分 |
| --- | --- | --- |
| [Code Reviews: Just Do It](https://blog.codinghorror.com/code-reviews-just-do-it/)（Coding Horror，2006） | 用数据说明同行审查比测试更能抓出缺陷 | review 的历史 |
| [Code Review Essentials for Software Teams](https://blakesmith.me/2015/02/09/code-review-essentials-for-software-teams.html)（Blake Smith，2015） | review 的价值层次、PR 和反馈怎么写 | 审查在审什么 |
| [How to Review Code Effectively](https://github.blog/developer-skills/github/how-to-review-code-effectively-a-github-staff-engineers-philosophy/)（GitHub） | 一位 Staff Engineer 的 review 做法 | 审查在审什么 |
| [AI-Assisted Assessment of Coding Practices in Modern Code Review](https://arxiv.org/abs/2405.13565)（Google，2024） | AutoCommenter 的训练、上线和评估 | AI 能审什么、怎样做成系统 |
| [AI code review implementation and best practices](https://graphite.com/guides/ai-code-review-implementation-best-practices)（Graphite） | 团队怎么把 AI 审查放进流程 | AI 来了、做成系统 |
| [Lessons from millions of AI code reviews](https://www.youtube.com/watch?v=TswQeKftnaw)（Tomas Reimers） | 大量 AI 审查评论总结出的一张矩阵 | AI 能审什么 |

## 二、老传统：code review 五十年

Code review 不是 AI 时代才有的东西。1976 年，IBM 的 Michael Fagan 在 *IBM Systems Journal* 上发表论文，提出了后来叫 Fagan Inspections 的代码检查流程。那时要审的代码是打印出来传阅的，后来变成邮件里的补丁；Linux 内核到今天还是把改动做成 patch 发到邮件列表里，等别人回复。2000 年代初，Guido van Rossum 在 Google 做了网页版审查工具 Mondrian，之后有 Review Board、Gerrit、Phabricator，最后 GitHub Pull Request 把这件事带进了更广泛的工具链。

![Code review 时间线：1976 年 IBM 的 Fagan Inspections、邮件补丁时代、Google Mondrian、Review Board、Gerrit、Phabricator、GitHub，以及今天 AI 参与审查](/images/posts/cs146s-week7-code-review/02-review-timeline.png)

工具换了一代又一代，写代码和审代码的人一直都是人。AI 是第一次让这个前提松动的东西。

Coding Horror 那篇写于 2006 年，Jeff Atwood 的态度很直接：代码没给同事看过，就还没写完。他引用 Steve McConnell《Code Complete》的一组数据，单元测试、功能测试、集成测试、设计检查的缺陷检出率依次是 25%、35%、45%、55%，代码检查是 60%。文章还列了维护团队的例子：引入审查前，55% 的单行改动会出错；引入后降到 2%。我读到这里先看了一眼日期，2006 年。那个年代把 code review 强调到什么程度都不为过。

## 三、审查到底在审什么

Blake Smith 在 2015 年写《Code Review Essentials for Software Teams》时，还没有 AI 审代码。他关心的是一个朴素的问题：review 到底能带来什么。他把价值排成一个层次：代码风格、找 bug、设计讨论、方案是否正确，最上面是团队心智对齐，也就是大家对系统的理解是不是还在同一个频道上，知道别人做了什么，代码库现在是什么样子。

![Review 价值层次金字塔：从下到上是代码风格、找 bug、设计讨论、方案是否正确、团队心智对齐；底部更适合机器，上层依赖人与人之间的理解](/images/posts/cs146s-week7-code-review/03-review-hierarchy.png)

Graphite 的课件给了相似排序：对齐确认、知识扩散、校对。两份材料隔了十年，出处也不同，最重要的一层是同一件事。

Smith 把功夫放在提 PR 之前：先问是不是该做、团队是否认可、能不能拆小、准备怎么测。改动小，别人才能审得动。PR 描述也要交代问题、影响、改动和测试方式；“这就是我和 Bob 之前聊过的那个 bug”对其他人没有帮助。

轮到审的人，他更在意把话说具体，或者用问题引导作者自己想。

| 含糊的说法 | 具体的说法 |
| --- | --- |
| 这个设计是坏的 | 这里好像破坏了一个接口边界 |
| 你能不能重写得清楚一点 | 这一段我看得有点困惑 |
| 我不喜欢这个改动 | 这段代码遇到负整数是怎么处理的？ |

GitHub Staff Engineer Sarah Vessels 的做法和 Smith 大半重合：优先审队友已通过 CI 的 PR；分清个人偏好和真正阻塞性的问题；只要不会引起线上故障，尽量沟通清楚后直接 Approve，把决定权留给作者。

拿这套层次和后面 AI 能做的事对照，分界很清楚。风格和找 bug 是 AI 做得不错的部分；方案对不对、设计怎么取舍、团队是否对齐，还是要靠人之间的理解。AI 审了代码，队友不会因此更清楚彼此在做什么。

## 四、AI 来了：Platform 还是 Participant

Graphite 的课件把 AI 在 review 中扮演的角色分成两种：Platform 是 AI 收集上下文、辅助审查，人仍然拍板；Participant 是 AI 直接顶替人类审查者。

|  | Platform | Participant |
| --- | --- | --- |
| AI 做什么 | 收集上下文，增强人类审查者 | 直接替代人类审查者 |
| 人做什么 | 看 AI 的结果，最后拍板 | 不再逐个 PR 去审 |

两种做法现在都有人用。Duckbill Group 的 CEO Mike Julian 写过，五人团队攒了六十个没人审的 PR，光审完就要两天。他们没有取消 review，而是按风险分流：公共 API、鉴权和数据库结构变更要人看，其余用严格 lint、八成以上测试覆盖率和线上监控兜底。结果 PR 合并量差不多翻倍，不用人审的一小时内合进，要人审的中位数等一天多。

Graphite 的指南站在另一头，主张 AI 做补充，人做最终裁决。AI 掌握的信息不如人多，业务背景、公司情况和落地限制都可能不知道；顶层判断得由人来把关。越早和 AI 对齐认识越好，不然它会把一件你不想要的事做得漂漂亮亮。

这场争论最近有个更准确的词：harness engineering。harness 原意是马具，指给 AI 套上的约束和检查装置，让代码在这套装置里被自动把关。Mitchell Hashimoto 总结过一条做法：Agent 每犯一次错，就做一个机制，让它别再犯同样的错。于是焦点从“人要不要审”变成“这套装置怎么搭”。Duckbill 的风险分流、lint、覆盖率和监控，本身就是一套小号的 harness。

## 五、AI 能审什么，不能审什么

Graphite 分析大量 AI 审查评论后发现，只问 AI 能不能发现问题还不够，还得问人愿不愿意收到这条评论。于是有了一张二维矩阵：纵轴是 LLM 能发现还是发现不了，横轴是人想不想收到这类反馈。

![AI 审查评价矩阵的两个维度：纵轴是 LLM 能发现和发现不了，横轴是人类不想收到和人类想收到](/images/posts/cs146s-week7-code-review/04-matrix-axes.png)

横轴很有意思。AI 发现得了只是一半，另一半是人愿不愿意收。右上角是 AI 能发现、人也愿意收的：真正逻辑错误、意外提交的调试代码和未使用变量、明显的性能与安全隐患、文档和代码不一致、违反团队规范。左上角是噪音区，例如机械地建议加注释、抽函数、补测试，技术上没错，但一条条提出来只会让人烦。右下角是人想要、AI 给不了的：团队的隐性知识，例如“我们以前在这里踩过坑，所以不能这么写”。

![填充后的 AI 审查评价矩阵：理想区包括真 bug、意外提交、明显性能和安全问题、文档与代码矛盾；噪音区是吹毛求疵的最佳实践；盲区是团队隐性知识](/images/posts/cs146s-week7-code-review/05-matrix-filled.png)

Graphite 用点赞点踩看评论是否开始编造或超出能力范围，用评论是否促成代码修改看开发者的真实态度。人类审查评论平均也只有约一半被采纳，Graphite 调整后的 AI 评论采纳率是五成出头，和人类差不多。

Google 的 AutoCommenter 给了另一个角度。它专门检查最佳实践，被触发最多的 50 条规则里，大约三分之二是传统 linter 很难检查的，例如命名是否贴切、注释是否说明清楚。它负责的是 linter 很难覆盖的部分。论文写于 2024 年，当时模型上下文窗口只有 2,048 个 token；到今天，这道限制基本放松了，但精确率和召回率难以兼得的取舍还在。评论做得准，数量就少；做得全，又容易吵。AutoCommenter 当时先保证准。

课件预测，随着上下文能力增强，右上角那块理想区会变大。这个预测有依据，但不代表右下角的团队知识会自己冒出来。

![更多上下文会扩大 AI 审查理想区：在今天的边界外，LLM 能发现且人想收到的区域向左和向下扩张](/images/posts/cs146s-week7-code-review/06-matrix-tomorrow.png)

## 六、把 review 做成一套系统

AI 写代码前要先写 spec，这门课 Week 3 讲过。规格越清楚，AI 写出来的东西越靠谱。让 AI 审代码也是一样：先说清楚审什么，怎么算通过。Graphite 把这一步叫 establish clear expectations。风格、基础逻辑错误和安全扫描可以交给 AI；架构决策和复杂业务逻辑必须留给人。

Google 今年 2 月给 Gemini CLI 的 Conductor 加了 Automated Reviews。它会把新写代码和 `plan.md`、`spec.md` 对照，检查是否符合规划和需求，同时检查风格、跑测试、做基础安全审查。结果按高中低分级，带文件路径和修改建议。审查的依据是写下来的 spec。

一份 review spec 可以先写这几项。

| 要写什么 | 例子 |
| --- | --- |
| 检查项 | 逻辑错误、意外提交的调试代码、明显的性能和安全问题 |
| 严重级别 | 会造成线上故障的必须改，其余只是建议 |
| 不要评论什么 | 格式、缩进交给 linter；不对既有代码提吹毛求疵的最佳实践 |
| 什么时候交给人 | 架构改动、复杂业务逻辑，以及用户输入、鉴权、数据库、网络请求等敏感代码 |
| 依据 | 团队规范、这次需求的 plan 和 spec、历史踩过的坑 |

矩阵右下角的盲区也有一部分能靠 spec 填上：团队踩过的坑写进文档，AI 才有东西可查。

光有 spec 还不够，还要有一套执行流程。AutoCommenter 的训练流程分三段：周期性从历史评论抽取样本、按需把样本整理成训练格式、按需训练模型。最贵且变化少的第一段单独跑，后两段可以随实验重跑。这和具体模型无关，把慢的、贵的、变化少的部分和快的、常改的部分拆开，实验才做得起。

它上线后的几条教训放到今天仍然成立：LLM 对传统静态分析是补充；离线评估好看不等于上线好用；用户信任要一直盯着。Google 的做法很朴素：屏蔽价值低的规则，重写高频规则说明，评论有用率从五成多涨到八成，模型一点没动。

落到流程上，可以先跑确定性检查，再让 AI 带着代码库上下文处理需要语义判断的部分，最后由人看架构、复杂业务和安全敏感改动。人不必逐条过一遍，但得有人把关。AI 一旦理解偏了，没人纠正就会越走越远，还白白烧掉 token。开发者的角色也从手动审代码，变成批判地看 AI 建议、记录误报、更新规则。

![Review 系统流程：先写 review spec；PR 依次经过确定性检查、AI 审查、人来定夺；点赞点踩、采纳率和误报记录回流，用来修改 spec 和规则](/images/posts/cs146s-week7-code-review/07-review-system-flow.png)

## 七、人还剩什么

Graphite 课件给了三种角色：Cyborg 直接审查改动，用 AI 增强自己，担保代码本身；EM 像带团队一样管理 AI，担保架构；Agency 把 AI 当第三方外包，只担保产品需求。

| 角色 | 人怎么跟 AI 协作 | 人担保什么 |
| --- | --- | --- |
| Cyborg | 直接审查改动，用 AI 增强自己 | 代码本身 |
| EM | 像带团队一样直接管理 AI | 架构，不一定管技术细节 |
| Agency | 把 AI 当第三方外包商 | 产品需求，不管代码 |

三种角色一层比一层退得远，从盯代码，到盯架构，再到只盯需求。

风格、常见 bug、安全扫描、对照 spec 做检查，多半会交给机器。留给人的是团队里没写下来的经验，以及 Smith 金字塔顶层的对齐。再往后，人的工作会变成写 spec 和搭 harness：决定审什么、怎么审，在机器拿不准的地方拍板。

## 八、Assignment：同一批代码，四种审法

这周作业有四个小任务：Task 1 加接口和输入校验，Task 2 扩展待办事项抽取，Task 3 新增一个 model 和它的关系，Task 4 补分页和排序测试。每个任务都切分支，用一句话 prompt 让 AI 一次写完，逐行 review、开 PR，再用 Graphite Diamond 生成一轮 AI 审查，最后对比自己的评论和它的评论。

我用 Claude Code 完成作业，Graphite Diamond 换成 Claude Code 的 review。作业所称的手动 review，是它自己逐行读代码、把接口跑起来试，我这里叫“自审”；PR 上那轮叫“二次 AI review”。写、审、再审都是 AI，正好是标题里说的 AI 评 AI。

光这样只能知道它抓到了什么，不知道它漏了什么，所以我多加了一步：让没参与作业的 Grok 4.7（medium 档）盲审四份未修改的原始提交。它看不到自审和 PR 评论。盲审跑两遍，一遍没 spec，一遍带 spec；spec 写明检查项、严重级别、不该评论什么、什么时候交给人，并要求每条意见附上跑过的命令，或标明只是读代码推断。

![同一份原始提交的两条审查路线：作者自审和二次 AI 审查；另一条是独立 AI 的盲审，分别不带 spec 和带 spec，最后对照各自发现的缺陷](/images/posts/cs146s-week7-code-review/08-assignment-flow.png)

四份 1-shot 里，Task 1、3、4 一提交就全绿；Task 2 有两个测试失败。自审仍找到一批问题：超大 ID 请求直接 500，`?q=%` 被当成通配符，匹配所有笔记；校验把笔记正文开头的缩进吃掉。这些都写在 PR #1 的描述里，那里还特别注明：这不是人工 review，也不独立于作者。

![PR #1 的自审表：M1 到 M4 分别是超大 ID 报 500、问号百分号被当作通配符、正文缩进被吃掉、排序函数信任调用方；每行都指向一个修复提交](/images/posts/cs146s-week7-code-review/10-pr1-manual-review.png)

测试和 lint 成本低、结果确定，应该排在第一关。Task 2 的两个失败就是它们先报出来的。但测试和代码由同一个 AI 写，它测的都是自己已经想到的输入；超大 ID、通配符、缩进这几处它没想到，Task 1 的 56 条测试也没有覆盖。

把几种审法发现的缺陷放在一起，一共 11 条。A 到 E 是自审找到的，F 到 K 是盲审找到、再让 Claude Code 逐条复现确认的，最终 PR 里都还在。测试和 lint 只拦住其中 1 条。

![11 条缺陷在测试和 lint、自审、二次 AI 审查、盲审无 spec、盲审有 spec 五种检查中的覆盖表：测试和 lint 抓到 1 条，自审 5 条，二次审查 0 条，盲审无 spec 5 条，盲审有 spec 7 条](/images/posts/cs146s-week7-code-review/09-defect-coverage.png)

自审带着写代码时的上下文，专门试边界输入，抓到的是输入类问题；盲审没上下文，拿样例句子和请求参数去跑，抓到的是行为类问题，例如带 `should`、`must`、`will` 的句子永远匹配不上、`?sort=tags` 直接 500、列表接口对每条笔记多查一次标签、标签顺序前后不一致。两边重合的只有 D 和 E。二次 AI review 在改完后才审，四个 PR 都说可以直接合并；F 到 K 六条当时还在代码里，它一条也没抓到。

单看任意一列，最多抓到 11 条里的 7 条；叠起来才全部覆盖。前面那张检出率表里，单元测试是 25%，代码检查是 60%，没有哪一种办法能全抓到。这次的格子表只是同一件事的缩小版。

有 spec 和没 spec 的两遍盲审，意见条数一样，分级不一样。

|  | 没有 spec | 有 spec |
| --- | --- | --- |
| 意见条数 | 8 | 8 |
| 标成 must-fix | 3，其中一条是 import 空行 | 1 |
| lint 报的 import 空行 | 列成一条意见 | 写在检查结果里，没列成意见 |
| 每条意见都附了跑过的命令 | 是 | 是 |
| 抓到的缺陷，共 11 条 | 5 | 7 |

有 spec 的那遍 must-fix 少两条，交给 linter 的 import 空行没有再占一条意见，标签大小写这类要人拍板的事也明确留给人定。抓到的缺陷是 5 条对 7 条，各有对方没有发现的。只跑一遍，分不清这是 spec 的作用，还是模型运行间的波动。

盲审两遍都说 Task 1 通过，偏偏 Task 1 是最大改动，自审在它身上抓得最多。没有 spec 的那遍其实跑出了 `?q=%` 匹配所有笔记，但判断这是改动前就有的行为，所以没列出。审查是只看改动引入的问题，还是把任务要求的健壮性也算进去？这件事没写在任何地方，它按最保守的理解走了。

PR #1 的描述里有张改动前的测量表：`GET /notes/?sort=metadata` 返回 500，因为脚手架用 `hasattr` 判断能不能按字段排序，而 SQLAlchemy 模型恰好有个 `metadata` 属性。自审把它改成白名单。Task 3 从 main 单独切分支，看不到这条；给 Note 加 `tags` 关系后，`hasattr(Note, "tags")` 同样变成真，`?sort=tags` 从原来的 200 变成 500。同一个坑换了名字，Task 3 的自审和二次审查都没有看到，盲审两遍都抓到了。

![PR #1 改动前的测量表：最后一行 GET /notes/?sort=metadata 返回 500，原因是 hasattr 把 SQLAlchemy 的 metadata 属性当成可排序字段](/images/posts/cs146s-week7-code-review/11-pr1-sort-metadata.png)

这条教训只写在 PR #1 描述里，没有写进 Task 3 的审查依据。矩阵右下角的盲区，就是“我们以前在这里踩过坑”这种东西。审查该往哪里探，写进 spec，AI 才有得查。

二次审查里有一条评论看着最有分量。PR #3 指出 SQLite 默认不强制外键，`ondelete="CASCADE"` 可能不生效，删笔记会在关联表里留下孤儿行；建议开 PRAGMA，再加一条测试。

![PR #3 上二次 AI review 的评论：它提出 SQLite 默认不强制外键，ondelete CASCADE 可能不生效；该评论是唯一排进后续的建议](/images/posts/cs146s-week7-code-review/12-pr3-review-comment.png)

前提对，结论复现不出来。用 Task 3 分支的真实模型，不设 PRAGMA，走删除接口的 `db.delete(note)`，关联表没有残留，因为 SQLAlchemy 删除多对多一端时会自己清理关联行。只有绕开 ORM，用批量删除或原生 SQL，孤儿行才会出现；开了 PRAGMA 才会消失。

| 删笔记的方式 | 关联表有残留吗 |
| --- | --- |
| ORM 的 `db.delete(note)`，删除接口的写法 | 没有 |
| ORM 的批量 `delete(Note)` | 有 |
| 原生 SQL `DELETE` | 有 |
| 原生 SQL，开了 `PRAGMA foreign_keys=ON` | 没有 |

评论里写的是“很可能”，是推断，没有附复现。没有 spec 的盲审提了同一个问题，但用原生 SQL 复现后，明确写出当前 API 没有删除笔记接口，这条路径走不到，所以定成 should-fix。盲审两遍一共 16 条意见，每条都附了跑过的命令；我让 Claude Code 逐条复现，全部成立，没有误报。跑过的意见可以信，推断的意见需要人复核。把“提供证据”写进 spec，只是一句话，却能避免把合理猜测当成已证实的缺陷。

我信任 AI review，前提是开头把边界定好：TODO 写清谁做什么，测试先写，review spec 放在最前面。这次再补一条，审查范围和该往哪里探也要写进去，别只审一遍。

四个 PR 现在都还开着，F 到 K 这六条也还在里面。
