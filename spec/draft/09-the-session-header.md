## 9. The session header

### 9.1 Schema

```jsonc
{
  "type": "session",
  "schema_version": "0.1.0",
  "id": "<session-uuid-or-ulid>",
  "session_uid": "<source-session-uuid-or-ulid>",  // optional; stable across segments
  "segment": { "seq": 1 },                         // optional; multi-segment marker
  "name": "<session-title>",                       // optional
  "description": "<free-text-description>",        // optional
  "tags": ["feature", "debug"],                    // optional
  "content_hash": "<sha256-hex>",               // optional; populated at finalize
  "ts": "<ISO-8601 timestamp>",
  "stream": {                                   // optional; live-capture marker (§9.4)
    "state": "open" | "closed",
    "started_at": "<ISO-8601 timestamp>"        // optional
  },
  "agent": {
    "name": "<canonical-agent-name>",
    "version": "<source-agent-version>",        // optional
    "model_default": "<model-id>"               // optional
  },
  "cwd": "<absolute-path-or-normalized>",       // optional
  "vcs": {                                      // optional
    "type": "git" | "jj" | "hg" | "svn" | "x-<vendor>/<name>",
    "revision": "<sha-or-change-id>" | null,
    "branch": "<branch-name>",                  // required when revision is null
    "remote_url": "<canonical-remote-url>"      // optional; see §9.2
  },
  "fork_from": {                                // optional
    "session_id": "<parent-session-id>",
    "content_hash": "<parent-content-hash>",    // optional
    "entry_id": "<parent-entry-id>"             // optional
  },
  "redacted_from": {                            // optional; redacted artifacts only
    "content_hash": "<raw-artifact-content-hash>"
  },
  "parse_fidelity": {                           // optional; at-a-glance parse summary
    "quarantined_count": 0,
    "termination_reason": "truncated"           // optional; when session_terminated exists
  },
  "source": {                                   // optional
    "agent": "<canonical-agent-name>",
    "path": "<original-file-path>",
    "format_version": "<source-format-version>"
  },
  "meta": {                                     // optional; vendor extensions (§8.3 / §12)
    "x-example/custom_field": "..."
  }
}
```

### 9.2 Fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `type` | yes | literal `"session"` | discriminator |
| `schema_version` | yes | string | currently `"0.1.0"` |
| `id` | yes | string | UUID or ULID per §7.1/§19 |
| `session_uid` | no | string | stable source-session identifier shared by all segments of one logical source session |
| `segment` | no | object | multi-segment marker; absent is equivalent to a single segment with `seq: 1` |
| `segment.seq` | yes (if `segment` present) | integer | 1-based segment sequence number |
| `segment.prev_content_hash` | yes when `segment.seq >= 2` | string \| null | previous segment's session-level `content_hash`; `null` marks an unverifiable chain break |
| `name` | no | string | human session label |
| `description` | no | string | free-text session description |
| `tags` | no | string[] | free-form session labels |
| `content_hash` | no | string | SHA-256 hex of this artifact; see §7.3 |
| `ts` | yes | string | ISO-8601 session start time; writers emit UTC `Z` with millisecond precision |
| `stream` | no | object | live-capture marker; see §9.4 |
| `agent.name` | yes | string | from the canonical registry (§14) |
| `agent.version` | no | string | source agent's version |
| `agent.model_default` | no | string | default model for the session |
| `cwd` | no | string | working directory; MAY be normalized for privacy |
| `vcs` | no | object | version control context at session time |
| `vcs.type` | yes (if `vcs` present) | enum or extension | `git`, `jj`, `hg`, `svn`, or `x-<vendor>/<name>` for non-reserved systems |
| `vcs.revision` | yes (if `vcs` present) | string \| null | commit SHA, change-id, revision identifier, or `null` for unborn HEAD repositories when `vcs.branch` is present |
| `vcs.remote_url` | no | string | canonical remote URL identifying the project across users, machines, and clones; see normalization rules below |
| `vcs.branch` | no | string | active branch / bookmark / topic name the session is running on (e.g., `feature/x`). Detached-HEAD sessions MAY omit. |
| `vcs.head_commit` | no (`vcs.revision` non-null only) | string | commit hash at session start (lowercase hex, 7–64 chars). For git with a committed HEAD, typically equals `vcs.revision`; the explicit field exists as a vcs-neutral alias. |
| `vcs.worktree` | no | object | worktree context when the session ran inside a working-tree clone or worktree (git worktree, jj workspace, etc.) |
| `vcs.worktree.name` | yes (if `vcs.worktree` present) | string | worktree short name |
| `vcs.worktree.path` | yes (if `vcs.worktree` present) | string | absolute path to the worktree |
| `vcs.worktree.original_cwd` | no | string | working directory of the parent repository at worktree-creation time |
| `vcs.worktree.original_branch` | no | string | branch the parent repository was on when the worktree was created |
| `vcs.worktree.original_head_commit` | no | string | commit the worktree was forked from (lowercase hex, 7–64 chars) |
| `fork_from` | no | object | reference to a parent session if forked |
| `redacted_from` | no | object | provenance link from a redacted artifact to the raw artifact hash |
| `parse_fidelity` | no | object | at-a-glance parse fidelity summary; absence means the writer did not provide a summary |
| `parse_fidelity.quarantined_count` | yes (if `parse_fidelity` present) | integer | number of `system_event` entries whose `payload.kind` is `x-*/unknown_record` in this session group |
| `parse_fidelity.termination_reason` | no | enum or extension | final `session_terminated.payload.reason`, when a `session_terminated` event is present |
| `source` | no | object | source-file metadata block (agent, path, format_version) |
| `meta` | no | object | vendor extensions; recommended keys use the `x-<vendor>/<name>` extension grammar (§8.3 / §12) |

