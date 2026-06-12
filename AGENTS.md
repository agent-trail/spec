# Agent Instructions

This repo owns the Agent Trail format specification, schema artifacts, fixtures, and format ADRs.

## Workflow

- Start from the linked Linear issue or maintainer direction.
- Keep changes scoped to this repo's public spec, schema, fixture, or documentation surface.
- Do not add implementation-only contracts to the format spec.
- Do not commit real local sessions, secrets, credentials, private logs, or unredacted user data.

## Commands

- Use `mise run setup` for local tool and hook setup.
- Use `mise run check` before opening or updating a pull request.
- Use `mise run check:actions` after editing GitHub Actions workflows.

## Dependencies and Tools

- Before introducing a package, tool, or GitHub Action, check the latest upstream stable version and use it unless there is a documented reason not to.

## Pull Requests

- Use `.github/PULL_REQUEST_TEMPLATE.md`.
- Link the Linear issue.
- State public spec, schema, fixture, or docs impact.
- Include exact verification commands and results.
