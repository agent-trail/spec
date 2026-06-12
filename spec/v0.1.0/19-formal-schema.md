## 19. Formal schema

The normative writer-strict JSON Schema lives in `schema.json` and is published at `https://agent-trail.dev/schema/v0.1.0.json`.

This spec intentionally does not duplicate the full schema inline. Implementations SHOULD validate each JSONL line against `schema.json`, then run the whole-file checks in [§18.4](./18-validation.md#184-file-graph-checks). Reader-tolerant parsing, including unknown future event preservation, is separate from writer-strict schema validation.

---

