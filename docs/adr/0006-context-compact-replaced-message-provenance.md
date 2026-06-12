# Context compaction replacement provenance

## Status

Accepted.

## Decision

Agent Trail has a first-class `context_compact` event. Its payload includes optional `replaced_message_ids` so a writer can record which earlier Agent Trail entries were folded into the compacted context.

Add:

```ts
context_compact.payload.replaced_message_ids?: id[]
```

The values are Agent Trail entry ids, not raw source ids. They are ordered by folded source order. The field is provenance-only: writer-strict schema validation checks only the id shape, and whole-file validation does not require each id to resolve to an entry still present in the same trail file.

Writers omit the field when provenance cannot be mapped deterministically to Agent Trail entry ids.

## Considered Options

- Store only the compacted summary. Rejected because sources may expose useful replacement provenance.
- Store raw source ids. Rejected because they are not portable Agent Trail graph identifiers.
- Store optional Agent Trail entry ids. Chosen.

## Consequences

- Consumers can render or analyze compaction provenance when present.
- Missing or dangling replacement ids do not make the trail invalid.
- Writers must omit the field rather than emitting raw source ids or empty arrays when provenance is unavailable.
