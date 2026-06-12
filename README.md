# Agent Trail Spec

Open interchange format contract for coding-agent session trails.

This repository contains the Agent Trail specification, JSON Schema artifacts, fixtures, and format ADRs.

## Repository Map

- [`spec/v0.1.0/`](./spec/v0.1.0/) - frozen v0.1.0 specification content split by major section.
- [`spec/draft/`](./spec/draft/) - current draft specification content.
- [`spec.md`](./spec.md) - compatibility index for legacy monorepo `spec.md` anchors.
- [`schema/v0.1.0.json`](./schema/v0.1.0.json) - frozen v0.1.0 JSON Schema artifact.
- [`schema/draft.json`](./schema/draft.json) - current draft JSON Schema artifact.
- [`fixtures/validation/`](./fixtures/validation/) - validation conformance fixture corpus and manifest.
- [`docs/GLOSSARY.md`](./docs/GLOSSARY.md) - shared terminology for public format discussions.
- [`docs/adr/`](./docs/adr/) - format ADRs carried forward for the spec repo.

## Related Repositories

Agent Trail is split across focused repositories:

- [agent-trail/spec](https://github.com/agent-trail/spec) - format contract, JSON Schema, fixtures, and format ADRs.
- [agent-trail/typescript-sdk](https://github.com/agent-trail/typescript-sdk) - TypeScript packages for Agent Trail files.
- [agent-trail/cli](https://github.com/agent-trail/cli) - command-line tools for Agent Trail workflows.
- [agent-trail/web](https://github.com/agent-trail/web) - docs site and shared trail web viewer.

## Development

```sh
mise run setup
mise run check
```

See `CONTRIBUTING.md` for workflow and PR expectations.

## License

Apache-2.0. See `LICENSE`.
