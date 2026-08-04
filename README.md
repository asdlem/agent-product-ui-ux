# Agent Product UI/UX Skill

[简体中文](README.zh-CN.md)

`agent-product-ui-ux` is an open, work-oriented UI/UX skill for conversational and asynchronous agent products. It helps an agent design, implement, review, and verify progress, approvals, interruption, recovery, queues, composers, scrolling, focus, responsive layout, contextual tool panes, and file workspaces.

The repository contains one canonical executable skill in English. Human-facing project documentation is available in English and Simplified Chinese.

## Install

Install through the open Skills CLI:

```bash
npx skills add asdlem/agent-product-ui-ux
```

For a non-interactive global installation of this skill:

```bash
npx skills add asdlem/agent-product-ui-ux --skill agent-product-ui-ux -g -y
```

Inspect the repository without installing, or update an existing global installation:

```bash
npx skills add asdlem/agent-product-ui-ux --list
npx skills update agent-product-ui-ux -g -y
```

Do not also copy the skill manually into another root discovered by the same host. Restart or refresh the host after installation, then invoke `$agent-product-ui-ux` explicitly or let the model use it for matching agent-product frontend tasks.

## Contents

- [`SKILL.md`](skills/agent-product-ui-ux/SKILL.md): trigger, workflow, and non-negotiable interaction contracts.
- [`interaction-guide.md`](skills/agent-product-ui-ux/references/interaction-guide.md): progressively loaded design and verification guidance.
- [`runtime-evidence.md`](skills/agent-product-ui-ux/references/runtime-evidence.md): evidence classes, localhost CDP boundaries, and runtime review workflow.
- [`capture-runtime-evidence.mjs`](skills/agent-product-ui-ux/scripts/capture-runtime-evidence.mjs): read-only clean, annotated, accessibility, console, and manifest capture from an existing browser or Electron target.
- [`reference-surface`](skills/agent-product-ui-ux/assets/reference-surface/): dependency-free synthetic interaction examples and TypeScript contracts.
- [`screenshots`](skills/agent-product-ui-ux/assets/screenshots/): clean and annotated captures generated from the synthetic surface.
- [`evals`](evals/README.md): a small behavior-evaluation protocol for changes to the skill.

The skill transfers state, layout, scrolling, focus, accessibility, and recovery contracts. The target project's actual design system, components, code, and runtime behavior take precedence.

## Runtime evidence

When an authorized browser or Electron renderer already exposes a localhost CDP port, capture the selected page without navigation or product actions:

```bash
node skills/agent-product-ui-ux/scripts/capture-runtime-evidence.mjs \
  --cdp 9222 \
  --out .tmp/ui-evidence \
  --name thread-working \
  --evidence-class real-runtime \
  --viewport 1920x1080 \
  --expect-url /threads/
```

The script changes only the renderer viewport. It does not navigate, click, type, submit, approve, authenticate, or close the host browser. Output includes clean and annotated screenshots, accessibility snapshots, runtime metadata, console and page errors, and a SHA-256 manifest. The required evidence class prevents a running fixture or reconstruction from being mislabeled as the target product's real runtime.

Runtime bundles may contain private page text, URLs, and images. Keep them outside the installed skill and public Git history. Review text, pixels, OCR results, metadata, and URLs before publishing any derived evidence. Product-specific authentication, profile, conversation, and application-startup automation does not belong in this public repository.

## Development

Requirements: Node.js 22.20.0 or later and npm, matching the pinned Skills CLI runtime.

```bash
npm ci
npm test
```

Validation checks metadata, links and anchors, public-data hygiene, version consistency, TypeScript examples, JavaScript and capture-script syntax, screenshot dimensions, evaluation fixtures, translation freshness, and a real Skills CLI installation whose output must match the canonical skill tree.

See [CONTRIBUTING.md](CONTRIBUTING.md) for change evidence and [CHANGELOG.md](CHANGELOG.md) for releases.

## Design provenance and thanks

This independent community project is informed by publicly observable interaction patterns in work-oriented agent products, including OpenAI Codex. Thanks to the OpenAI Codex team for advancing long-running agent workflows and conversational development tools, and to [asdlem/CodexDesktop-Rebuild](https://github.com/asdlem/CodexDesktop-Rebuild) for providing a cross-platform research entry point.

The project is unofficial and is not affiliated with, sponsored by, endorsed by, or maintained by OpenAI. “Codex-informed” describes inspiration, not an OpenAI design specification. Public artifacts contain synthetic examples rather than OpenAI product screenshots, brand assets, shipped bundles, source code, user conversations, or proprietary copy. OpenAI, Codex, and related names and marks belong to their respective owners.

## License

[MIT](LICENSE)
