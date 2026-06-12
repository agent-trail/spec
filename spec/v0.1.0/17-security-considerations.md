## 17. Security Considerations

Trail files are untrusted input. All string content, including messages, tool output, file paths, URIs, agent names, titles, and source metadata, can be attacker-controlled. Renderers SHOULD escape HTML, SHOULD NOT execute or auto-open rendered Markdown links, and CLI viewers SHOULD sanitize terminal control sequences before writing text to a terminal.

Agent Trail intentionally has no format-level size caps. Consumers SHOULD enforce deployment-specific limits for maximum line length, file size, event count, graph depth, and decoded attachment or overflow bytes. Consumers SHOULD stream rather than buffer whole files where possible; JSONL is the interchange shape partly to make bounded streaming readers practical.

Hostile files can contain invalid graph structure even though `parent_id` cycles and cross-group links are invalid (§13, §18.4). Validators MUST NOT loop indefinitely while checking graph topology, and tree renderers SHOULD bound recursion or use iterative traversal when displaying deep parent chains.

`content_hash` provides byte integrity for the canonical artifact (§7.3, §7.4), not authorship, provenance, or trust. A trail claiming `agent.name: "claude-code"` proves only that the file contains that string. Agent Trail v0.1.0 has no signature or attestation mechanism; signing MAY be added by a future extension.

In v0.1.0, `content_hash` values are bare 64-character SHA-256 hex strings (§7.3). Other content-addressed references, such as attachment URIs (§10.2) and `overflow_ref` values (§15), use `sha256:<hex>` references. Consumers that verify prefixed content-addressed references MUST reject unknown algorithm prefixes rather than treating the reference as verified.

Attachment URIs and overflow references can identify local resources on the producer's machine. Viewers SHOULD NOT dereference `file:` URIs, `overflow_ref` values, or other external references automatically. Viewers MUST NOT dereference local `file:` URIs or non-`sha256:` overflow references from redacted or shared trails; §16 requires share-time redactors to remove or rewrite those values before transport.

Redaction reduces content exposure but does not make a shared trail private. Timestamps, event counts, tool names, model names, branch shape, unredacted file names, and remaining metadata can still reveal workflow information. Sharing a redacted trail SHOULD be treated as publishing it to anyone who can access the transport.

Header fields need the same privacy review as event payloads. `cwd`, `vcs.remote_url`, `vcs.worktree`, `name`, `description`, and `tags` commonly contain usernames, internal hostnames, private repository names, or project identifiers. Sharing tools SHOULD scan headers and trail envelopes as well as event payloads (§16).

The implementation-maintained detector catalog and rule pack schema live in `docs/redaction-patterns.md`; this catalog is non-normative and does not change the trail file format.

---

