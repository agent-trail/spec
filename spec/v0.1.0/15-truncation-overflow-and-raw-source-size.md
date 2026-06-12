## 15. Truncation, overflow, and raw source size

Writers MAY truncate large `tool_result` outputs to keep trails tractable. The wire format records truncation with three fields on `tool_result.payload`:

| Field | Type | Notes |
|---|---|---|
| `truncated` | boolean | `true` when `output` was shortened from its original length |
| `output_size` | integer ≥0 | UTF-8 byte length of the original output before truncation; REQUIRED when `truncated` is true |
| `overflow_ref` | string or null | optional content-addressed reference to the full output (`sha256:<64 lowercase hex>`); colocated blob storage is implementation-defined |

Specific inline-size thresholds, the truncation algorithm (e.g., head-only, head-and-tail, line-aligned), and the choice of overflow storage are writer policy and belong in writer documentation, not the format.

Tool call arguments use the same top-level marker on `tool_call.payload`:

| Field | Type | Notes |
|---|---|---|
| `truncated` | boolean | `true` when `args` was shortened from its original object |
| `args_size` | integer ≥0 | UTF-8 byte length of the JCS-serialized original `args` object before truncation; REQUIRED when `truncated` is true |
| `overflow_ref` | string or null | optional content-addressed reference to the full args object (`sha256:<64 lowercase hex>`) |

The marker applies to the `args` object as a whole. Individual arg strings keep their declared per-toolkind shape, just shortened. Specific thresholds and algorithms remain writer policy.

`source.raw` is optional. Writers SHOULD omit or summarize very large or sensitive raw source objects when they would make trail files unwieldy or unsafe. Share tools MUST inspect `source.raw` during redaction before producing a shared artifact.

### 15.1 `source.raw` elision and redaction

Writers MAY elide all or part of a `source.raw` value when it is unwieldy or unsafe to inline. Elision uses a single wire-format marker, in place of either the entire `source.raw` or any nested string leaf:

```jsonc
{ "elided": true, "size_bytes": 41208 }
```

| Field | Type | Notes |
|---|---|---|
| `elided` | boolean `true` | sentinel; readers detect elided regions by this field |
| `size_bytes` | integer | UTF-8 byte length of the elided original (informational; readers MAY use it for display or budgeting) |

Two placements are valid:

- **Whole-value elide:** `source.raw` itself is the marker. The original envelope is fully omitted; only its byte size is recorded.
- **Leaf elide:** any nested string is replaced with the marker. The envelope's structural skeleton (ids, parent refs, role, timestamps, block kinds) stays intact; only the bulky string body is removed.

Specific size thresholds, the algorithm a writer uses to choose which leaves to elide, and whether elision is gated by a hard cap are implementation policy — they belong in writer documentation, not the format. Validators MAY warn on entries whose `source.raw` exceeds an implementation-chosen size budget, but the wire format itself imposes no fixed limit.

When elision happens at the first emission of a source envelope (§10.7), subsequent `envelope_ref` entries still resolve — the ref points at the elided entry's `id`, not at its inlined envelope.

Adapters MUST redact known secret patterns in `source.raw` before writing — emission-time redaction is a writer responsibility, not a share-time concern. Validators emit `source_raw_unredacted_secret` (warning) when a string leaf in `source.raw` matches a known credential pattern (Authorization headers, Bearer tokens, JWT, vendor API keys, PEM private key blocks, ENV-style assignments). Share-time redaction (§16) layers additional normalization on top — paths, PII — and produces a separate artifact.

---

