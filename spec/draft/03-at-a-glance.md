## 3. At a glance

The smallest valid Agent Trail file:

```jsonl
{"type":"session","schema_version":"0.1.0","id":"01HSESS0000000000000000001","ts":"2026-05-17T14:00:00.000Z","agent":{"name":"codex-cli"}}
{"type":"user_message","id":"01HEVTA0000000000000000001","ts":"2026-05-17T14:00:05.000Z","payload":{"text":"hello"}}
{"type":"agent_message","id":"01HEVTA0000000000000000002","ts":"2026-05-17T14:00:07.000Z","payload":{"text":"hi"}}
```

Line 1 is the header. Lines 2 and on are events. Everything else is optional structure layered on top.

---

