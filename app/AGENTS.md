# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`fumadocs-routes` is a Node.js CLI and library, published to npm. It reads the `private` flags in a [Fumadocs](https://github.com/fuma-nama/fumadocs) `content/docs` folder (`meta.json` for folders, frontmatter for pages) and writes `docs-routes.json` with `sections`, `section_labels`, `private_sections`, `public_exceptions` and `private_pages`. The output is a lightweight JSON file, intended for a Fumadocs project's `proxy.ts` to import and use for redirects, so keep it small and flat. The [Output](#output) and [Validation](#validation) sections below are the spec.

Fumadocs has no `private` field by default. Consuming projects add it by extending `pageSchema`/`metaSchema` in their `source.config.ts` with `private: z.boolean().default(false)`.

This directory (`/opt/app`, called `app/` in the README) is a **subfolder of a root project**. The root holds the Docker Compose files, so run `docker compose` from the root and `npm` from here.

## Tech Stack

- **Node >= 24** (`.nvmrc`: 24.11.0), ESM (`"type": "module"`)
- **TypeScript 6** (strict, `noUncheckedIndexedAccess`, `module`/`moduleResolution`: `NodeNext`), built with `tsc` + `tsc-alias`
- **js-yaml**: the only runtime dependency (frontmatter parsing)
- **ESLint 10** flat config (`eslint.config.mjs`) with `typescript-eslint`. `eslint-plugin-import` is not installed (it does not support ESLint 10), so import order and spacing are not linted. There is no Prettier: ESLint enforces the formatting.
- **Vitest 5** with v8 coverage and `@vitest/ui` (config in `vite.config.ts`)
- **Docker** (optional): multi-stage `Dockerfile` with `development`, `build` and `production` targets

## Commands

Run from this directory (Node >= 24):

```sh
npm run verify           # lint + types:check + test (must pass, with build, before a change is done)
npm run build            # tsc -p tsconfig.prod.json && tsc-alias → dist/
npm run routes:generate  # Run the BUILT CLI (dist/) on content/docs → docs-routes.json. Pass options after --
npm run routes:check     # Same as routes:generate, with --strict
npm run types:check      # tsc --noEmit (includes tests)
npm run lint             # ESLint on src/**/*.ts and *.mjs
npm run lint:fix
npm test                 # vitest run, with coverage. Writes HTML reports to .vitest/
npm run dev              # vitest watch mode
npx tsx src/scripts/<file>.ts   # Run a TS file without building
```

`routes:generate`, `routes:check` and `npm start` run `dist/`, so run `npm run build` first or they use stale code.

Docker-only scripts (`docker:*`, `:win` = Windows WSL2 polling variants) are listed in the README. Setting `IS_DOCKER` makes the CLI and `sample.ts` wait 5 seconds before running.

## Architecture

- `src/scripts/generate/cli.ts` is the `bin` entry. It parses `--docs/-p`, `--output/-o` and `--strict`, then calls `generate()`.
- `src/scripts/generate/main.ts` `generate()` builds a `GeneratorContext` (`Diagnostics`, `Reader`, `RoutesCollection`, `contentDir`, `strict`), runs `collectSections()` (`lib/section.ts`) and then `walk()` (`lib/walk.ts`), and writes the JSON.
- `src/index.ts` holds the package's public exports. When you add or rename a public API, update it and the README's "From code" section.
- **Error handling**: `Reader` and the collectors never throw on bad content. They call `diagnostics.addError()`/`addWarning()`. `generate()` prints everything at the end and throws if there were any errors. The CLI catches that and exits 1. Keep this pattern.
- **Deterministic output**: `RoutesCollection.toJSON()` sorts and deduplicates every list. Directory reads are sorted too.

## Layout

