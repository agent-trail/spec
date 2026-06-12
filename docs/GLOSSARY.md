# Agent Trail Glossary

Agent Trail defines a shared language for portable coding-agent session interchange. This glossary keeps spec, schema, and fixture discussions aligned without adding new normative requirements.

## Language

**Agent Trail**:
The open format and tooling ecosystem for portable coding-agent sessions.
Avoid: AgentTrail.

**Trail file**:
A JSONL file conforming to the Agent Trail format. It contains one or more session groups.
Avoid: session dump, transcript file, conversation export.

**Format contract**:
The stable interoperability agreement that compliant writers and readers rely on.
Avoid: TypeScript API, implementation model.

**JSON Schema**:
The canonical machine-readable contract for validating Agent Trail records.
Avoid: generated type source, helper schema.

**Writer-strict validation**:
Validation that proves an emitted trail file conforms exactly to a released schema and whole-file rules.
Avoid: normal validation, loose validation.

**Reader-tolerant parsing**:
Parsing that preserves or skips unfamiliar future data without treating every unknown shape as fatal.
Avoid: strict validation, schema validation.

**Trail envelope**:
Optional `type:"trail"` record at line 1 carrying file-level metadata, file-scope hash, a sessions manifest, and extensions. It is not part of the event graph.
Avoid: file header, outer header.

**Header**:
The session header record with `type:"session"`. It appears on line 1 when there is no trail envelope and on line 2 when the envelope is present.
Avoid: event header.

**Session group**:
One `type:"session"` header plus the events after it until the next session header or EOF.
Avoid: embedded trail, nested session.

**Session bundle**:
A trail file with one or more session groups. The bundle is a forest at session-group level; each group may itself be linear or tree-native.
Avoid: multi-transcript, merged session.

**Child session**:
A separate session group or external session spawned or forked from another session, linked by the child header's `fork_from`.
Avoid: subtree, branch, sidechain when the source stores a separate transcript.

**Session segment**:
One trail-file artifact carrying part of a logical source session. Segments are linked by `session_uid` and ordered by `segment.seq`.
Avoid: session shard, chunk.

**Session UID**:
Header field `session_uid` identifying the source session a segment belongs to. It is stable across all segments of one source session and is a ULID or UUID.
Avoid: session id, which is the per-artifact `id`.

**Event**:
Any object after the header line. It is one unit of session content.
Avoid: log line when graph identity matters.

**Entry**:
Equivalent to event. Either term may appear in prose.

**Linear session**:
A session whose events do not use `parent_id`. Events are ordered by file position.

**Tree session**:
A session where some events use `parent_id` to form a DAG.

**Canonical event**:
One of the mandatory or optional event types defined by the format.
Avoid: arbitrary source event.

**Adapter**:
Software that reads a source agent's storage and emits a trail file.
Avoid: importer, parser plugin.

**Raw trail**:
A local trail artifact that preserves source-session fidelity before sharing.
Avoid: original trail, private copy.

**Redacted trail**:
A separate trail artifact produced from a raw trail with sensitive content removed or normalized.
Avoid: sanitized view, safe mode.

**Shared trail**:
A redacted trail transported through a sharing mechanism.
Avoid: public trail, hosted session.

**Session-level content hash**:
SHA-256 of canonical bytes covering only the session header and its events, with the session header's `content_hash` pinned to `<pending>`.
Avoid: trail hash, file hash.

**File-level content hash**:
SHA-256 of canonical bytes covering the whole file with the trail envelope's `content_hash` pinned to `<pending>`.
Avoid: session hash, transport hash.

**Content hash**:
SHA-256 of an exact artifact's canonical bytes.

**Canonical bytes**:
File content normalized for hashing by the Agent Trail content-addressing rules.

**Sessions manifest**:
Optional trail-envelope field `sessions` declaring the session groups present in a trail file. The session headers in the file are authoritative.
Avoid: session list as the source of truth.

**Source escape hatch**:
The `source.raw` field. It preserves source-format data needed for traceability or round-trip fidelity.
Avoid: canonical payload.

**Synthesized event**:
An event the adapter constructed from indirect source data rather than mapping from one real source event. It is flagged with `source.synthesized: true`.

## Relationships

- A trail file conforms to the format contract.
- A trail file contains one or more session groups; multiple groups form a session bundle.
- The JSON Schema is the canonical machine-readable part of the format contract.
- Writer-strict validation checks emitted trail files before publication or storage.
- Reader-tolerant parsing is for consumers reading potentially newer trail files.
- An adapter emits a raw trail from a source agent session.
- A redacted trail is produced from a raw trail.
- A shared trail transports a redacted trail.
- A session segment belongs to a logical source session identified by session UID.
- A child session links to its parent with `header.fork_from`; intra-session branches use event `parent_id`.

## Flagged Ambiguities

- "Validation" can mean writer-strict validation or reader-tolerant parsing. Use the precise term when behavior matters.
- "Trail" can mean a raw, redacted, or shared artifact. Use raw trail, redacted trail, or shared trail when artifact identity matters.
