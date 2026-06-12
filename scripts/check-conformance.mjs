import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";

const fixtureRoot = new URL("../fixtures/validation/", import.meta.url);
const manifestUrl = new URL("manifest.json", fixtureRoot);
const readmeUrl = new URL("README.md", fixtureRoot);
const validationSpecUrls = [
  new URL("../spec/v0.1.0/18-validation.md", import.meta.url),
  new URL("../spec/draft/18-validation.md", import.meta.url),
];

const GENERATED_START = "<!-- conformance-manifest:start -->";
const GENERATED_END = "<!-- conformance-manifest:end -->";
const CLASS_ORDER = { W: 0, R1: 1, R2: 2 };
const writeMode = process.argv.includes("--write");

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function listFixturePaths(dirUrl = fixtureRoot) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const entryUrl = new URL(entry.name, dirUrl);
    if (entry.isDirectory()) {
      paths.push(...(await listFixturePaths(new URL(`${entry.name}/`, dirUrl))));
    } else if (entry.isFile() && entry.name.endsWith(".trail.jsonl")) {
      paths.push(relative(fixtureRoot.pathname, entryUrl.pathname));
    }
  }
  return paths.sort();
}

function assertSortedAndCovered(manifest, fixturePaths) {
  const manifestPaths = manifest.fixtures.map((fixture) => fixture.path);
  const sortedManifestPaths = [...manifestPaths].sort();
  if (JSON.stringify(manifestPaths) !== JSON.stringify(sortedManifestPaths)) {
    fail("fixtures/validation/manifest.json fixtures must be sorted by path.");
  }

  const duplicates = manifestPaths.filter((path, index) => manifestPaths.indexOf(path) !== index);
  if (duplicates.length > 0) {
    fail(
      `fixtures/validation/manifest.json contains duplicate fixture paths:\n${duplicates.join("\n")}`,
    );
  }

  const missing = fixturePaths.filter((path) => !manifestPaths.includes(path));
  const extra = manifestPaths.filter((path) => !fixturePaths.includes(path));
  if (missing.length > 0 || extra.length > 0) {
    fail(
      [
        "fixtures/validation/manifest.json fixture coverage drift.",
        missing.length > 0 ? `Missing:\n${missing.join("\n")}` : undefined,
        extra.length > 0 ? `Extra:\n${extra.join("\n")}` : undefined,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }
}

function portableCodesFromManifest(manifest) {
  return new Set(
    manifest.fixtures.flatMap((fixture) =>
      [...fixture.strict.diagnostics, ...fixture.tolerant.diagnostics]
        .map((diagnostic) => diagnostic.code)
        .filter((code) => code !== undefined),
    ),
  );
}

function portableCodesFromSpec(spec, path) {
  const start = spec.indexOf("Portable diagnostic code registry:");
  const end = spec.indexOf("#### Conformance suite", start);
  if (start === -1 || end === -1) {
    fail(`Unable to find portable diagnostic code registry in ${path}.`);
  }

  const codes = new Set();
  for (const line of spec.slice(start, end).split("\n")) {
    const match = line.match(/^\| `([^`]+)` \|/);
    if (match?.[1] !== undefined) codes.add(match[1]);
  }
  return codes;
}

function assertSetsMatch(label, left, right) {
  const missing = [...right].filter((value) => !left.has(value)).sort();
  const extra = [...left].filter((value) => !right.has(value)).sort();
  if (missing.length > 0 || extra.length > 0) {
    fail(
      [
        `${label} drift.`,
        missing.length > 0 ? `Missing:\n${missing.join("\n")}` : undefined,
        extra.length > 0 ? `Extra:\n${extra.join("\n")}` : undefined,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }
}

async function assertPortableCodes(manifest) {
  const manifestCodes = portableCodesFromManifest(manifest);
  const specRegistries = await Promise.all(
    validationSpecUrls.map(async (url) => ({
      path: url.pathname,
      codes: portableCodesFromSpec(await readFile(url, "utf8"), url.pathname),
    })),
  );

  assertSetsMatch(
    "spec/v0.1.0 and spec/draft portable diagnostic registries",
    specRegistries[0].codes,
    specRegistries[1].codes,
  );
  for (const registry of specRegistries) {
    const missing = [...manifestCodes].filter((code) => !registry.codes.has(code)).sort();
    if (missing.length > 0) {
      fail(
        `fixtures/validation/manifest.json uses diagnostic codes missing from ${registry.path}:\n${missing.join("\n")}`,
      );
    }
  }
}

function renderGeneratedReadmeSection(manifest) {
  const grouped = new Map();
  for (const fixture of manifest.fixtures) {
    const category = fixture.path.slice(0, fixture.path.indexOf("/"));
    const fixtures = grouped.get(category) ?? [];
    fixtures.push(fixture);
    grouped.set(category, fixtures);
  }

  const lines = [
    GENERATED_START,
    "## Scenarios",
    "",
    "This section is generated from `manifest.json`; run `mise run check:conformance` after fixture or expectation changes.",
    "",
  ];

  for (const [category, fixtures] of [...grouped.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`### ${category}/`, "");
    for (const fixture of fixtures) {
      lines.push(
        `- \`${fixture.path}\` \u2014 classes: ${formatConformanceClasses(fixture.classes)}, strict: ${strictSummary(fixture)}, tolerant: ${tolerantSummary(fixture)}`,
      );
    }
    lines.push("");
  }

  lines.push(GENERATED_END, "");
  return lines.join("\n");
}

function formatConformanceClasses(classes) {
  return [...classes].sort((a, b) => CLASS_ORDER[a] - CLASS_ORDER[b]).join(", ");
}

function strictSummary(fixture) {
  if (fixture.strict.valid) {
    return fixture.strict.diagnostics.length === 0
      ? "valid"
      : `valid with ${fixture.strict.diagnostics.length} diagnostic(s)`;
  }
  return `invalid with ${fixture.strict.diagnostics.length} assertion(s)`;
}

function tolerantSummary(fixture) {
  return fixture.tolerant.clean ? "clean" : `${fixture.tolerant.diagnostics.length} diagnostic(s)`;
}

function updateGeneratedReadmeSection(readme, generated) {
  const start = readme.indexOf(GENERATED_START);
  const end = readme.indexOf(GENERATED_END);
  if (start === -1 || end === -1 || end < start) {
    const scenarioStart = readme.indexOf("## Scenarios");
    if (scenarioStart === -1) return `${readme.trimEnd()}\n\n${generated}`;
    return `${readme.slice(0, scenarioStart).trimEnd()}\n\n${generated}`;
  }
  return `${readme.slice(0, start)}${generated}${readme.slice(end + GENERATED_END.length).replace(/^\s*/, "")}`;
}

async function assertReadmeFresh(manifest) {
  const readme = await readFile(readmeUrl, "utf8");
  const expected = updateGeneratedReadmeSection(readme, renderGeneratedReadmeSection(manifest));
  if (writeMode) {
    await writeFile(readmeUrl, expected);
    return;
  }
  if (readme !== expected) {
    fail("fixtures/validation/README.md conformance section is stale.");
  }
}

const manifest = await readJson(manifestUrl);
const fixturePaths = await listFixturePaths();

assertSortedAndCovered(manifest, fixturePaths);
await assertPortableCodes(manifest);
await assertReadmeFresh(manifest);
