## 6. Versioning

The header's `schema_version` is a SemVer string. The current version is `"0.1.0"`. Writers MUST emit the exact version they conform to.

Agent Trail uses SemVer for the interoperability contract:

| Change type | Version bump | Examples |
|---|---|---|
| Editorial-only change | no bump or patch | Typos, formatting, non-normative wording, examples that do not change validity or semantics. |
| Normative clarification with no behavior change | patch | Resolving ambiguity while preserving the same valid files and reader behavior. |
| Backward-compatible feature addition | minor | New optional field, new optional event type, new registered agent or tool kind that readers MAY ignore. |
| Breaking change | major | Required field changes, field removal, incompatible meaning changes, or changes that make existing valid trails invalid. |

Before `1.0.0`, Agent Trail still uses this compatibility discipline conservatively:

- `0.1.x` versions are the same feature family. Readers that support `0.1.0` SHOULD accept later `0.1.x` patch versions.
- `0.2.0` and later `0.x` versions MAY add backward-compatible features. Readers MAY accept them best-effort by skipping unknown event types and ignoring unknown payload fields.
- Breaking changes SHOULD be avoided before real adapter and reader experience proves they are necessary. If unavoidable, they MUST get a new minor while the spec is still pre-1.0, and the changelog MUST mark them explicitly as breaking.
- `1.0.0` is reserved for the first stable interoperability contract.

Published spec and schema URLs are immutable. Local source files (`spec.md` and `schema.json`) represent the current working draft or next release candidate; released snapshots live at versioned URLs such as `/spec/v0.1.0` and `/schema/v0.1.0.json`.

Writer schemas are exact per release: the v0.1.0 writer schema requires `schema_version: "0.1.0"`. Reader tolerance is runtime behavior, not permission for writers to emit a version other than the release they implement.

| Source version | Reader behavior |
|---|---|
| Same `major.minor`, any patch | Fully supported if the reader supports that feature family. |
| Newer `0.x` minor | Best-effort: skip unknown event types, ignore unknown payload fields, preserve unknown records when round-tripping, and warn instead of aborting where possible. |
| New major version | Readers MAY reject unless they explicitly support that major version. |

---