```text
content/docs/                     # Sample input, default --docs
src/
├── index.ts                      # Package exports
├── lib/
│   ├── classes/
│   │   ├── diagnostics.ts        # Collects and prints warnings/errors
│   │   ├── reader.ts             # Reads meta.json and frontmatter
│   │   └── routes.ts             # Accumulates and sorts the lists
│   ├── constants.ts              # Paths, regexes, flags
│   ├── section.ts                # Builds sections and section_labels
│   ├── types.ts                  # Shared types
│   ├── utils.ts                  # Small helper utility functions
│   └── walk.ts                   # Builds private_sections, public_exceptions, private_pages
├── scripts/generate/
│   ├── cli.ts                    # CLI entry (bin)
│   └── main.ts                   # generate(): runs the steps, writes the JSON
└── __tests__/                    # Tests, mirroring src/
```

## Output

`docs-routes.json`, written to `<root>` by default (`--output <dir>`). This is the output for the sample `content/docs/`:

```json
{
  "sections": ["characters", "secrets", "stats-calculator", "weapons"],
  "section_labels": {
    "characters": "MU Online characters",
    "secrets": "MU Online secrets",
    "stats-calculator": "Character Stats Calculator",
    "weapons": "MU Online weapons"
  },
  "private_sections": ["secrets", "stats-calculator"],
  "public_exceptions": ["secrets", "secrets/skill-tips"],
  "private_pages": ["characters/elf"]
}
```

| Key | Contents |
| --- | --- |
| `sections` | Folders served at `/docs/<folder>` whose `meta.json` has `root: true`: the non-group children of `content/docs`, plus folders inside top-level groups (`content/docs/(extra)/items` → `items`). Nested `root: true` folders such as `characters/classes` are **not** sections, because sections only key on the first URL segment. |
| `section_labels` | One label per section, used for `llms.txt` headings. The first non-empty value of: the `meta.json` `description`, the `index.mdx` `description`, the slug. |
| `private_sections` | URL prefixes of the **topmost** private, non-group folders (can be nested, e.g. `characters/wizards`). Every URL under a prefix is gated, including URLs that don't exist. |
| `public_exceptions` | Exact slugs of public pages under a private prefix. |
| `private_pages` | Exact slugs of private pages **not** covered by a prefix: a private page in a public section, or the pages of a private `(group)` folder. |

Slugs follow Fumadocs URLs: `(group)` segments, the `.mdx`/`.md` extension and a trailing `index` are dropped.


## Validation