When `parse_fidelity` is present, validators MUST compare it against the session group's entries. `quarantined_count` MUST equal the count of quarantined unknown source records emitted as `system_event` entries with `payload.kind` matching `x-*/unknown_record`; see the §10.3 quarantine convention. `termination_reason`, when a `session_terminated` entry exists, MUST match the final `session_terminated.payload.reason`; if no `session_terminated` entry exists, writers MUST omit `termination_reason`. This field is denormalized for cheap listing/filtering only; the event stream remains authoritative. Quarantined records are suspect parse fidelity, not necessarily lossy, because the raw source record is preserved.

`vcs.remote_url` provides a canonical project identifier that survives across users, machines, and clones — useful for cross-machine aggregation, profile filtering, and project-scoped analysis. Adapters that populate it:

- MUST normalize SSH and HTTPS variants of the same repository to a single canonical form. The reference normalization maps `git@host:org/repo.git`, `ssh://git@host/org/repo.git`, and `https://host/org/repo.git` to `https://host/org/repo` (strip trailing `.git`, strip userinfo, rewrite SSH to HTTPS).
- MUST strip embedded credentials (`https://user:pass@host/...` → `https://host/...`) before emission.
- SHOULD populate when the source agent records repository location or when `cwd` is detectably a versioned working directory. When the source declares multiple remotes (e.g., git `origin` plus `upstream`), prefer `origin`.
- MUST omit the field when no remote is configured — do not fabricate one.
- For submodules and worktrees, emit the remote of the outermost working tree's toplevel; `cwd` and `vcs.revision` disambiguate within.

Fresh repositories with an unborn HEAD MAY emit `vcs.revision:null` when a branch is known. A `vcs` block with `vcs.revision:null` MUST include `vcs.branch`, MUST omit `vcs.head_commit`, and writers MUST NOT emit an information-free VCS block. When `vcs.revision` is non-null for git, `vcs.head_commit` typically equals `vcs.revision`.

Privacy: `remote_url` reveals repository identity and MAY identify a private repo. Redacted artifacts MAY strip or normalize it (§16).

When a trail file carries both header-level `vcs` (session-time context) and envelope-level `vcs` (file-assembly-time context, §8), they represent different observation points. File-assembly tools SHOULD preserve both when present. For multi-segment reconciliation rules, see §9.5.

### 9.3 Example

```json
{"type":"session","schema_version":"0.1.0","id":"01HM7K5R9X2QZJ8VD6W4P3T1F0","content_hash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","ts":"2026-05-17T14:02:00.000Z","agent":{"name":"claude-code","version":"2.1.42","model_default":"claude-sonnet-4-5"},"cwd":"<cwd>","vcs":{"type":"git","revision":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"}}
```

### 9.4 Streaming and live capture

JSONL is append-friendly by design: trail files can be written event by event as a session unfolds, and readers can `tail -f` them. v0.1.x adds an explicit marker so writers and readers can agree on live-capture state without overloading other header fields.

The optional header `stream` object:

| Field | Required | Type | Notes |
|---|---|---|---|
| `stream.state` | yes (if `stream` present) | enum | `open` while the writer is actively appending; `closed` once finalized |
| `stream.started_at` | no | string | ISO-8601 timestamp when the stream began; matches the §9 `ts` semantics |

Lifecycle:

1. **Live phase.** Writer emits the header with `stream: { state: "open" }`. `content_hash` is omitted or set to `"<pending>"`. Events are appended as they happen.
2. **Finalize.** Writer rewrites the header with `stream` either removed or set to `state: "closed"`, then computes `content_hash` per §7.3. Appending stops.
3. **Clean end.** Writer MAY append a `session_end` event (§10.3) to mark a normal conclusion before finalize. Abnormal ends still use `session_terminated`.

