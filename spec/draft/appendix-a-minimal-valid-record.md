## Appendix A — Minimal valid record

```jsonl
{"type":"session","schema_version":"0.1.0","id":"01HSESS0000000000000000001","ts":"2026-05-17T14:00:00.000Z","agent":{"name":"codex-cli"}}
```

A session with only a header is valid. Events are optional.

### Appendix A.1 — Minimal valid record with trail envelope

```jsonl
{"type":"trail","schema_version":"0.1.0","id":"00000000-0000-0000-0000-000000000001","ts":"2026-05-17T14:00:00.000Z","producer":"trail-cli/0.3.0"}
{"type":"session","schema_version":"0.1.0","id":"01HSESS0000000000000000001","ts":"2026-05-17T14:00:00.000Z","agent":{"name":"codex-cli"}}
```

An envelope at line 1 followed by a session header at line 2 is valid. Events are optional.

