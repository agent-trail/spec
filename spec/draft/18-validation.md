## 18. Validation

Validation is layered because JSON Schema validates one line at a time, while several Agent Trail rules require whole-file context.

### 18.1 Writer schema

`schema.json` is the writer-strict schema for v0.1.0. It validates a single JSON object line and requires header and envelope records to use `schema_version: "0.1.0"`. It rejects unknown top-level event types. Writers use this schema for emitted envelope, header, and event lines.

`schema.json` is the canonical format contract through v1.0. Generated types, validators, and packages MUST derive from it rather than maintaining a separate manual contract.

### 18.2 Reader tolerance

Readers MAY accept compatible future v0.x files best-effort: skip unknown event types, ignore unknown payload fields, preserve unknown records when round-tripping, and warn instead of aborting where possible. Reader tolerance is runtime behavior, not the writer-strict schema contract.

### 18.3 Conformance classes and diagnostics

Agent Trail defines named conformance classes so tools can describe the depth of
reader or writer support they implement.

| Class | Name | Requirements |
|---|---|---|
| **R0** | Renderer | Reader-tolerant JSONL parsing per §6 and §18.2; renders the mandatory event types in §10.2, including user messages, agent messages, tool calls, tool results, and summaries; preserves or displays fallback output for unknown records it can parse; does not crash on valid or quarantinable input. |
| **R1** | Structural reader | R0 plus the non-hash whole-file layout, graph, pairing, streaming-state, and diagnostic checks in §18.4. R1 catches duplicate ids, unknown parents, parent cycles, unresolved `source.raw.envelope_ref`, tool-call pairing diagnostics, and other file-level checks that do not require recomputing content hashes or comparing segment-chain hashes. |
| **R2** | Verifying reader | R1 plus content-hash verification per §7.3 and §7.4, and segment-chain verification per §9.5. Readers in this class warn rather than abort on reader-tolerant hash mismatches, per §18.4.1. |
| **W** | Writer | Emits writer-strict records that validate against `schema.json` and satisfy the strict whole-file validation rules in §18.4. Writer conformance is about emitted trail files, not reader tolerance. |

`@agent-trail/core` implements Class R2 reader behavior through its parsing,
validation, canonicalization, hashing, and multi-segment reconciliation APIs.

The validation conformance suite manifest tags each fixture with the applicable
classes. The current validation suite does not tag fixtures as R0 because it
asserts validation outcomes, not rendering behavior.

#### Claiming conformance (non-normative)

Projects MAY claim support using the class name they implement, for example
"Agent Trail R0 reader", "Agent Trail R2 reader", or "Agent Trail W writer".
Such claims mean the implementation passes the conformance checks tagged for
that class and follows the referenced normative sections. Agent Trail does not
define a certification registry or badge authority.

#### Validation diagnostics

Validators SHOULD report normalized diagnostics with `line`, `path` (JSON Pointer), `severity`, `code`, and `message`. Implementations MAY include extra fields, but these five fields are the portable diagnostic surface.

Portable diagnostic code registry:

| Code | Severity | Defining section |
|---|---|---|
| `ambiguous_sequential_pairing` | warning | §10.5 / §18.4.2 |
| `child_session_fork_from_mismatch` | warning | §18.4.2 |
| `child_session_parent_link_mismatch` | warning | §18.4.2 |
| `content_hash_invalid` | error | §7.3 / §18.4.1 |
| `content_hash_mismatch` | error (strict), warning (reader-tolerant) | §7.3 / §18.4.1 |
| `cross_group_fork_from_hash_mismatch` | warning | §9.6.5 |
| `duplicate_id` | error | §18.4.1 |
| `duplicate_option_labels` | warning | §10.2 / §18.4.2 |
| `duplicate_segment_seq` | warning | §9.5 / §18.4.2 |
| `duplicate_tool_result` | warning | §10.5 / §18.4.2 |
| `duplicate_user_query_question_id` | error | §10.2 |
| `envelope_has_parent_id` | error | §8 / §18.4.1 |
| `envelope_not_at_line_1` | error | §8 / §18.4.1 |
| `envelope_sessions_manifest_drift` | warning | §8.4 / §18.4.2 |
| `events_before_first_session_header` | error | §9.6 / §18.4.1 |
| `header_has_parent_id` | error | §9 / §18.4.1 |
| `ill_formed_string` | error (strict), warning (reader-tolerant) | §5.2 / §18.4.1 |
| `missing_header` | error | §9 / §18.4.1 |
| `missing_header_after_envelope` | error | §8 / §18.4.1 |
| `multiple_envelopes` | error | §8 / §18.4.1 |
| `non_interoperable_number` | warning | §5.2 / §18.4.2 |
| `non_monotonic_event_ts` | warning | §18.4.2 |
| `out_of_order_segment_seq` | warning | §9.5 / §18.4.2 |
| `out_of_order_session_headers` | warning | §9.6.6 |
| `parent_cycle` | error | §13.2 / §18.4.1 |
| `parse_fidelity_drift` | error | §9.2 / §18.4.1 |
| `reader_tolerant_schema_version` | warning | §6 / §18.2 |
| `reader_tolerant_unknown_payload_field` | warning | §18.2 |
| `reader_tolerant_unknown_record` | warning | §18.2 |
| `segment_chain_break` | warning | §9.5 |
| `source_raw_envelope_ref_unresolved` | error | §10.7 / §18.4.1 |
| `source_raw_unredacted_secret` | warning | §15.1 / §18.4.2 |
| `stream_open_with_content_hash` | warning | §18.4.3 |
| `stream_open_with_terminal_event` | warning | §18.4.3 |
| `tool_args_unredacted_secret` | warning | §16 / §18.4.2 |
| `tool_result_semantic_conflict` | warning | §10.5 / §18.4.2 |
| `unknown_abandoned_branch_id` | warning | §10.3 / §18.4.2 |
| `unknown_branch_point_from_id` | warning | §10.3 / §18.4.2 |
| `unknown_final_message_id` | warning | §10.3 / §18.4.2 |
| `unknown_parent_id` | error | §10.1 / §18.4.1 |
| `unknown_user_query_answer_key` | error | §10.2 |
| `unknown_user_query_for_id` | warning | §10.2 / §18.4.2 |
| `unmatched_tool_call_at_eof` | warning | §10.5 / §18.4.2 |
| `vcs_remote_url_with_credentials` | warning or error | §9.2 / §18.4 |
| `vcs_revision_divergence` | warning | §9.6.6 |

