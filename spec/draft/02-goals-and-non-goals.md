## 2. Goals and non-goals

### Goals

- Map common coding agents to one canonical event vocabulary with acceptable fidelity (~70%+ semantic fit on average across supported agents).
- Renderable in a generic viewer with no source-agent code.
- Searchable with standard text tooling.
- Trivially streamable, line by line.
- Trivially versionable, with graceful reader degradation.
- Content-addressable for safe sharing and deduplication.

### Non-goals

- Replacing agents' native storage formats.
- Bit-perfect reproduction of source sessions. Use `source.raw` if needed.
- Encoding model internals (logits, sampling parameters, tokens).
- Cryptographic signing (deferred).
- Cross-segment `parent_id` references (deferred).
- Real-time bidirectional sync between agents.

Deferred format surfaces:

- A structured message-parts model for mixed human-authored and injected `user_message` content.
- Inline `data:` attachment payloads; v0.1.0 attachment `uri` values are references only.

---

### 2.1 Conformance and normativity

The normative Agent Trail contract is this specification plus `schema.json`.
`schema.json` is the canonical writer-strict machine-readable contract through
v1.0.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "SHOULD NOT", and "MAY"
are to be interpreted as described in BCP 14 when, and only when, they appear in
all capitals.

Examples, notes, rationale, implementation guidance, adapter mappings, reader
display choices, CLI behavior, store layout, and redaction workflow are
non-normative unless explicitly stated otherwise. Implementation guidance lives
in `docs/implementation-semantics.md`.

---