Tail readers that observe `stream.state == "open"` SHOULD assume more events MAY arrive. Readers observing `stream` absent or `state == "closed"` SHOULD treat the file as a finalized artifact and verify `content_hash` when present.

`stream` is absent in trail files produced by stream-unaware writers; readers MUST treat that case as equivalent to a finalized non-streaming artifact (existing v0.1.0 behavior).

A live `system_event` heartbeat convention is described in §10.3.

---

### 9.5 Session segments (multi-segment sessions)

A single logical source session MAY be split across multiple trail-file artifacts — "segments" — when a long-running session is captured in chunks (e.g., a daemon writing periodically) or recovered after a writer is killed mid-session. The header carries three fields that let a reconciler group, order, and verify segment chains. All three are optional in v0.1; a single-segment trail simply omits them.

- `session_uid` — globally-unique source-session identifier. Stable across **all** segments of one source session. Reconcilers group segments by exact string equality on `session_uid`. Format: uppercase ULID (recommended, lexicographic time-prefix) or lowercase UUID (any RFC 4122 version, hyphenated or unhyphenated). Writers SHOULD emit `session_uid` even for single-segment trails, so a later segment can be reconciled against the first without rewriting the head. The schema enforces `session_uid` as REQUIRED when `segment.seq >= 2` (multi-segment continuation MUST be linkable).

- `segment.seq` — 1-based integer identifying which segment of the session this file is. Single-segment trails MAY omit `segment` entirely, which is equivalent to `{seq: 1}`.

- `segment.prev_content_hash` — the **session-level** `content_hash` (§7.3) of the previous segment's finalized bytes. Required when `seq >= 2`. Forms a verifiable chain (HLS / Postgres-WAL pattern). If the previous segment was lost and the chain cannot be verified, writers MAY emit `null` and readers MUST emit a `segment_chain_break` warning.

#### Segment reconciliation

Segment reconciliation is implementation behavior. A conforming writer emits the
fields above; a conforming reader can validate each segment independently. Tools
that merge segments SHOULD preserve event order by `segment.seq`, verify
`segment.prev_content_hash` where present, deduplicate exact event `id` matches,
and emit a new finalized trail with freshly computed hashes.

Implementation merge policy is documented in `docs/implementation-semantics.md`.

Whole-file graph rules (§18) apply **within** a segment, not across. Cross-segment references are out of scope for v0.1 (event `parent_id` chains do not span segments).

#### Writer guidance

- Writers SHOULD generate `session_uid` once per source session and reuse it for every segment.
- Writers SHOULD finalize each segment normally before starting a new segment.
- To produce `segment.prev_content_hash` for segment N, finalize segment N-1 per §7.3 and copy its session-level `content_hash` verbatim into segment N's header.
- Recovered writers MAY emit `segment.prev_content_hash: null` when the previous segment is lost.

#### Composition with multi-session files

`session_uid` and `segment.*` sit at the **session-header** grain, not the file grain. A multi-session trail file (§9.6) MAY contain N session headers, each independently multi-segmentable. The trail envelope (§8) is unaffected.

Within one file, two groups with the same `session_uid` SHOULD NOT claim the same normalized `segment.seq` value; a missing `segment` is equivalent to `seq: 1`. Duplicate pairs emit `duplicate_segment_seq` warnings. Groups for the same `session_uid` SHOULD appear in non-descending `segment.seq` order in file order; a descending sequence emits `out_of_order_segment_seq`.

---

### 9.6 Multi-session trail files

A trail file MAY contain one OR more `(session header, events*)` groups concatenated. Boundaries are positional: a group extends from a `type:"session"` record up to (but excluding) the next `type:"session"` record, or to EOF. Single-session trails are the N=1 case and are unchanged.

A multi-session trail is a session bundle: a forest of session groups. Each group MAY be linear or tree-native. Branches represented inside one source session use `parent_id` within that group; separate spawned or forked transcripts use separate groups linked by `header.fork_from`.

> Non-normative diagram.

```mermaid
flowchart TD
  A["Trail file"] --> B["Session group A"]
  A --> C["Session group B"]
  B --> D["Header A (§9)"]
  B --> E["Events A (§10)"]
  C --> F["Header B (§9)"]
  C --> G["Events B (§10)"]
  F -->|"fork_from.session_id"| D
  E -->|"parent_id stays inside group"| E
  G -->|"parent_id stays inside group"| G
```

#### 9.6.1 File grammar

```text
trail-file := envelope? group+
envelope   := <one JSONL record with type:"trail"> on line 1
group      := <one JSONL record with type:"session"> events*
events     := zero or more event records (§10)
```

