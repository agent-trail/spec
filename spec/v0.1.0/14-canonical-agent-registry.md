## 14. Canonical agent registry

Lowercase, hyphenated:

`claude-code`, `pi`, `openclaw`, `codex-cli`, `cursor`, `opencode`, `aider`, `amp`, `cline`, `crush`, `kimi-code`, `qwen-code`, `factory`, `vibe`, `copilot-cli`, `copilot-chat`, `chatgpt`, `clawdbot`.

The registry reserves canonical names. It does not imply adapter support.

New agents MAY be added by amending this spec. Until registered, adapters MAY use a custom `x-<vendor>/<name>` agent name (e.g., `x-example/myagent`) to reduce collisions while keeping the vendor and agent name parseable.

---

