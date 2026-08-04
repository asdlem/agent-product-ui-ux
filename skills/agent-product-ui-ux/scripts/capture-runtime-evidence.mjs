#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(scriptDir, "..");

function usage() {
  console.log(`Usage:
  node scripts/capture-runtime-evidence.mjs \\
    --cdp <localhost-port> \\
    --out <directory-outside-the-skill> \\
    --name <state-name> \\
    --evidence-class <real-runtime|synthetic> \\
    [--viewport 1920x1080] \\
    [--expect-url <substring>] \\
    [--wait-ms <0-10000>]

Captures read-only evidence from the currently selected CDP page. The script
does not navigate, click, type, submit, approve, authenticate, or close the
external browser. It sets the renderer viewport to the requested or default size.

The output contains page text and screenshots. Treat it as sensitive until a
human has reviewed it; never write it inside an installable/public skill.`);
}

function parseArgs(argv) {
  const options = { viewport: "1920x1080", waitMs: 0 };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") return { help: true };
    const value = argv[index + 1];
    if (!token.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error(`Expected a value after ${token}`);
    }
    const key = token.slice(2);
    if (key === "cdp") options.cdp = value;
    else if (key === "out") options.out = value;
    else if (key === "name") options.name = value;
    else if (key === "evidence-class") options.evidenceClass = value;
    else if (key === "viewport") options.viewport = value;
    else if (key === "expect-url") options.expectUrl = value;
    else if (key === "wait-ms") options.waitMs = Number(value);
    else throw new Error(`Unknown option: ${token}`);
    index += 1;
  }
  return options;
}