The trail envelope (§8) remains optional even when N ≥ 2. When present with N ≥ 2 groups, the file-level `content_hash` on the envelope covers all N groups' already-stamped session hashes, applying the §7.4 two-pass procedure unchanged (every session hash stamped first; envelope hash stamped over the finalized record set). When absent, file-level identity defaults from §8.5 apply (no file-level `content_hash` is meaningful; only per-session hashes).

#### 9.6.2 Group boundaries and reader-tolerant recovery

Readers detect group boundaries by `type:"session"` alone. A record with `type:"session"` always opens a new group, regardless of `schema_version` value: this lets reader-tolerant parsers (§6) recover from a malformed mid-file header and continue parsing subsequent groups instead of treating the rest of the file as orphan events. The strict validator still errors on individual records that fail schema validation; recovery affects parsing structure, not per-record validity.

Entries that appear before the first `type:"session"` record (and after any envelope) are not part of any group and are always invalid: `events_before_first_session_header`.

#### 9.6.3 Per-group validation

Whole-file graph rules (§18) apply **within** a group, not across:

- `parent_id` resolution is scoped to the enclosing group. A `parent_id` that references an `id` in another group is treated as `unknown_parent_id` (cross-group references go through `fork_from`, not `parent_id`).
- `tool_call` / `tool_result` pairing (§10.5) runs per group. An unmatched `tool_call` in group A is not satisfied by a `tool_result` in group B.
- `session_end.payload.final_message_id`, `source.raw.envelope_ref`, `payload.usage` checks, and the `stream` consistency rule each run per group.

Event `id` uniqueness (§7.5) remains **file-scoped**: every `id` (across every group's header and events) MUST be unique within the file.

#### 9.6.4 Per-group `content_hash`

Each group's session-level `content_hash` is computed over the canonical bytes of that group's slice only (header + its events, envelope and sibling groups excluded). This is the same procedure as §7.3 / §7.4 applied to the slice. As a consequence, extracting one session from a multi-session file (drop the envelope, drop sibling groups, write only that group's canonical bytes) reproduces the same digest as the in-file value.

When a reader extracts a single session from a multi-session file outside writer-strict validation and the recomputed `content_hash` does not match the value stored in the in-file header, it SHOULD emit a warning rather than an error. Strict validation of a finalized trail file still treats an in-place finalized `content_hash` mismatch as an error (§18.4).

#### 9.6.5 Cross-group references

The only sanctioned cross-group reference primitive is the session header's `fork_from`:

- `fork_from.session_id` MAY reference a sibling session within the same file or an external session.
- When `fork_from.session_id` matches a sibling's `id` in the same file and `fork_from.content_hash` is also present, the hash MUST match that sibling's session-level `content_hash`. Mismatch is a `cross_group_fork_from_hash_mismatch` warning.
- External references (`session_id` not matched in-file) are not validated here; if the referenced session's bytes are available, callers MAY verify the hash through their own resolver.

`parent_id` is event-graph topology only and MUST NOT span groups.

#### 9.6.6 Order, divergence, and per-session metadata

- Sessions in a file SHOULD appear in chronological order by header `ts`. Out-of-order placement emits `out_of_order_session_headers` (warning, not error).
- Per-session `cwd` and `vcs` MAY diverge across sessions in the same file. Divergent `vcs.revision` across groups emits `vcs_revision_divergence` (warning, not error) — useful for spotting accidental cross-checkout bundling.
- `schema_version` is carried on every session header. Sessions in the same file are independently versioned (reader-tolerant patch acceptance per §6 applies per-header).
- Empty groups (a header with zero events) are legal — they represent "session started, nothing happened."

#### 9.6.7 Redaction of multi-session files

Redacting a multi-session trail produces a multi-session redacted trail with the same group count in the same order, redacted in place. The redactor resets `content_hash` to `<pending>` on every session header (and on the envelope when present) before share/transport tooling re-stamps via the two-pass §7.4 procedure.

When redaction changes bytes, lineage hashes that point to artifacts in the same redacted file MUST be rewritten to the target's redacted content hash, using the §7.4.1 hash tier. Header-level `fork_from.content_hash` is rewritten when `fork_from.session_id` names an in-file sibling. `segment.prev_content_hash` is rewritten when the previous `segment.seq` for the same `session_uid` is in the file. When the lineage target is not in the redacted file, redactors MUST drop `fork_from.content_hash` while keeping id references, and MUST set `segment.prev_content_hash` to `null` for an unverifiable previous segment. `redacted_from.content_hash` remains raw-artifact provenance: header-level `redacted_from.content_hash` links the redacted session to its raw counterpart; envelope-level `redacted_from.content_hash` links the redacted file to its raw counterpart.

#### 9.6.8 No hard cap

This spec does not impose a maximum on the number of session groups per file. Consumers MAY apply their own limits.

---

