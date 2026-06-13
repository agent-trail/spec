import { execFile } from "node:child_process";
import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const repoRoot = new URL("../", import.meta.url);
const schemaUrl = new URL("schema/v0.1.0.json", repoRoot);
const scriptPath = fileURLToPath(import.meta.url);
const generationTimeoutMs = Number(process.env.AGENT_TRAIL_TS_GENERATION_TIMEOUT_MS ?? 10_000);
const commandTimeoutMs = 10_000;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function execFilePromise(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error !== null) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function run(command, args, options = {}) {
  try {
    return await execFilePromise(command, args, {
      cwd: fileURLToPath(repoRoot),
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: commandTimeoutMs,
      ...options,
    });
  } catch (error) {
    const details = [error.message, error.stdout, error.stderr].filter(Boolean).join("\n");
    throw new Error(`${command} ${args.join(" ")} failed:\n${details}`);
  }
}

async function findPackageRoot(binName, packageName) {
  const { stdout } = await run("mise", ["which", binName]);
  let current = dirname(await realpath(stdout.trim()));

  while (current !== dirname(current)) {
    try {
      const packageJson = JSON.parse(await readFile(join(current, "package.json"), "utf8"));
      if (packageJson.name === packageName) return current;
    } catch {
      // Keep walking to the package root.
    }
    current = dirname(current);
  }

  throw new Error(`Unable to resolve ${packageName} from ${binName}.`);
}

async function loadJsonSchemaToTypescript() {
  const require = createRequire(import.meta.url);
  try {
    return require("json-schema-to-typescript");
  } catch {
    const packageRoot = await findPackageRoot("json2ts", "json-schema-to-typescript");
    return require(packageRoot);
  }
}

async function runGenerateChild() {
  const { compile } = await loadJsonSchemaToTypescript();
  const schema = JSON.parse(await readFile(schemaUrl, "utf8"));
  const generated = await compile(schema, "AgentTrail", {
    bannerComment: "",
    cwd: fileURLToPath(repoRoot),
    format: false,
    strictIndexSignatures: true,
    unreachableDefinitions: true,
    unknownAny: true,
  });

  process.stdout.write(generated);
}

async function generateTypes() {
  const start = performance.now();
  try {
    const { stdout } = await execFilePromise(process.execPath, [scriptPath], {
      cwd: fileURLToPath(repoRoot),
      encoding: "utf8",
      env: { ...process.env, AGENT_TRAIL_TS_GENERATE_CHILD: "1" },
      maxBuffer: 20 * 1024 * 1024,
      timeout: generationTimeoutMs,
    });
    const elapsedMs = performance.now() - start;
    return { source: stdout, elapsedMs };
  } catch (error) {
    if (error.killed || error.signal === "SIGTERM") {
      throw new Error(
        `json-schema-to-typescript exceeded ${generationTimeoutMs}ms for schema/v0.1.0.json.`,
      );
    }
    const details = [error.message, error.stdout, error.stderr].filter(Boolean).join("\n");
    throw new Error(`json-schema-to-typescript failed:\n${details}`);
  }
}

function smokeSource() {
  return `import type { AgentTrailV010 } from "./agent-trail.generated";

const id = "00000000-0000-4000-8000-000000000001";
const ts = "2026-05-17T14:00:00.000Z";

const validShellTruncated: AgentTrailV010 = { type: "tool_call", id, ts, payload: { tool: "shell_command", args: { command: "printf ok" }, truncated: true, args_size: 9 } };
// @ts-expect-error truncated shell_command calls require args_size.
const invalidShellMissingArgsSize: AgentTrailV010 = { type: "tool_call", id, ts, payload: { tool: "shell_command", args: { command: "printf ok" }, truncated: true } };
// @ts-expect-error file_read args require path.
const invalidFileReadMissingPath: AgentTrailV010 = { type: "tool_call", id, ts, payload: { tool: "file_read", args: {} } };
const capabilityChangeJsonValues: AgentTrailV010 = { type: "capability_change", id, ts, payload: { scope: "tool", reason: "registered", changed: [{ name: "ToolSearch", field: "config", from: false, to: [1, "two", null] }] } };
const vendorMetadataPrimitive: AgentTrailV010 = { type: "session_metadata_update", id, ts, payload: { field: "x-codex/value", value: 1, reason: "external" } };
const vendorMetadataArray: AgentTrailV010 = { type: "session_metadata_update", id, ts, payload: { field: "x-codex/value", value: [1, "two", null], reason: "external" } };
const vendorMetadataObject: AgentTrailV010 = { type: "session_metadata_update", id, ts, payload: { field: "x-codex/value", value: { nested: true, items: [1, null] }, reason: "external" } };
const vendorMetadataNull: AgentTrailV010 = { type: "session_metadata_update", id, ts, payload: { field: "x-codex/value", value: null, reason: "external" } };

void validShellTruncated;
void invalidShellMissingArgsSize;
void invalidFileReadMissingPath;
void capabilityChangeJsonValues;
void vendorMetadataPrimitive;
void vendorMetadataArray;
void vendorMetadataObject;
void vendorMetadataNull;
`;
}

async function assertSchemaRejectsUnknownToolPayloadField(tempDir) {
  const samplePath = join(tempDir, "tool-call-extra-field.json");
  await writeFile(
    samplePath,
    `${JSON.stringify({
      type: "tool_call",
      id: "00000000-0000-4000-8000-000000000002",
      ts: "2026-05-17T14:00:00.000Z",
      payload: {
        tool: "shell_command",
        args: { command: "printf ok" },
        future_field: true,
      },
    })}\n`,
  );

  try {
    await execFilePromise(
      "ajv",
      [
        "validate",
        "--spec=draft2020",
        "--strict=false",
        "--validate-formats=false",
        "-s",
        fileURLToPath(schemaUrl),
        "-d",
        samplePath,
      ],
      {
        cwd: fileURLToPath(repoRoot),
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        timeout: commandTimeoutMs,
      },
    );
  } catch (error) {
    if (error.code === 1) return;
    throw error;
  }

  throw new Error("schema/v0.1.0.json allowed an unknown tool_call.payload field.");
}

async function runMain() {
  const tempDir = await mkdtemp(join(tmpdir(), "agent-trail-tsgen-"));
  const generatedPath = join(tempDir, "agent-trail.generated.d.ts");
  const smokePath = join(tempDir, "agent-trail-smoke.ts");

  const { source, elapsedMs } = await generateTypes();
  await writeFile(generatedPath, source);
  await writeFile(smokePath, smokeSource());

  await run("tsc", [
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--pretty",
    "false",
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    smokePath,
  ]);

  await assertSchemaRejectsUnknownToolPayloadField(tempDir);

  console.log(`json-schema-to-typescript completed in ${Math.round(elapsedMs)}ms`);
  console.log("TypeScript generation smoke checks passed");
}

if (process.env.AGENT_TRAIL_TS_GENERATE_CHILD === "1") {
  await runGenerateChild();
} else {
  await runMain().catch((error) => fail(error.message));
}
