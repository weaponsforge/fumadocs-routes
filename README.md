## generate-fumadocs-routes

Generates `docs-routes.json` containing a list of root docs sections + labels, private sections, public exceptions and private pages from the `private` flags in Fumadocs `content/docs`.

Folders set the flag in `meta.json` and pages set it in their **frontmatter**.

## Output

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
| `sections` | Folders served at `/docs/<folder>` whose `meta.json` has `root: true`: the non-group children of `content/docs`, plus folders inside top-level groups (`content/docs/(extra)/items` → `items`). Nested `root: true` folders such as `characters/classes` are **not** sections. Sections only keys on the first URL segment. They still work as Fumadocs sidebar tabs, and their pages use the parent section's label. |
| `section_labels` | One label per section, used for `llms.txt` headings. The first non-empty of: the `meta.json` `description`, the `index.mdx` `description`, the slug. |
| `private_sections` | URL prefixes of the **topmost** private, non-group folders. They can be nested, e.g. `characters/wizards`. Every URL under a prefix is gated, including ones that don't exist. |
| `public_exceptions` | Exact slugs of public pages under a private prefix. |
| `private_pages` | Exact slugs of private pages **not** covered by a prefix. This covers a private page in a public section, and the pages of a private `(group)` folder. |

File paths become slugs the way Fumadocs builds URLs: `(group)` segments, the extension (`.mdx`/`.md`) and a trailing `index` are dropped.

## Layout

```text
generate-docs-routes/
├── index.ts                    entry point, calls main()
├── main.ts                     creates the run context, runs the steps, writes the JSON, prints a summary
├── lib/
│   ├── classes/
│   │   ├── diagnostics.ts      Diagnostics: collects warnings and errors, flush() prints them
│   │   ├── reader.ts           Reader: reads meta.json, frontmatter and `private` values
│   │   └── routes-collection.ts RoutesCollection: accumulates the lists, toJSON() sorts them
│   ├── constants.ts            fixed values: paths, regexes, flags
│   ├── section.ts              collectSections(): sections and section_labels
│   ├── types.ts                RawData, IDocsRoutes (output shape, also used by routes.ts), GeneratorContext
│   ├── utils.ts                pure helpers (toPosix, isGroup, joinSlug, ...)
│   └── walk.ts                 walk(): private_sections, public_exceptions, private_pages
├── package.json                "type": "module" for the compiled output
└── tsconfig.json               NodeNext build to dist/
```

## Validation

| Condition | Default | `--strict` |
| --- | --- | --- |
| `private` isn't a boolean | error, exit 1 | error, exit 1 |
| Invalid `meta.json` JSON or frontmatter YAML | error, exit 1 | error, exit 1 |
| Top-level folder (including one inside a top-level group) without `meta.json` | warning: the folder is left out of `sections` | error, exit 1 |
| `content/docs` missing (e.g. Docker's `npm ci` stage) | warning: writes empty lists | warning: writes empty lists |

A top-level folder without a `meta.json` can't be a section. This includes folders inside top-level groups. Its pages fall back to the `characters` section in `getSection()`, but they still get privacy from their own frontmatter and the root `meta.json`. A folder whose `meta.json` has no `root: true` is treated as an intentional non-section folder and is left out without a warning.

@weaponsforge<br>
20261018