#### Conformance suite (non-normative)

The repository publishes a versioned validation conformance suite with the schema package. The canonical corpus lives under `tests/fixtures/validation/` and is mirrored into the `@agent-trail/schema` package under `conformance/`.

The suite manifest uses three assertion tiers:

- Writer-strict validity verdicts and reader-tolerant cleanliness outcomes for every fixture.
- Portable diagnostic assertions (`severity`, `code`, `line`, `path`) only for spec-named diagnostic codes.
- Line-only assertions for schema-layer failures, because JSON Schema validator keyword vocabularies are implementation-specific.
- Class tags (`classes`) marking which conformance classes each fixture applies to. Validation fixtures use `W`, `R1`, and `R2`; R0 renderer conformance needs a separate rendering suite.

### 18.4 File graph checks

A v0.1.0-compliant trail file MUST also pass whole-file checks.

#### 18.4.1 Errors

1. The first line is either a trail envelope (`type: "trail"`, §8) or a session header (`type: "session"`, `schema_version: "0.1.0"`). When the envelope is present, the session header MUST occupy line 2.
2. Subsequent lines match an event schema (`type`, `id`, `ts`, `payload`).
3. All `id` values are unique within the file.
4. Every non-null `parent_id` references an `id` in the same file.
5. The `parent_id` graph is acyclic.
6. Writer timestamps are valid UTC `Z` ISO-8601 values with millisecond precision. Readers MAY tolerate broader ISO-8601 timestamps.
7. All string values are well-formed: no unpaired high or low surrogate code units. Violations are `ill_formed_string` diagnostics at the offending JSON Pointer. Strict validation reports an error; reader-tolerant validation reports a warning and does not repair the value.

If `content_hash` is present:

1. The value is 64 hex characters (SHA-256). Invalid hash shape emits `content_hash_invalid` at `/content_hash`.
2. Strict validators recompute and verify per §7.3. On mismatch, strict validation fails with `content_hash_mismatch` at `/content_hash`. Reader-tolerant parsers MAY warn but MUST NOT abort.

Additional whole-file errors:

- `parse_fidelity`, when present, MUST match the session group's entries (§9.2). Drift emits `parse_fidelity_drift` at the mismatched `parse_fidelity` field.
- A `user_query` question id MUST be unique within that query. Duplicate ids emit `duplicate_user_query_question_id` at the repeated question id.
- A `user_query_response.payload.answers` key not present in the resolved `user_query.payload.questions[].id` set emits `unknown_user_query_answer_key` at that answer key.
- `source.raw.envelope_ref`, when set, MUST reference the `id` of an earlier entry in the same file (§10.7). Dangling or forward references are errors with code `source_raw_envelope_ref_unresolved` at `/source/raw/envelope_ref`.
- Trail envelope position and uniqueness (§8):
  - `envelope_not_at_line_1` (error): a `type:"trail"` record appears on a line other than line 1.
  - `multiple_envelopes` (error): more than one envelope appears in the file.
  - `missing_header_after_envelope` (error): an envelope at line 1 is not followed by a session header on line 2.
  - `envelope_has_parent_id` (error): the trail envelope carries a `parent_id`.

#### 18.4.2 Warnings