| Condition | Default | `--strict` |
| --- | --- | --- |
| `private` isn't a boolean | error, exit 1 | error, exit 1 |
| Invalid `meta.json` JSON or frontmatter YAML | error, exit 1 | error, exit 1 |
| Top-level folder (including one inside a top-level group) without `meta.json` | warning: the folder is left out of `sections` | error, exit 1 |
| `content/docs` missing (e.g. Docker's `npm ci` stage) | warning: writes empty lists | warning: writes empty lists |
| `--output` is a file path (an existing file, or ends in `.json`) | error, exit 1 | error, exit 1 |

A top-level folder without `meta.json` can't be a section, but its pages still get privacy from their own frontmatter and the root `meta.json`. A folder whose `meta.json` has no `root: true` is an intentional non-section folder, so it is left out without a warning.

## Testing and Verification

- Tests live in `src/__tests__/`, mirroring `src/` (`src/scripts/sample.ts` → `src/__tests__/scripts/sample.test.ts`), named `*.test.ts`. Write them selectively, for critical or shared logic.
- `tsconfig.prod.json` excludes `src/__tests__/` from `dist/`. `types:check` still type-checks the tests.
- Coverage is always on, and only counts `src/lib`, `src/scripts`, `src/types` and `src/utils`.
- `content/docs/` is the sample fixture that covers every case (sections, private sections, a public exception, a private page, groups). See `content/README.md`. When you change it or the output rules, update the Output example here and in the README.
- Pass the `generate()` inputs through `args`/`context` in tests (`contentDir`, `output`, `strict`). Module-level constants won't see later changes (see Gotchas).
- `npm run verify` (lint + types:check + test) and `npm run build` must both pass before a change is done. `verify` does not build, so run both.

## Conventions

A summary of [`docs/CODEBASE.md`](docs/CODEBASE.md) (see [Context Files](#context-files)), plus patterns from the existing code.

- **Structure**: business logic goes in `src/lib/`, one single-purpose function per `<method>.ts`, with stateful code as classes in `lib/classes/`. Each `src/scripts/<script-name>/` folder has `cli.ts` (the bin entry) and `main.ts` (which composes `lib/`). `src/index.ts` only re-exports reusable library code. Avoid circular imports and exports.
- **Formatting** (ESLint): no semicolons, single quotes, 2-space indent, trailing commas on multiline, LF line endings, a blank line before every `return`, no multiple empty lines.
- **Imports**: use the `@/` alias (`@/*` → `src/*`) and put `.js` on every relative and `@/` import (`'@/lib/utils.js'`), which `NodeNext` requires. Group the imports in this order, with one blank line between groups and A-Z sorting within each: Node built-ins, external packages, internal/relative, then `import type` lines. Leave one blank line after the import block. ESLint does not check any of this, so follow it by hand.
- **Functions**: write helpers and utilities as arrow functions (`export const fn = (...) => {}`). Use `function` declarations only for specific cases. Class methods put a space before the parentheses (`addError (message: string) {`).
- **Types**: always type parameters and return values. Avoid `any` (prefer `unknown` or `Record`). Keep types at the narrowest scope: a folder-local `types.ts` first, moved to `src/lib/types.ts` only when another folder needs them. Interfaces use an `I` prefix (`IDocsRoutes`).
- **Naming**: camelCase for variables, functions, files and folders. PascalCase for types, interfaces, enums and Zod schemas. ALL_CAPS for meaningful, repeated or config-like constants, but not for trivial literals. File suffixes: `*.schema.ts`, `*.enum.ts`, `*.interface.ts`, `*.types.ts` (mixed).
- **Constants**: shared constants go in `src/lib/constants.ts`. Keep single-module constants inside that module.
- **Control flow**: return early as soon as a condition isn't met.
- **File size**: aim for under about 200 lines per file. Split a file only when that gives cohesive modules, not just to hit the number.
- **Docs**: write short JSDoc (`@param {type} name - description`, `@returns`) for functions, types and interfaces. Keep inline comments minimal and use descriptive names instead.
- **Unused variables**: prefix them with `_`.
- **Dependencies**: avoid adding libraries for simple code (only `js-yaml` at runtime today). A new library must be truly needed and should be credible, widely used (~100K+ npm downloads), lightweight (~300KB–2MB unpacked) or tree-shakeable, and maintained.
- **Commits**: conventional-commit subject, all lowercase, with a bulleted body.

## Gotchas

- **Import-time globals**: `ROOT_DIR` (the nearest folder with a `package.json`, searched upwards from `process.cwd()`), `CONTENT_DIR` and `isStrict` (`process.argv.includes('--strict')`) in `src/lib/constants.ts` are set when the module loads.
- `findRootDir()` deliberately uses the working directory, not `import.meta`, because the package runs from a consumer's `node_modules`.
- **Don't hand-edit generated files**: `dist/`, `.vitest/`, or the root `docs-routes.json` (regenerate it with `npm run routes:generate`).
- **`.gitignore` ignores `*.md` and `*.json`** except `package*.json`, `CLAUDE.md`, `.md`/`.json` under `content/` and `.md` under `docs/`. A new `.md`/`.json` file elsewhere is untracked unless you add a `!` exception.
- The Compose files and `docker exec fumadocs-routes-dev ...` assume the parent root project. Prefer the npm workflow.

## Context Files

- [`docs/CODEBASE.md`](docs/CODEBASE.md): the source of truth for coding patterns and guidelines (folder structure, ESLint rules, naming, types, constants, documentation, dependencies, testing). Read it before writing or refactoring code. Where it disagrees with the actual config (`eslint.config.mjs`, `package.json`), the config wins.
