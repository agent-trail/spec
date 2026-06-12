# Segment reconciliation and event id policy

## Status

Accepted.

## Decision

Agent Trail defines reconciliation semantics for multi-segment sessions and tightens canonical event `id` values so segment deduplication can be based on exact string equality.

The reconciliation model is:

1. Group segment trails by `header.session_uid`.
2. Treat inputs without `session_uid` as pass-through single segments.
3. Sort each group by `segment.seq`; an absent `segment` counts as `seq: 1`.
4. Verify each non-first segment's `segment.prev_content_hash` against the prior segment.
5. Warn and continue on chain gaps, duplicate sequence numbers, or unverifiable links.
6. Concatenate events and deduplicate by event `id`.
7. Build a merged header from the first segment for stable fields and the last segment for late-bound fields.
8. Drop `segment` from the merged header and recompute the merged session-level `content_hash`.

The canonical event `id` shape is constrained to the same identifier family as `session_uid`: canonical ULID, hyphenated UUID, or unhyphenated UUID. Writers must emit canonical casing so validators and reconcilers can compare ids by exact string equality.

## Considered Options

- Keep loose event ids and emit only warnings. Rejected because deduplication would depend on writer behavior that the schema did not enforce.
- Define a separate reconciliation-only identifier. Rejected because event `id` already carries graph identity.
- Use canonical ULID or UUID event ids. Chosen.

## Consequences

- Reconciliation can deduplicate events without source-specific id normalization.
- Readers can preserve partial segment groups even when chain verification is incomplete.
- Writers must not emit compound or adapter-local strings as canonical event ids.
- Stable and late-bound header field behavior is part of the format semantics, not a storage API.
- The multi-segment primitives from ADR-0003 remain the only header fields needed to opt into this behavior.
