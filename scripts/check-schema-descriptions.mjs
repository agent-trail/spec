import { readFile } from "node:fs/promises";

const schemaUrl = new URL("../schema/draft.json", import.meta.url);

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function pointer(path) {
  return `/${path.map((part) => String(part).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}`;
}

function get(root, path) {
  return path.reduce((value, part) => value?.[part], root);
}

function hasPathPart(path, parts) {
  return path.some((part) => parts.has(part));
}

function canonicalPropertyForBranch(root, path) {
  const branchIndex = path.findIndex((part) =>
    part === "anyOf" || part === "oneOf" || part === "allOf" || part === "then" || part === "else"
  );
  if (branchIndex === -1) return undefined;

  return get(root, [...path.slice(0, branchIndex), "properties", path.at(-1)]);
}

function isPropertySchemaPath(path) {
  return path.length >= 2 && path.at(-2) === "properties";
}

function isConstraintOnlyDuplicate(root, path) {
  if (hasPathPart(path, new Set(["if", "not", "dependentSchemas"]))) return true;

  const canonicalProperty = canonicalPropertyForBranch(root, path);
  if (canonicalProperty?.description !== undefined) return true;

  const propertyName = path.at(-1);
  const branchPath = path.slice(0, -2);
  const branch = get(root, branchPath);
  if (branch === undefined || Array.isArray(branch) || typeof branch !== "object") return false;

  const branchKeys = Object.keys(branch).sort();
  const branchOnlyKeys =
    branchKeys.length > 0 &&
    branchKeys.every((key) => key === "properties" || key === "required" || key === "description");
  if (!branchOnlyKeys) return false;

  const hasCompositionAncestor = path.some((part) => part === "anyOf" || part === "oneOf");
  if (!hasCompositionAncestor) return false;

  return (
    branch.required === undefined ||
    (Array.isArray(branch.required) && branch.required.includes(propertyName))
  );
}

function collectMissingDescriptions(root) {
  const missing = [];

  function visit(value, path) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }

    if (value === null || typeof value !== "object") return;

    if (
      isPropertySchemaPath(path) &&
      value.description === undefined &&
      !isConstraintOnlyDuplicate(root, path)
    ) {
      missing.push(pointer(path));
    }

    for (const [key, child] of Object.entries(value)) {
      visit(child, [...path, key]);
    }
  }

  visit(root, []);
  return missing;
}

const schema = await readJson(schemaUrl);
const missing = collectMissingDescriptions(schema);

if (missing.length > 0) {
  fail(
    [
      `schema/draft.json has ${missing.length} public property schema(s) without description:`,
      ...missing,
    ].join("\n"),
  );
}
