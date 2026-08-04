<!-- Source: README.md SHA-256: f734dedb0292422afdf23bb25e4e27b6598eb07b299f078a183ec702db83a431 -->

# Agent 产品 UI/UX Skill

[English](README.md)

`agent-product-ui-ux` 是面向对话式、异步执行型 Agent 产品的开源工作型 UI/UX Skill。它帮助 Agent 设计、实现、review 和验证任务进度、审批、中断恢复、队列、Composer、滚动、焦点、响应式布局、上下文工具 pane 和文件工作区。

仓库只有一份英文 canonical 可执行 Skill；面向人的项目文档提供英文和简体中文版本。

## 安装

选择一种安装方式，不要把同一个 Skill 同时安装到宿主能够发现的多个目录。

### Codex

```bash
git clone https://github.com/asdlem/agent-product-ui-ux.git
CODEX_SKILLS_ROOT="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$CODEX_SKILLS_ROOT"
cp -R agent-product-ui-ux/skills/agent-product-ui-ux "$CODEX_SKILLS_ROOT/agent-product-ui-ux"
```

若未设置 `CODEX_HOME`，Codex 通常使用 `~/.codex`。

### 仓库局部 Agent

对于从 `.agents/skills/` 发现开放 Agent Skills 目录结构的工具：

```bash
mkdir -p .agents/skills
cp -R /path/to/agent-product-ui-ux/skills/agent-product-ui-ux .agents/skills/agent-product-ui-ux
```

安装后重启或刷新宿主，然后显式调用 `$agent-product-ui-ux`，或让模型在匹配的 Agent 产品前端任务中自动使用。

## 内容

- [`SKILL.md`](skills/agent-product-ui-ux/SKILL.md)：触发条件、工作流和硬性交互契约。
- [`interaction-guide.md`](skills/agent-product-ui-ux/references/interaction-guide.md)：按需加载的设计与验收指南。
- [`reference-surface`](skills/agent-product-ui-ux/assets/reference-surface/)：无依赖的 synthetic 交互示例和 TypeScript 契约。
- [`screenshots`](skills/agent-product-ui-ux/assets/screenshots/)：由 synthetic surface 生成的 clean 与 annotated 截图。
- [`evals`](evals/README.md)：修改 Skill 时使用的小型行为评估协议。

Skill 迁移的是状态、布局、滚动、焦点、可访问性和恢复契约。目标项目的真实设计系统、组件、代码和运行态优先。

## 开发

要求 Node.js 20 或更高版本以及 npm。

```bash
npm ci
npm test
```

校验覆盖 metadata、链接和锚点、公开数据卫生、版本一致性、TypeScript 示例、JavaScript 语法、截图尺寸、eval fixtures、翻译新鲜度以及干净安装冒烟验证。

改动要求见 [CONTRIBUTING.md](CONTRIBUTING.md)，版本记录见 [CHANGELOG.md](CHANGELOG.md)。

## 设计来源与致谢

这是一个独立维护的社区项目，参考了包括 OpenAI Codex 在内的工作型 Agent 产品中公开可观察的交互模式。感谢 OpenAI Codex 团队对长任务 Agent 工作流和对话式开发工具的探索，也感谢 [asdlem/CodexDesktop-Rebuild](https://github.com/asdlem/CodexDesktop-Rebuild) 提供跨平台研究入口。

本项目是非官方项目，与 OpenAI 不存在隶属、赞助、背书或维护关系。“Codex-informed”只表示设计启发，不代表 OpenAI 发布的设计规范。公开资产使用合成示例，不包含 OpenAI 产品截图、品牌资产、发布 bundle、源码、用户会话或专有文案。OpenAI、Codex 及相关名称和标识的权利归其各自权利人所有。

## License

[MIT](LICENSE)
