# Runtime Evidence Workflow

Use this workflow when a UI/UX claim depends on a real browser or Electron renderer. Static source and synthetic examples do not satisfy this requirement.

## Evidence classes

- `real-runtime`: captured from the target product while it was running.
- `static`: inferred from source, bundles, localized copy, or configuration.
- `synthetic`: produced by a reconstruction or fixture.
- `unverified`: required behavior that was not available in the captured runtime.

Never promote one class into another. A completed state does not prove Working, Approval, Stopped, Error, or Queue behavior that was absent from the DOM.

## Existing CDP target

Start the target browser or Electron application with remote debugging bound to localhost. Authentication, profile setup, and application startup are host-specific and stay outside this public skill.

Before connecting:

1. Confirm the CDP endpoint is bound only to `127.0.0.1`.
2. Confirm the selected profile and account are authorized for this review.
3. Decide which interactions are read-only. Opening an existing item, scrolling, expanding disclosure, changing a local tab, and closing a local pane may be acceptable; sending, approving, changing settings, starting tools, or creating remote data are not read-only.
4. Choose an output directory that is ignored by Git and outside the installed skill.

Inspect the endpoint and current targets:

```bash
curl -fsS http://127.0.0.1:9222/json/version
curl -fsS http://127.0.0.1:9222/json/list
```

If several pages exist, use `agent-browser --cdp 9222 tab list` and select the intended target. Verify the URL before capturing.

## Capture one state

Run the bundled script from the installed skill:

```bash
node scripts/capture-runtime-evidence.mjs \
  --cdp 9222 \
  --out .tmp/ui-evidence \
  --name thread-working \
  --evidence-class real-runtime \
  --viewport 1920x1080 \
  --expect-url /threads/
```

The script never navigates, clicks, types, submits, approves, authenticates, or closes the external browser. It sets the renderer viewport and reads runtime metadata and accessibility output. `--evidence-class` is required: use `real-runtime` only for the target product itself, and use `synthetic` for fixtures, reconstructions, and reference surfaces even when they are running in a real browser.

The script saves:

```text
thread-working-<timestamp>/
|-- manifest.json
|-- cdp-version.json
|-- cdp-targets.json
|-- runtime.json
|-- accessibility-snapshot.txt
|-- interactive-snapshot.txt
|-- clean.png
|-- annotated.png
|-- annotated-legend.txt
|-- console.txt
`-- page-errors.txt
```

`manifest.json` records the browser, protocol, URL, title, requested viewport, capture policy, file sizes, PNG dimensions, and SHA-256 digests. All outputs may contain user or product data and are private by default.

## Reach another state

Use `agent-browser --cdp <port> snapshot -i` to obtain fresh refs. Perform only the explicitly allowed interaction. After any DOM change, discard previous refs and capture the new state under a new name.

```bash
agent-browser --cdp 9222 snapshot -i
agent-browser --cdp 9222 click @e7
agent-browser --cdp 9222 snapshot -i

node scripts/capture-runtime-evidence.mjs \
  --cdp 9222 \
  --out .tmp/ui-evidence \
  --name files-workspace \
  --evidence-class real-runtime \
  --viewport 1920x1080
```

Do not encode generic click sequences into the capture script. Element refs expire, targets differ, and a label such as `Allow`, `Run`, or `Retry` can produce external side effects.

## Review the evidence

For each state:

1. Open `clean.png` and inspect composition, density, alignment, clipping, sticky surfaces, long content, and nonblank rendering.
2. Use `annotated.png` with `annotated-legend.txt` to map spatial controls to the current `@eN` refs. The numbered overlay is not product styling.
3. Read both snapshots for roles, names, disabled state, disclosure state, and keyboard reachability.
4. Compare the requested viewport with `runtime.json`. Renderer CSS dimensions do not prove native window chrome, physical screen dimensions, or resize behavior.
5. Inspect console and page errors. Separate application failures from capture-tool failures.
6. Record which states were present and which remained unavailable.

## Publication boundary

Never commit real runtime output automatically. Before publishing any artifact, inspect text, screenshots, metadata, URL, title, file tree, and OCR output for credentials, conversations, account details, local paths, private repository names, branches, and proprietary assets. Prefer publishing a synthetic reproduction and a sanitized written conclusion. Keep real evidence in an access-controlled repository only when it is necessary and authorized.