function isInside(parent, candidate) {
  const path = relative(parent, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

function runAgentBrowser(port, args, { maxOutput = 250_000 } = {}) {
  const result = spawnSync("agent-browser", ["--cdp", String(port), ...args], {
    encoding: "utf8",
    maxBuffer: maxOutput,
    env: {
      ...process.env,
      AGENT_BROWSER_CONTENT_BOUNDARIES: "1",
      AGENT_BROWSER_MAX_OUTPUT: String(maxOutput),
      AGENT_BROWSER_SESSION: `ui-evidence-${process.pid}`
    }
  });
  if (result.error?.code === "ENOENT") {
    throw new Error("agent-browser is required but was not found on PATH");
  }
  if (result.status !== 0) {
    throw new Error(`agent-browser ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  }
  return result.stdout.trim();
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(4_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

function pngDimensions(data) {
  if (data.length < 26 || data.subarray(1, 4).toString("ascii") !== "PNG") {
    throw new Error("Screenshot is not a valid PNG");
  }
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    bitDepth: data[24],
    colorType: data[25]
  };
}

async function fileEvidence(path) {
  const data = await readFile(path);
  return {
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
    ...(path.endsWith(".png") ? pngDimensions(data) : {})
  };
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  usage();
  process.exit(0);
}

if (!options.cdp || !options.out || !options.name || !options.evidenceClass) {
  usage();
  throw new Error("--cdp, --out, --name, and --evidence-class are required");
}
const port = Number(options.cdp);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("--cdp must be a localhost TCP port between 1 and 65535");
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(options.name)) {
  throw new Error("--name must use lowercase letters, digits, and hyphens only");
}
if (!["real-runtime", "synthetic"].includes(options.evidenceClass)) {
  throw new Error("--evidence-class must be real-runtime or synthetic");
}
if (!Number.isInteger(options.waitMs) || options.waitMs < 0 || options.waitMs > 10_000) {
  throw new Error("--wait-ms must be an integer from 0 to 10000");
}
const viewportMatch = options.viewport.match(/^(\d{3,5})x(\d{3,5})$/);
if (!viewportMatch) throw new Error("--viewport must use WIDTHxHEIGHT, for example 1920x1080");
const viewport = { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) };
if (viewport.width > 7680 || viewport.height > 4320) throw new Error("--viewport exceeds 7680x4320");

const outputRoot = resolve(options.out);
if (isInside(skillRoot, outputRoot)) {
  throw new Error("Refusing to store runtime evidence inside the installable skill");
}
await mkdir(outputRoot, { recursive: true });

const capturedAt = new Date();
const timestamp = capturedAt.toISOString().replace(/[:.]/g, "-");
const runDir = resolve(outputRoot, `${options.name}-${timestamp}`);
await mkdir(runDir, { recursive: false });

const endpoint = `http://127.0.0.1:${port}`;
const [cdpVersion, cdpTargets] = await Promise.all([
  fetchJson(`${endpoint}/json/version`),
  fetchJson(`${endpoint}/json/list`)
]);
await writeFile(resolve(runDir, "cdp-version.json"), `${JSON.stringify(cdpVersion, null, 2)}\n`);
await writeFile(resolve(runDir, "cdp-targets.json"), `${JSON.stringify(cdpTargets, null, 2)}\n`);

runAgentBrowser(port, ["set", "viewport", String(viewport.width), String(viewport.height)]);
if (options.waitMs > 0) runAgentBrowser(port, ["wait", String(options.waitMs)]);

const pageUrl = runAgentBrowser(port, ["get", "url"]);
const pageTitle = runAgentBrowser(port, ["get", "title"]);
if (options.expectUrl && !pageUrl.includes(options.expectUrl)) {
  throw new Error(`Selected page URL does not include --expect-url value: ${options.expectUrl}`);
}

const runtimeExpression = `JSON.stringify({
  capturedUrl: location.href,
  title: document.title,
  readyState: document.readyState,
  viewport: {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualWidth: window.visualViewport?.width ?? null,
    visualHeight: window.visualViewport?.height ?? null,
    devicePixelRatio: window.devicePixelRatio
  },
  screen: {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  },
  document: {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    bodyTextLength: document.body?.innerText?.length ?? 0,
    interactiveElementCount: document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="link"],[tabindex]').length,
    activeElement: document.activeElement ? {
      tag: document.activeElement.tagName,
      role: document.activeElement.getAttribute('role'),
      ariaLabel: document.activeElement.getAttribute('aria-label')
    } : null
  },
  media: {
    dark: matchMedia('(prefers-color-scheme: dark)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
  }
})`;
const runtimeEnvelope = JSON.parse(runAgentBrowser(port, ["--json", "eval", runtimeExpression]));
const runtimeResult = runtimeEnvelope?.data?.result;
const runtime = typeof runtimeResult === "string" ? JSON.parse(runtimeResult) : runtimeResult;
if (!runtime || typeof runtime !== "object") {
  throw new Error("agent-browser returned an invalid runtime evaluation result");
}
await writeFile(resolve(runDir, "runtime.json"), `${JSON.stringify(runtime, null, 2)}\n`);

const snapshot = runAgentBrowser(port, ["snapshot", "-c", "-d", "12"]);
const interactive = runAgentBrowser(port, ["snapshot", "-i"]);
await writeFile(resolve(runDir, "accessibility-snapshot.txt"), `${snapshot}\n`);
await writeFile(resolve(runDir, "interactive-snapshot.txt"), `${interactive}\n`);

const cleanPath = resolve(runDir, "clean.png");
const annotatedPath = resolve(runDir, "annotated.png");
runAgentBrowser(port, ["screenshot", cleanPath]);
const annotatedLegend = runAgentBrowser(port, ["--annotate", "screenshot", annotatedPath]);
await writeFile(resolve(runDir, "annotated-legend.txt"), `${annotatedLegend}\n`);

for (const [name, command] of [["console.txt", ["console"]], ["page-errors.txt", ["errors"]]]) {
  try {
    await writeFile(resolve(runDir, name), `${runAgentBrowser(port, command)}\n`);
  } catch (error) {
    await writeFile(resolve(runDir, name), `Capture unavailable: ${error.message}\n`);
  }
}

const evidenceFiles = (await readdir(runDir)).sort();
const files = {};
for (const file of evidenceFiles) files[file] = await fileEvidence(resolve(runDir, file));
const manifest = {
  schemaVersion: 1,
  evidenceClass: options.evidenceClass,
  capturedAt: capturedAt.toISOString(),
  source: {
    cdpEndpoint: endpoint,
    browser: cdpVersion.Browser ?? null,
    protocolVersion: cdpVersion["Protocol-Version"] ?? null,
    pageUrl,
    pageTitle,
    targetCount: Array.isArray(cdpTargets) ? cdpTargets.length : null
  },
  requestedViewport: viewport,
  capturePolicy: {
    navigated: false,
    pageContentMutated: false,
    viewportEmulationChanged: true,
    externalBrowserClosed: false
  },
  sensitivity: {
    containsPageContent: true,
    reviewedForPublication: false,
    publicByDefault: false
  },
  files
};
await writeFile(resolve(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(runDir);
