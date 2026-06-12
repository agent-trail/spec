# schema.json is the format contract

## Status

Accepted.

## Decision

Agent Trail is a language-neutral interchange format, so `schema.json` is the canonical machine-readable contract through `1.0.0`.

TypeScript types, validators, examples, and other generated artifacts derive from the schema rather than becoming separate sources of truth. This keeps non-TypeScript adopters from depending on implementation internals.

## Considered Options

- Keep `schema.json` canonical and derive implementation artifacts from it.
- Make TypeScript types canonical and derive `schema.json`.
- Maintain schema and TypeScript types separately with parity checks.

## Consequences

- Schema changes are the authoritative review surface for machine-readable format changes.
- Generated artifacts must not introduce behavior that is absent from the schema and spec prose.
- Hosted schema URLs for released versions remain immutable release snapshots.
