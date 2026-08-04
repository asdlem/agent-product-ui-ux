import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const skillDir = join(root, "skills", "agent-product-ui-ux");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function filesUnder(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => ![".git", "node_modules"].includes(entry.name));
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

function frontmatter(markdown, path) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  check(Boolean(match), `${path}: missing YAML frontmatter`);
  if (!match) return {};
  try {
    return YAML.parse(match[1]);
  } catch (error) {
    failures.push(`${path}: invalid YAML (${error.message})`);
    return {};
  }
}

function anchorFor(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function validateMarkdown(path) {
  const text = await readFile(path, "utf8");
  const links = [...text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const rawTarget of links) {
    if (/^(https?:|mailto:)/.test(rawTarget)) continue;
    const [filePart, fragment] = rawTarget.split("#");
    const target = resolve(dirname(path), decodeURIComponent(filePart || basename(path)));
    try {
      const targetStat = await stat(target);
      if (fragment && targetStat.isFile() && extname(target).toLowerCase() === ".md") {
        const targetText = await readFile(target, "utf8");
        const anchors = new Set([...targetText.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => anchorFor(match[1])));
        check(anchors.has(decodeURIComponent(fragment)), `${relative(root, path)}: missing anchor ${rawTarget}`);
      }
    } catch {
      failures.push(`${relative(root, path)}: broken link ${rawTarget}`);
    }
  }
}

const version = (await readFile(join(root, "VERSION"), "utf8")).trim();
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
check(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version), "VERSION is not valid SemVer");
check(pkg.version === version, "package.json version differs from VERSION");

const skillPath = join(skillDir, "SKILL.md");
const skillText = await readFile(skillPath, "utf8");
const metadata = frontmatter(skillText, "skills/agent-product-ui-ux/SKILL.md");
check(JSON.stringify(Object.keys(metadata).sort()) === JSON.stringify(["description", "name"]), "SKILL.md frontmatter must contain only name and description");
check(metadata.name === basename(skillDir), "SKILL.md name must match its folder");
check(typeof metadata.description === "string" && metadata.description.length >= 80, "SKILL.md description is missing or too vague");
check(/Use for/.test(metadata.description) && /do not use/.test(metadata.description), "SKILL.md description must state positive and negative triggers");

const openai = YAML.parse(await readFile(join(skillDir, "agents", "openai.yaml"), "utf8"));
check(openai?.interface?.display_name === "Agent Product UI/UX", "openai.yaml display_name drifted");
check(openai?.interface?.default_prompt?.includes("$agent-product-ui-ux"), "openai.yaml prompt must invoke the canonical skill name");
check(!(await readdir(skillDir)).some((name) => /^readme\.md$/i.test(name)), "The installable skill must not contain README.md");

const allFiles = await filesUnder(root);
const markdownFiles = allFiles.filter((path) => extname(path).toLowerCase() === ".md");
await Promise.all(markdownFiles.map(validateMarkdown));

const textExtensions = new Set([".md", ".json", ".yaml", ".yml", ".js", ".mjs", ".ts", ".css", ".html", ".txt"]);
const forbidden = [
  [/\/Users\/dev\//i, "local user path"],
  [/\/Users\/hywl\//i, "local console-user path"],
  [/\bworkbench-ui-ux\b/i, "private Workbench skill"],
  [/\bauth\.json\b/i, "authentication file"],
  [/\b(?:sk|ghp|gho)_[A-Za-z0-9]{16,}\b/, "credential-shaped token"],
  [/BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/, "private key"]
];
for (const path of allFiles.filter((candidate) => textExtensions.has(extname(candidate).toLowerCase()))) {
  const text = await readFile(path, "utf8");
  for (const [pattern, label] of forbidden) check(!pattern.test(text), `${relative(root, path)}: contains ${label}`);
}

const readme = await readFile(join(root, "README.md"), "utf8");
const readmeHash = createHash("sha256").update(readme).digest("hex");
const chineseReadme = await readFile(join(root, "README.zh-CN.md"), "utf8");
check(chineseReadme.includes(`Source: README.md SHA-256: ${readmeHash}`), "README.zh-CN.md translation marker is stale");

const screenshotPaths = allFiles.filter((path) => path.includes(`${join("assets", "screenshots")}`) && extname(path).toLowerCase() === ".png");
check(screenshotPaths.length === 10, "Expected five clean and five annotated screenshots");
for (const path of screenshotPaths) {
  const data = await readFile(path);
  check(data.subarray(1, 4).toString("ascii") === "PNG", `${relative(root, path)} is not a PNG`);
  check(data.readUInt32BE(16) === 1920 && data.readUInt32BE(20) === 1080, `${relative(root, path)} must be 1920x1080`);
  check(data[25] === 2 && data[24] === 8, `${relative(root, path)} must be 8-bit RGB without alpha`);
}

const evals = JSON.parse(await readFile(join(root, "evals", "cases.json"), "utf8"));
check(evals.schemaVersion === 1, "evals schemaVersion must be 1");
check(Array.isArray(evals.cases) && evals.cases.length >= 6 && evals.cases.length <= 10, "evals must contain 6-10 focused cases");
const evalIds = new Set();
for (const item of evals.cases ?? []) {
  check(typeof item.id === "string" && !evalIds.has(item.id), `invalid or duplicate eval id: ${item.id}`);
  evalIds.add(item.id);
  check(typeof item.task === "string" && item.task.length > 20, `${item.id}: task is too short`);
  check(Array.isArray(item.rubric) && item.rubric.length >= 3, `${item.id}: rubric needs at least three checks`);
}

for (const relativeConfig of [
  "skills/agent-product-ui-ux/assets/reference-surface/tsconfig.json"
]) {
  const result = spawnSync(join(root, "node_modules", ".bin", "tsc"), ["--project", join(root, relativeConfig), "--noEmit"], { encoding: "utf8" });
  check(result.status === 0, `${relativeConfig}: TypeScript failed\n${result.stdout}${result.stderr}`);
}
const javascript = join(skillDir, "assets", "reference-surface", "app.js");
const jsCheck = spawnSync(process.execPath, ["--check", javascript], { encoding: "utf8" });
check(jsCheck.status === 0, `app.js syntax failed\n${jsCheck.stderr}`);

const installRoot = await mkdtemp(join(tmpdir(), "agent-product-ui-ux-install-"));
const installDir = join(installRoot, basename(skillDir));
const copy = spawnSync("cp", ["-R", skillDir, installDir], { encoding: "utf8" });
check(copy.status === 0, `installation smoke copy failed: ${copy.stderr}`);
const installedSkill = await readFile(join(installDir, "SKILL.md"), "utf8");
check(frontmatter(installedSkill, "installed SKILL.md").name === "agent-product-ui-ux", "installed skill metadata is invalid");

if (failures.length) {
  console.error(`Validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

assert.equal(failures.length, 0);
console.log(`Validated agent-product-ui-ux ${version}: ${allFiles.length} files, ${markdownFiles.length} Markdown files, ${screenshotPaths.length} screenshots, ${evals.cases.length} behavior cases.`);
