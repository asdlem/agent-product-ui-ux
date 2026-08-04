<!-- Source: README.md SHA-256: 865acad5e0dddbc9a70fbbf95e4ee90dab98e1910e7ea3139eac53d8f9dc67b4 -->

# Agent 产品 UI/UX Skill

[English](README.md)

`agent-product-ui-ux` 是面向对话式、异步执行型 Agent 产品的开源工作型 UI/UX Skill。它帮助 Agent 设计、实现、review 和验证任务进度、审批、中断恢复、队列、Composer、滚动、焦点、响应式布局、上下文工具 pane 和文件工作区。

仓库只有一份英文 canonical 可执行 Skill；面向人的项目文档提供英文和简体中文版本。

## 安装

通过开放的 Skills CLI 安装：

```bash
npx skills add asdlem/agent-product-ui-ux
```

非交互地全局安装这个 Skill：

```bash
npx skills add asdlem/agent-product-ui-ux --skill agent-product-ui-ux -g -y
```

只查看仓库中可用的 Skill，或更新已有的全局安装：

```bash
npx skills add asdlem/agent-product-ui-ux --list
npx skills update agent-product-ui-ux -g -y
```

不要再把同一个 Skill 手工复制到当前宿主可发现的另一个目录。安装后重启或刷新宿主，然后显式调用 `$agent-product-ui-ux`，或让模型在匹配的 Agent 产品前端任务中自动使用。

## 内容

- [`SKILL.md`](skills/agent-product-ui-ux/SKILL.md)：触发条件、工作流和硬性交互契约。
- [`interaction-guide.md`](skills/agent-product-ui-ux/references/interaction-guide.md)：按需加载的设计与验收指南。
- [`runtime-evidence.md`](skills/agent-product-ui-ux/references/runtime-evidence.md)：证据分级、localhost CDP 边界和运行态 review 流程。
- [`capture-runtime-evidence.mjs`](skills/agent-product-ui-ux/scripts/capture-runtime-evidence.mjs)：从已有浏览器或 Electron target 只读采集 clean/annotated 截图、可访问性、console 和 manifest。
- [`reference-surface`](skills/agent-product-ui-ux/assets/reference-surface/)：无依赖的 synthetic 交互示例和 TypeScript 契约。
- [`screenshots`](skills/agent-product-ui-ux/assets/screenshots/)：由 synthetic surface 生成的 clean 与 annotated 截图。
- [`evals`](evals/README.md)：修改 Skill 时使用的小型行为评估协议。

Skill 迁移的是状态、布局、滚动、焦点、可访问性和恢复契约。目标项目的真实设计系统、组件、代码和运行态优先。

## 运行态证据

当已获授权的浏览器或 Electron renderer 已暴露 localhost CDP 端口时，可以在不导航、不执行产品操作的情况下采集当前页面：

```bash
node skills/agent-product-ui-ux/scripts/capture-runtime-evidence.mjs \
  --cdp 9222 \
  --out .tmp/ui-evidence \
  --name thread-working \
  --evidence-class real-runtime \
  --viewport 1920x1080 \
  --expect-url /threads/
```

脚本只修改 renderer viewport；不会导航、点击、输入、提交、审批、认证或关闭宿主浏览器。输出包含 clean 与 annotated 截图、可访问性快照、运行态 metadata、console、页面错误和 SHA-256 manifest。必填的证据类别可以避免把运行中的 fixture 或重建页面误标为目标产品真实运行态。

运行态证据包可能包含私有页面文本、URL 和图片。输出必须放在已安装 Skill 与公开 Git 历史之外。发布任何派生证据前，应同时审查文本、图片像素、OCR 结果、metadata 和 URL。产品特定的认证、profile、会话和应用启动自动化不属于这个公开仓库。

## 开发

要求 Node.js 22.20.0 或更高版本以及 npm，与固定版本的 Skills CLI 运行时一致。

```bash
npm ci
npm test
```

校验覆盖 metadata、链接和锚点、公开数据卫生、版本一致性、TypeScript 示例、JavaScript 与采集脚本语法、截图尺寸、eval fixtures、翻译新鲜度，以及 Skills CLI 真实安装结果与 canonical Skill 目录的逐文件一致性。

改动要求见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 设计来源与致谢

这是一个独立维护的社区项目，参考了包括 OpenAI Codex 在内的工作型 Agent 产品中公开可观察的交互模式。感谢 OpenAI Codex 团队对长任务 Agent 工作流和对话式开发工具的探索，也感谢 [asdlem/CodexDesktop-Rebuild](https://github.com/asdlem/CodexDesktop-Rebuild) 提供跨平台研究入口。

本项目是非官方项目，与 OpenAI 不存在隶属、赞助、背书或维护关系。“Codex-informed”只表示设计启发，不代表 OpenAI 发布的设计规范。公开资产使用合成示例，不包含 OpenAI 产品截图、品牌资产、发布 bundle、源码、用户会话或专有文案。OpenAI、Codex 及相关名称和标识的权利归其各自权利人所有。

## License

[MIT](LICENSE)
