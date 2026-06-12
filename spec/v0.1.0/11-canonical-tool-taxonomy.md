## 11. Canonical tool taxonomy

The `tool_call.payload.tool` field uses these values. Each defines the expected shape of `args`.

| Name | Args |
|---|---|
| `file_read` | `{ path, range? }` |
| `file_write` | `{ path, content }` |
| `file_edit` | `{ path, diff }` (unified diff) or `{ path, old, new, replace_all? }` |
| `file_patch` | `{ files: [{ path, diff }], atomic? }` |
| `file_list` | `{ path, recursive?, glob? }` |
| `file_search` | `{ query, path?, glob? }` |
| `shell_command` | `{ command, cwd?, timeout? }` |
| `shell_output` | `{ command_id? }` |
| `shell_input` | `{ input, session_id?, command_id? }` |
| `mcp_call` | `{ server, tool, args?, headers? }` |
| `web_fetch` | `{ url, method?, headers? }` |
| `web_search` | `{ query }` |
| `tool_search` | `{ query, limit? }` |
| `notebook_edit` | `{ path, cell_id?, diff?, content? }` |
| `subagent_invoke` | `{ task, agent_type?, session_id? }` |
| `other` | `{ name, args? }` |

Checklist and plan snapshots use `task_plan_update` ([§10.2](./10-events.md#102-mandatory-event-types)) rather than `tool_call`.

### 11.1 `file_edit`

`file_edit` has two exclusive argument forms:

- `{ path, diff }` where `diff` is a unified diff.
- `{ path, old, new, replace_all? }` for sources that record only string replacement with no line context.

Writers MUST prefer the diff form when a real unified diff is derivable from source data. Writers MUST NOT fabricate hunk headers to fake the diff form.

The `diff` form uses a unified diff:

```diff
--- a/src/main.ts
+++ b/src/main.ts
@@ -1,4 +1,4 @@
 unchanged
-removed
+added
 unchanged
```

Writers with native before/after content MUST convert to a diff before emitting. Writers that synthesize the edit from indirect source data set `source.synthesized: true`.

### 11.2 `file_patch`

Use `file_patch` when one source tool call represents a patch touching one or more files, and
single-file `file_edit` would either lose the call's multi-file grouping or force consumers to
reconstruct it from synthesized sibling calls. Each `files[]` entry carries the affected `path` and a
per-file unified diff. Writers that split source-native patch text into per-file hunks SHOULD add
`---` and `+++` file headers when the source omits them, so generic consumers can render each file
without parsing the source-native patch envelope. For renames, `path` is the destination path and the
diff headers carry both source and destination paths. Set `atomic: true` when the source represented
the patch as one operation.

### 11.3 `file_list`

Use `file_list` when the agent inspected a directory or file tree. The result's display listing
lives in the matching `tool_result.payload.output`. Do not map directory listing to
`shell_command` unless the source only records a literal shell command.

### 11.4 `shell_command`

Full command in `command`; output in the corresponding `tool_result.payload.output`. Redactors SHOULD scrub env vars, `Authorization` headers in piped curls, etc.

### 11.5 `mcp_call`

- `server` — MCP server identifier (e.g., `github`, `linear`).
- `tool` — tool name within that server.
- `headers` — SHOULD be redacted before writing: `Authorization`, `X-API-Key`, `Cookie`, `Bearer ...`.

### 11.6 `subagent_invoke`

Indicates a child conversation was spawned. Two cases:

- **Inline subtree:** when the source stores child events inline in the same session, child events use this event's `id` as their root `parent_id`.
- **External child session:** when the source stores the child as a separate transcript, set `args.session_id` to the child session header `id`. The child MAY appear as a sibling group in the same session bundle or as an external trail. Do not use a content hash or source runtime id in `args.session_id`.

When the external child appears in the same file, the child header SHOULD set `fork_from.session_id` to the parent session header `id` and `fork_from.entry_id` to the parent `subagent_invoke` event `id`. `fork_from.content_hash` is optional best-effort and refers to the parent session-level content hash.

### 11.7 The `other` escape hatch

For tools not covered above, use `tool: "other"` with `args: { name, args? }`. Readers render generically. These don't participate in cross-agent comparison.

---

