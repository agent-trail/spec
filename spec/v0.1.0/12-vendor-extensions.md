## 12. Vendor extensions

Implementations and vendors can add custom data via the `meta` field on the trail envelope, session header, or any event entry. Use the `x-<vendor>/<name>` extension grammar (§12.1) for keys to avoid collisions:

```jsonc
"meta": {
  "x-cursor/workspace_id": "ws-abc123",
  "x-example/custom_flag": true,
  "x-anthropic/usage": { "input_tokens": 1234, "output_tokens": 567 }
}
```

Readers MAY preserve, ignore, or render `meta` fields. They MUST NOT abort on unknown keys.

`entry.meta.redaction_count` is a standard optional non-negative integer convention for redacted artifacts. It counts how many redactor mutations were applied to that entry; see §16.

The `meta` field is for fields outside the canonical vocabulary. For verbatim source-event preservation, use `source.raw` ([§15.1](./15-truncation-overflow-and-raw-source-size.md#151-sourceraw-elision-and-redaction)) instead. See [§8.3](./08-the-trail-envelope.md#83-the-meta-extension-convention) for the full convention.

### 12.1 Extension grammar

One extension grammar is used across extension surfaces: `x-<vendor>/<name>`.

- `vendor`: lowercase alphanumeric with optional hyphen-separated segments, e.g. `acme` or `acme-labs`.
- `name`: starts with lowercase alphanumeric and MAY contain lowercase alphanumeric, `_`, or `-`.

| Surface | Applies to | Example |
| --- | --- | --- |
| Envelope `meta` keys | Trail-level vendor annotations | `x-acme/build_id` |
| Header `meta` keys | Session-level vendor annotations | `x-acme/team` |
| Entry `meta` keys | Event-level vendor annotations | `x-acme/run_id` |
| `system_event.kind` | Non-reserved source signals | `x-claudecode/notification` |
| Enum extensions | Descriptive state vocabulary: `scope`, `reason`, `trigger`, `result_action`, `command_invoke.kind`, `command_invoke.via`, `session_metadata_update.field`, `vcs.type`, `user_message.origin` | `x-acme/custom_scope` |
| `tool_result.payload.meta` vendor keys | Sibling keys under registered tool-kind output objects | `meta.mcp_call.x-acme/cache_hit` |
| Custom `agent.name` | Unregistered source agents | `x-example/myagent` |

Structural discriminators, including event `type`, delta `kind`, attachment `kind`, and `taskPlanStatus`, stay closed. Descriptive state vocabulary is extensible through the grammar above.

---

