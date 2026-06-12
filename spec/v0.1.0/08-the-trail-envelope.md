## 8. The trail envelope

The trail envelope is an OPTIONAL record on line 1 that carries file-scope metadata distinct from per-session metadata. When absent, the session header occupies line 1 and behaviour matches earlier drafts. When present, the session header MUST follow on line 2 and at most one envelope is permitted per file.

### 8.1 Schema

```jsonc
{
  "type": "trail",
  "schema_version": "0.1.0",
  "id": "<file-uuid-or-ulid>",
  "name": "<human-label>",                          // optional
  "description": "<free text>",                     // optional
  "ts": "<ISO-8601 timestamp>",
  "producer": "trail-cli/0.3.0",
  "content_hash": "<sha256-hex>",                   // optional; populated at finalize
  "tags": ["..."],                                  // optional
  "vcs": { "type": "git", "revision": "..." },      // optional; same shape as §9 vcs
  "fork_from": {                                    // optional; file-level fork link
    "trail_id": "<parent-file-id>",                 // UUID or ULID id
    "content_hash": "<parent-file-hash>"            // optional
  },
  "redacted_from": {                                // optional; redacted artifacts only
    "content_hash": "<raw-file-content-hash>"
  },
  "sessions": [                                     // optional manifest
    { "id": "<session-id>", "agent": "<canonical-name>" }
  ],
  "meta": {                                         // optional; see §8.3
    "x-entire/checkpoint_id": "ckpt-7"
  }
}
```

### 8.2 Fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `type` | yes | literal `"trail"` | discriminator |
| `schema_version` | yes | string | currently `"0.1.0"` for the envelope shape — independent of session `schema_version` |
| `id` | yes | string | file-level identifier; distinct from any session `id` in the file |
| `name` | no | string | human label |
| `description` | no | string | free text |
| `ts` | yes | string | ISO-8601 timestamp when the file was assembled or exported |
| `producer` | yes | string | identifier of the writer (e.g., `trail-cli/0.3.0`) |
| `content_hash` | no | string | SHA-256 hex of the whole-file canonical bytes; see §7.4 |
| `tags` | no | string[] | free-form labels |
| `vcs` | no | object | working-tree context at file-assembly time |
| `fork_from` | no | object | reference to a parent file when forked; `trail_id` is a UUID or ULID id and `content_hash` is optional |
| `redacted_from` | no | object | provenance link from a redacted file to its raw counterpart |
| `sessions` | no | array | manifest of sessions in this file; validator warns on drift vs file content |
| `meta` | no | object | free-form vendor extensions (§8.3) |

The envelope MUST NOT carry a `parent_id`. It is not part of the event graph.

### 8.3 The `meta` extension convention

The trail envelope (§8), the session header (§9), and every event entry (§10.1) accept an optional `meta` object for vendor extensions, modelled on OCI image annotations and Kubernetes `metadata.annotations`. Object-typed values are allowed so nested data fits naturally. Keys SHOULD use the `x-<vendor>/<name>` extension grammar (§12.1) to avoid collisions (`x-example/team`, `x-acme/build_id`, `x-entire/checkpoint_id`). The validator treats `meta` as opaque; it contributes to whichever `content_hash` tier covers its host record (§7.4): `meta` on the session header or any event entry feeds the session-level hash, and `meta` on the trail envelope feeds the file-level hash.

For verbatim source-event preservation, use `source.raw` ([§10.1](#10-1-base-shape), [§10.7](#10-7-source-envelope-referencing), [§15.1](#15-1-source-raw-elision-and-redaction)) instead — `meta` is for cross-cutting annotations, not for capturing the source envelope.

This draft defines one standard event-entry `meta` key: `redaction_count` (§16). Other standard keys MAY be promoted in later minor bumps based on observed usage.

### 8.4 The `sessions` manifest

When `sessions` is present, the validator warns if the manifest disagrees with the file:

- The manifest MUST list one entry per session group (§9.6) in file order. Each entry's `id` and `agent` MUST match the corresponding session header's `id` and `agent.name`. Length mismatch and per-entry drift both emit `envelope_sessions_manifest_drift` warnings — never errors, so renderers can still display the file.
- The manifest is an index/rendering hint only. It MUST NOT carry graph facts such as child-session role or follows edges; session headers are authoritative for lineage.

### 8.5 File identity defaults when envelope is absent

When no envelope is written, file-level identity defaults derive from the session:

- File `id` = session `id`.
- File `name` is unset.
- The file-level content hash is unavailable; only the session content hash is meaningful.

