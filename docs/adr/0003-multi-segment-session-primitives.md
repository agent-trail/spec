# Multi-segment session primitives

## Status

Accepted.

## Decision

The session header carries three optional fields that let a reader group, order, and verify trail-file segments belonging to one logical source session:

- `session_uid`: globally unique source-session identifier, stable across all segments.
- `segment.seq`: 1-based integer; absent or `{ "seq": 1 }` for single-segment trails.
- `segment.prev_content_hash`: SHA-256 of the previous segment's session-level `content_hash`.

`segment.prev_content_hash` is required when `segment.seq >= 2`. It forms a verifiable chain. A `null` value is allowed when the prior segment was lost; readers warn but continue.

The primitives sit at session-header grain so they compose with session bundles. Each session group in a file may independently be multi-segmentable. The trail envelope is unaffected.

`session_uid` accepts ULID or UUID. ULID is recommended when a writer can choose the identifier because the time prefix gives a useful secondary sort when `segment.seq` is missing or ambiguous. UUID remains valid for sources that already expose UUID-shaped session metadata.

## Considered Options

- Per-event monotonic cursor plus session id. Rejected because Agent Trail already content-addresses events and supports event topology.
- Tuple position using session, shard, and per-shard sequence. Rejected because Agent Trail assumes one producer per session for this primitive.
- Globally unique event ids plus optional causal DAG plus segment chain hash. Adopted at header level as `session_uid`, `segment.seq`, and `segment.prev_content_hash`.

## Consequences

- The schema defines ULID, UUID, session UID, and segment shapes.
- Continuation segments require `session_uid`.
- Existing single-segment trails remain valid without segment fields.
- Reconciliation semantics build on these primitives in ADR-0004.
- The trail envelope and file-level hash model from ADR-0002 remain unchanged.
