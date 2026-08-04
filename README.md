# Agent Product UI/UX Skill

[简体中文](README.zh-CN.md)

`agent-product-ui-ux` is an open, work-oriented UI/UX skill for conversational and asynchronous agent products. It helps an agent design, implement, review, and verify progress, approvals, interruption, recovery, queues, composers, scrolling, focus, responsive layout, contextual tool panes, and file workspaces.

The repository contains one canonical executable skill in English. Human-facing project documentation is available in English and Simplified Chinese.

## Install

Choose one installation method. Do not install the same skill into multiple discovered roots.

### Codex

```bash
git clone https://github.com/asdlem/agent-product-ui-ux.git
CODEX_SKILLS_ROOT="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$CODEX_SKILLS_ROOT"
cp -R agent-product-ui-ux/skills/agent-product-ui-ux "$CODEX_SKILLS_ROOT/agent-product-ui-ux"
```

If `CODEX_HOME` is unset, Codex normally uses `~/.codex`.

### Repository-local agents

For tools that discover the open Agent Skills layout from `.agents/skills/`:

```bash
mkdir -p .agents/skills
cp -R /path/to/agent-product-ui-ux/skills/agent-product-ui-ux .agents/skills/agent-product-ui-ux
```

Restart or refresh the host after installation, then invoke `$agent-product-ui-ux` explicitly or let the model use it for matching agent-product frontend tasks.

## Contents

- [`SKILL.md`](skills/agent-product-ui-ux/SKILL.md): trigger, workflow, and non-negotiable interaction contracts.
- [`interaction-guide.md`](skills/agent-product-ui-ux/references/interaction-guide.md): progressively loaded design and verification guidance.
- [`reference-surface`](skills/agent-product-ui-ux/assets/reference-surface/): dependency-free synthetic interaction examples and TypeScript contracts.
- [`screenshots`](skills/agent-product-ui-ux/assets/screenshots/): clean and annotated captures generated from the synthetic surface.
- [`evals`](evals/README.md): a small behavior-evaluation protocol for changes to the skill.

The skill transfers state, layout, scrolling, focus, accessibility, and recovery contracts. The target project's actual design system, components, code, and runtime behavior take precedence.

## Development

Requirements: Node.js 20 or later and npm.

```bash
npm ci
npm test
```

Validation checks metadata, links and anchors, public-data hygiene, version consistency, TypeScript examples, JavaScript syntax, screenshot dimensions, evaluation fixtures, translation freshness, and a clean installation smoke test.

See [CONTRIBUTING.md](CONTRIBUTING.md) for change evidence and [CHANGELOG.md](CHANGELOG.md) for releases.

## Design provenance and thanks

This independent community project is informed by publicly observable interaction patterns in work-oriented agent products, including OpenAI Codex. Thanks to the OpenAI Codex team for advancing long-running agent workflows and conversational development tools, and to [asdlem/CodexDesktop-Rebuild](https://github.com/asdlem/CodexDesktop-Rebuild) for providing a cross-platform research entry point.

The project is unofficial and is not affiliated with, sponsored by, endorsed by, or maintained by OpenAI. “Codex-informed” describes inspiration, not an OpenAI design specification. Public artifacts contain synthetic examples rather than OpenAI product screenshots, brand assets, shipped bundles, source code, user conversations, or proprietary copy. OpenAI, Codex, and related names and marks belong to their respective owners.

## License

[MIT](LICENSE)
