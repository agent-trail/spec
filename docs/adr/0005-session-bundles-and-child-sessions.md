# Session bundles and child sessions

## Status

Accepted.

## Decision

Agent Trail supports one trail file containing one or more session groups. A file with multiple groups is a session bundle: a forest of session groups. Each group remains an ordinary session and may be linear or tree-native.

External subagents and forked transcripts are modeled as child sessions. The durable edge lives on the child session header:

```json
{ "fork_from": { "session_id": "<parent-session-id>", "entry_id": "<parent-event-id>" } }
```

`entry_id` is emitted only when the source exposes a clear parent event. `content_hash` is optional best effort and refers to the parent session-level content hash when known.

Parent events may also carry a source-visible child session id when the adapter can link the child confidently. Runtime ids that are not durable Agent Trail header ids stay in metadata or `source.raw`.

## Considered Options

- Encode all child work as `parent_id` subtrees inside the parent group. Rejected because some sources store full child transcripts as separate sessions, and `parent_id` must not cross groups.
- Put the authoritative graph in the envelope `sessions` manifest. Rejected because it duplicates lineage and makes extraction brittle.
- Make `header.fork_from` authoritative and keep the manifest as an index or rendering hint. Chosen.

## Consequences

- The file grammar is `envelope? + session groups`.
- The envelope `sessions` manifest is not authoritative over session headers.
- Whole-file validation can compare in-file parent and child links.
- Missing, ambiguous, or external-only child links remain readable.
- Adapters annotate what they know and do not invent child groups.
