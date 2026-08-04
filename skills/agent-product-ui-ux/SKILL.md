---
name: agent-product-ui-ux
description: "Design, implement, review, and verify work-oriented AI agent interfaces for conversational and asynchronous task flows, including progress and activity, approvals, interruption, retry and recovery, queued input, composers, contextual tool workspaces, side panes, file workspaces, scrolling, focus, accessibility, responsive layout, and runtime validation. Use for agent-product frontend work or UX reviews; do not use for marketing pages or ordinary non-agent CRUD interfaces."
---

# Agent Product UI/UX

Build recoverable, verifiable interfaces for conversational and asynchronous agent products. Study the target project's actual design system first, then apply the state, scrolling, focus, and recovery contracts in this skill.

## Required reference

Read [`references/interaction-guide.md`](references/interaction-guide.md) completely before designing, implementing, or reviewing an agent interface. Read the TypeScript contracts in `assets/reference-surface/` only when the task touches their subject. Treat the reference surface as a synthetic teaching aid, never as evidence of a real product implementation.

## Workflow

1. Define the user's job, primary path, affected surfaces, successful outcome, and explicit non-goals.
2. Inspect the target project's local rules, layout, tokens, components, icons, and interaction patterns.
3. Build a state matrix. Cover the ordinary states and add Approval, Stop, Resume, Retry, Partial success, Queue paused, and closed/launcher/active tool states where the real workflow needs them.
4. For every state, define the visible signal, one primary action, recovery scope, and combinations that must be impossible.
5. Define the thread follow zone, user-owned scrolling, expansion anchors, composer safe area, and per-thread position restoration.
6. Define focus entry, top-layer Escape behavior, focus restoration, keyboard paths, live regions, and reduced motion.
7. Implement with the host project's primitives. Keep dimensions, anchors, drafts, and completed work stable through dynamic states.
8. Run the smallest relevant tests, then verify the real page across the primary path, high-risk states, long content, narrow layouts, and keyboard use.
9. Report covered states, important tradeoffs, runtime evidence, and remaining risk. Do not claim browser verification that did not happen.

## Non-negotiable contracts

- Use a discriminated state model or an equivalent single source of truth. Do not assemble the interface from independent loading, error, approval, and resumable booleans.
- Separate Waiting from Approval, execution failure from local rendering failure, and automatic reconnection from user-triggered Retry.
- Bind Retry, Undo, and Partial success to a specific object and scope.
- A completed command is not automatically a successful user outcome. Do not add a generic right-aligned success badge to every activity row.
- For Partial success, lead with the failed objects. Offer failed-only retry only when that subset is addressable, idempotent, and safe to retry.
- Working exposes Stop. Stopped preserves results, draft, queue, and position, then exposes an explicit Resume.
- A failed queued item remains in place and blocks later items until the user chooses Retry, Edit, or Delete.
- Auto-follow only while the user remains in the follow zone. Never seize scroll ownership after the user scrolls upward.
- Make hover actions reachable through `:focus-within`, a menu, or a touch path, and reserve a stable action slot.
- For multiple contextual tools, start with a compact launcher. In a Files-like tool, establish active tabs, a primary canvas, and a nearby filterable tree. Preserve thread context and focus restoration. Do not build a tool platform for one simple auxiliary panel.
- Focus a safe action by default in dangerous confirmations. Autofocus an allow action only under an explicit approval policy.
- Never hide approval, failure, rollback scope, or a blocked queue in a toast.
- Never use color as the only status signal.
- Do not turn a work surface into a marketing page, decorative card wall, or nested-card composition.
- Public artifacts use synthetic or owned material only. Do not include real product screenshots, brand assets, source bundles, credentials, user data, or private workspace evidence.

## Reference assets

`assets/reference-surface/` is a dependency-free synthetic implementation:

- `conversation-state.contract.ts`: derive visible copy, live-region output, and the primary action from one state.
- `thread-scroll.contract.ts`: separate list mechanics from follow, anchor, position, and composer-safe-area contracts.
- `focus-lifecycle.contract.ts`: top-layer Escape, focus restoration, safe initial focus, and accessible names.
- `tool-workspace.contract.ts`: closed/launcher/active tool state, active tabs, pane width, secondary navigation, and focus restoration.
- `index.html`: interactive desktop examples for Working, Approval, recovery, queue, launcher, and Files workspace states.

Use these files as contract examples. Do not copy their visual tokens, brand assumptions, or sample text into product code.

## Runtime verification

For visible UI changes:

1. Read [`references/runtime-evidence.md`](references/runtime-evidence.md) before using CDP, authenticated pages, or screenshots from a real product.
2. Use `scripts/capture-runtime-evidence.mjs` when an existing browser or Electron renderer exposes a localhost CDP port. Keep its output outside the skill and outside public Git by default.
3. Use the project's required desktop viewport. If none exists, cover `1920x1080` and the narrowest width the feature claims to support.
4. Capture a clean screenshot for visual review and an annotated screenshot for mapping numbered labels to current element refs.
5. Refresh the accessibility snapshot after structural changes and never reuse stale element refs.
6. Check nonblank rendering, composition, sticky regions, long text, dynamic states, focus, accessible names, console output, page errors, and reduced motion.
7. Keep synthetic references, static code evidence, and real target-product runtime evidence clearly separated. State exactly which expected states were absent.

## Delivery

Report the result in this compact structure:

```text
User goal and primary path:
States covered:
Interaction contracts applied:
Host-system mapping and deliberate deviations:
Real runtime verification:
Unverified areas and remaining risk:
```