- Each `tool_call.id` SHOULD be referenced by exactly one `tool_result.payload.for_id` (or paired via §10.5).
- Inline `subagent_invoke` events SHOULD have descendants in the same group, or external child invocations SHOULD set `args.session_id` to the child header `id` when known.
- When an in-file child session is present, the parent `subagent_invoke.args.session_id` and child `header.fork_from.{session_id,entry_id}` SHOULD agree. Mismatches are warnings, not errors, so partial bundles and external-only references remain readable.
- `branch_point.payload.from_id` SHOULD reference a prior event in the same session group. A dangling or forward reference emits `unknown_branch_point_from_id` at `/payload/from_id`.
- `branch_summary.payload.abandoned_branch_id` SHOULD reference a prior event in the same session group. A dangling or forward reference emits `unknown_abandoned_branch_id` at `/payload/abandoned_branch_id`.
- Writers SHOULD emit `session_terminated` if any `tool_call` remains unmatched at EOF. The warning code is `unmatched_tool_call_at_eof`. Suppression:
  - A `session_end` event anywhere in the file suppresses this warning for every unmatched `tool_call` (clean conclusion, §10.3).
  - A `session_terminated` event whose `payload.open_call_ids` lists a given `tool_call.id` suppresses the warning for that id only (explicit acknowledgement). A `session_terminated` event without `open_call_ids` does not suppress the warning.
- A `tool_result` paired by sequential fallback when two or more unmatched prior same-branch `tool_call` candidates existed emits `ambiguous_sequential_pairing` at `/payload`.
- A `user_query` question with duplicate option labels among options that do not carry stable option ids emits `duplicate_option_labels` at the repeated option's `/payload/questions/<index>/options/<index>/label`.
- `user_query_response.payload.for_id` SHOULD reference a `user_query` in the same session group. An unresolved reference emits `unknown_user_query_for_id` at `/payload/for_id`.
- `session_end.payload.final_message_id`, when present, SHOULD reference an `id` that appears in the same file (the session header or a prior event). A dangling reference is a warning with code `unknown_final_message_id` at `/payload/final_message_id`.
- An event's `ts` SHOULD NOT be earlier than its parent event's `ts` inside the same parent chain. Equal timestamps are allowed; sibling branches may interleave in wall-clock time. A strictly earlier child timestamp emits `non_monotonic_event_ts` (warning) at `/ts`.
- Validators MAY report implementation-defined size budgets for `source.raw`; specific numbers are writer policy (§15.1).
- `source.raw` SHOULD NOT contain unredacted credentials. A string leaf matching a known credential pattern emits `source_raw_unredacted_secret` (warning) at the matching JSON pointer.
- JSON integer numbers outside the IEEE-754 exact-integer range SHOULD be emitted as strings. Unsafe integer numbers emit `non_interoperable_number` (warning) at the offending JSON Pointer.
- Privacy-sensitive tool arguments SHOULD NOT contain unredacted credentials. A string leaf in `mcp_call` / `web_fetch` `tool_call.payload.args.headers` or `shell_command` `tool_call.payload.args.command` matching a known credential pattern emits `tool_args_unredacted_secret` (warning) at the matching JSON pointer.
- `envelope_sessions_manifest_drift` (warning): the envelope's `sessions` manifest length disagrees with the number of session groups, or a manifest entry disagrees with the matching session header's `id` or `agent.name`.
- Multi-segment consistency within one file (§9.5):
  - `duplicate_segment_seq` (warning): two groups share the same `(session_uid, segment.seq)` pair, treating missing `segment` as `seq: 1`.
  - `out_of_order_segment_seq` (warning): groups with the same `session_uid` appear with descending `segment.seq` in file order.

#### 18.4.3 Streaming-state rules

Streaming rules (§9.4) are evaluated against the *current* header `stream.state` at validation time — the validator reads the present value, not a history of transitions. Crash-recovery writers MUST finalize (`stream.state` to `"closed"` or remove `stream`) before appending terminal events; once the stream is no longer marked live, the rules below stop applying.

10. If the current `header.stream.state == "open"`:
   - **10a.** `content_hash` SHOULD be absent or `"<pending>"`. A populated hex hash is a warning, since the canonical bytes are still in flux.
   - **10b.** Terminal events (`session_end`, `session_terminated`) SHOULD NOT appear. A terminal event in a file whose current `header.stream.state == "open"` is a warning — the writer claims the stream is still open but has already emitted a terminal event. Finalize the header (set `stream.state` to `"closed"` or remove `stream`) before appending terminal events.
11. If the current `header.stream.state == "closed"` or `stream` is absent, finalized artifacts SHOULD populate `content_hash`. Readers MAY warn but MUST NOT abort when it is missing on otherwise complete files. Trail files produced by stream-unaware writers, or files appended across crashes and recoveries, MAY contain both `session_end` and `session_terminated` legitimately; rule 10b does not apply once the stream is no longer marked live.

---

