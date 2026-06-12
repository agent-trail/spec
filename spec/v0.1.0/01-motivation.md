## 1. Motivation

Engineers using multiple coding agents lose continuity between them. A debugging session in Claude Code is invisible from Cursor; an Aider conversation can't be shared with a colleague using Pi. Each tool stores sessions in its own format, and tools that try to bridge them re-implement the same parsing work.

Agent Trail defines a portable file format for coding agent sessions, so any compliant tool can read and share sessions produced by any other.

---

