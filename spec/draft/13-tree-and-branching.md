## 13. Tree and branching

### 13.1 When to emit `parent_id`

`parent_id` represents tree topology, not ordinary linear sequencing. Linear sessions use file order. Tool call/result pairing uses `tool_result.payload.for_id` and `semantic.call_id`, not `parent_id`.

Writers SHOULD emit `parent_id` only when source data contains branch, fork, or inline child-event topology that can be mapped to Agent Trail event ids.

`parent_id` is intra-group topology only. It MUST NOT span session groups. When source data stores a spawned or forked transcript as a separate session, use a child session with `header.fork_from` instead of cross-group `parent_id`.

Reader display policies for linear and tree-aware renderers are implementation semantics, not wire-format rules.

### 13.2 Acyclicity

The `parent_id` graph MUST be acyclic. The header isn't part of the graph; nothing references it via `parent_id`.

---

