# Trail envelope and two-tier identity

## Status

Accepted.

## Decision

A trail file may carry file-level concerns on an optional `type:"trail"` record at line 1. This record is the trail envelope. It carries file-level metadata, file label, file-scope hash, optional sessions manifest, and extensions instead of overloading the session header.

When the envelope is absent, behavior is unchanged. When present, the session header follows on line 2, and at most one envelope is allowed per file. This decouples file scope from session scope and reserves the structural slot for session bundles.

Identity is two-tier:

- Session-level `content_hash` lives on the session header and covers only the session header and its events.
- File-level `content_hash` lives on the trail envelope and covers the whole file with the envelope's `content_hash` pinned to `<pending>`.

Writers stamp the session hash first, then the file hash. Transport tooling verifies the file hash. Extraction tooling recomputes the session hash. Both use the same canonicalization rules as the spec content-addressing section.

## Considered Options

- Add file-level fields to the session header. Rejected because it conflates file scope and session scope.
- Introduce a sidecar metadata file beside each trail. Rejected because it breaks the single-file invariant.
- Adopt an optional envelope record at line 1 with two-tier identity. Chosen.

## Consequences

- The schema admits trail envelopes as a first-class record shape.
- Validation dispatches by record type and whole-file position rules.
- Envelope fields are file-level metadata and are not part of the event graph.
- Session hashes remain stable when a session group is extracted from a wrapping file.
- File hashes cover wrapping metadata and the contained session groups.
- The earlier single-session manifest constraint is superseded by ADR-0005's session-bundle model.
