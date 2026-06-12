## 16. Redaction

The raw file format does not mandate redaction. Sharing tools produce a separate redacted artifact before upload. Raw and redacted artifacts have different `content_hash` values.

A complete redaction protocol is out of scope for the file format; it belongs to share tooling. Redacted artifacts MAY record `redacted_from.content_hash` to link back to the raw artifact without exposing local paths or raw local IDs.

Share-time redactors MUST apply the privacy rules below before producing shared artifacts. They MAY normalize a field instead of deleting it only when the normalized value no longer exposes raw local paths, raw local session identifiers, credentials, or private repository identity.

| Field or value | Share-time action |
|---|---|
| `cwd` | Normalize or strip. |
| `vcs.remote_url` | Strip or normalize per §9.2 unless the user explicitly opts in. |
| `system_event.payload.data.repo` for `vcs_commit` | Treat like `vcs.remote_url`; strip or normalize unless the user explicitly opts in. |
| `vcs.worktree.path`, `vcs.worktree.original_cwd` | Normalize or strip. |
| `source.path` | Normalize or strip. |
| `attachments[].uri` | Remove or rewrite local `file:` URIs. Rewrite to `sha256:<hex>` only when the referenced blob is content-addressed and transported with the share; otherwise remove `uri` and keep visible stub metadata such as `kind`, `name`, and `media_type`. |
| `tool_result.payload.overflow_ref` | Keep `sha256:` references when useful; strip every other scheme or implementation-local reference. When stripped, keep `truncated` and `output_size` unchanged. |
| `tool_call.payload.args.headers` for `mcp_call` and `web_fetch` | Strip or replace credential-bearing values with placeholders. |
| `name`, `description`, `tags`, message text, output strings, and `meta` string leaves | Scrub secret patterns and PII according to the redactor's configured policy. |

Redactors MUST resolve each `user_query_response.payload.for_id` to a `user_query` in the same session group before preserving answers for questions marked `is_secret`. If the query is unresolvable, the redactor MUST strip the response's `answers` entirely (fail closed).
If a resolved response contains answer keys that do not appear on the referenced `user_query`, the redactor MUST strip those unknown answers and any raw source payload for that response.

Share-time redactors SHOULD populate `entry.meta.redaction_count` on each changed event entry. The count is a non-negative integer equal to the number of redactor mutations applied to that entry. Existing numeric `redaction_count` values are additive when a redacted trail is redacted again; unchanged entries keep their existing value.

When redaction changes bytes, lineage hashes are updated as described in §9.6.7. This prevents redacted session bundles and redacted segment chains from retaining raw-artifact hashes that can no longer verify against the shared redacted bytes.

Specific secret patterns, exact PII detectors, path-normalization strings, image preview behavior, token-usage policy, blob upload mechanics, and share workflow remain implementation semantics.

---

