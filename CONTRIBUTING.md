# Contributing

Keep changes small, evidence-based, and compatible with the open Agent Skills format.

## Before opening a change

- For a bug, include the host, version, operating system, minimal reproduction, expected behavior, actual behavior, and sanitized evidence.
- Discuss substantial new scope in an issue before implementation.
- Never contribute real user conversations, credentials, local machine paths, private workspace names, proprietary bundles, or third-party product screenshots.
- Preserve English `skills/agent-product-ui-ux/SKILL.md` and its references as the only executable source. Translate human-facing README content, not the executable skill.

## Verification

```bash
npm ci
npm test
```

For behavioral guidance changes, also run the relevant cases in `evals/cases.json` without the skill and with the skill. Record the concrete failure before the change, the changed behavior, host and model versions, and rubric results. A prose claim that the prompt “looks better” is not sufficient evidence.

For visible reference-surface changes, attach a real browser screenshot at `1920x1080` and confirm keyboard behavior. Regenerate clean and annotated captures together.

## Pull requests

Explain the problem, alternatives considered, scope deliberately excluded, validation commands, behavior-evaluation result, and public-data review. Release notes should describe user-visible behavior rather than internal file movement.

Maintainers use SemVer. Breaking trigger or contract changes require a major version; additive guidance generally requires a minor version; corrections without new behavior use a patch version.
