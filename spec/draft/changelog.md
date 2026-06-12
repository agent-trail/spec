## Changelog

### v0.1.0 (June 12, 2026)

Initial public draft. v0.1.0 defines:

- JSONL file layout, session header, core event envelope, mandatory event types, optional events, the canonical tool taxonomy, vendor `meta` extensions ([§8.3](./08-the-trail-envelope.md#83-the-meta-extension-convention)), tree semantics, layered validation, and artifact-level content addressing.
- Stable local source filenames (`spec.md`, `schema.json`) with immutable hosted release snapshots at `/spec/v0.1.0` and `/schema/v0.1.0.json`.
- The optional trail envelope record `type:"trail"` at line 1 ([§8](./08-the-trail-envelope.md#8-the-trail-envelope)) with Tier 1 fields (`id`, `name`, `description`, `ts`, `producer`, `content_hash`) and Tier 2 fields (`tags`, `vcs`, `fork_from`, `redacted_from`, `sessions`, `meta`), and two-tier identity ([§7.4](./07-identity-artifacts-and-content-addressing.md#74-two-tier-identity)): session-level `content_hash` excludes the envelope, file-level `content_hash` covers the whole file.
- Session headers MAY carry base `name`, `description`, and `tags`; `session_metadata_update` events replay on top of those base values. `vcs.type` allows reserved systems or `x-<vendor>/<name>` extensions, and envelope `fork_from.trail_id` uses the standard id shape.
- Multi-segment session primitives (`session_uid`, `segment.seq`, `segment.prev_content_hash`) and reconciliation invariants ([§9.5](./09-the-session-header.md#95-session-segments-multi-segment-sessions)).
- The optional header `stream` field, the `session_end` event, and the recommended `system_event` heartbeat convention ([§9.4](./09-the-session-header.md#94-streaming-and-live-capture), [§10.3](./10-events.md#103-optional-event-types)).
- Tool-surface fidelity for truncated tool-call args, string-replacement `file_edit`, branch-scoped pairing warnings, stable user-query option ids, stricter attachment identity, and tool-result meta key hygiene.
- The `source.raw.envelope_ref` inline-first / ref-subsequent envelope dedup convention ([§10.7](./10-events.md#107-source-envelope-referencing)), the `{ elided: true, size_bytes: N }` elide marker for `source.raw` ([§15.1](./15-truncation-overflow-and-raw-source-size.md#151-sourceraw-elision-and-redaction)), and the writer-side redaction requirement for credential patterns in `source.raw`.
- Normative share-time redaction rules for local attachment URIs, unsafe `overflow_ref` values, unresolved `user_query_response` answers, and privacy-sensitive field handling ([§16](./16-redaction.md#16-redaction)), plus the `tool_args_unredacted_secret` validator warning ([§18.4](./18-validation.md#184-file-graph-checks)).
- Envelope-level `payload.usage` on the first entry derived from a source envelope, including `agent_message`, `agent_thinking`, and `tool_call` ([§10.2](./10-events.md#102-mandatory-event-types)).
- During the v0.1.0 draft cycle, planning snapshots moved from the legacy `tool_call.payload.tool:"task_plan"` shape to the canonical `task_plan_update` event. Final v0.1.0 writer-strict output MUST use `task_plan_update`; legacy `task_plan` tool calls are invalid.
- During the v0.1.0 draft cycle, duplicate `system_event` kinds for `session_end` and `permission_mode_change` were removed, thinking levels became source-defined strings, `user_message.origin` was added, and related vocabulary clarifications landed.
- During the v0.1.0 draft cycle, vendor extensions converged on one `x-<vendor>/<name>` grammar across `meta`, enum extensions, `system_event.kind`, `tool_result.payload.meta`, and custom `agent.name`.
- During the v0.1.0 draft cycle, writer-strict identity and encoding were hardened: ULIDs are uppercase, UUIDs are lowercase, timestamps carry schema `format:"date-time"` annotation, and strings with unpaired surrogates are invalid (`ill_formed_string`).

---

