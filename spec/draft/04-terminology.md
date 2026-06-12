## 4. Terminology

| Term | Definition |
|---|---|
| **Trail file** | A JSONL file conforming to this specification; contains one or more session groups. |
| **Trail envelope** | Optional `type:"trail"` record at line 1 carrying file-level metadata (producer, file label, file-scope hash, manifest, vendor extensions). Not part of the event graph. |
| **Header** | The session header (`type:"session"`). On line 1 when there is no envelope, on line 2 when the envelope is present. Not part of the event graph. |
| **Session group** | One `type:"session"` header plus the events after it until the next session header or EOF. |
| **Session bundle** | A trail file with one or more session groups. At session-group level the bundle is a forest; each group MAY itself be linear or tree-native. |
| **Child session** | A separate session group or external session spawned or forked from another session, linked by the child header's `fork_from`. |
| **Event** | Any object after the header line; one unit of session content. |
| **Turn** | One user-prompt-to-agent-completion cycle as delimited by the source. `turn_id` values are opaque source-correlation tokens; readers MUST NOT require them to resolve to any entry. |
| **File-level content hash** | SHA-256 of the canonical bytes covering the whole file with the trail envelope's `content_hash` pinned to `<pending>`. |
| **Session-level content hash** | SHA-256 of the canonical bytes covering ONLY the session header and its events (envelope excluded), with the session header's `content_hash` pinned to `<pending>`. |
| **Entry** | Equivalent to "event"; either term MAY appear. |
| **Adapter** | Software that reads a source agent's storage and emits a trail file. |
| **Linear session** | A session whose events do not use `parent_id`. Events are ordered by file position. |
| **Tree session** | A session where some events use `parent_id` to form a DAG. |
| **Canonical event** | One of the mandatory or optional event types in [§10.2](#10-2-mandatory-event-types) and [§10.3](#10-3-optional-event-types). |
| **Raw trail** | A local artifact preserving source fidelity as much as possible. |
| **Redacted trail** | A separate artifact produced from a raw trail for sharing. It has its own `content_hash`. |
| **Shared trail** | A redacted trail transported through a sharing mechanism. |
| **Synthesized event** | An event the adapter constructed from indirect source data (e.g., a git diff), not mapped from a real source event. Flagged with `source.synthesized: true`. |
| **Content hash** | SHA-256 of the exact artifact's canonical bytes (§7). |
| **Canonical bytes** | The file content normalized per §7 for hashing. |
| **Source escape hatch** | The `source.raw` field; preserves verbatim source-format data for lossless round-trip. |

---

