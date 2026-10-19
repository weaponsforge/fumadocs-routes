## content

Sample Fumadocs content used as test input for the generator. The `docs/` folder sits where Fumadocs places docs content by default (`content/docs`), so it's also the generator's default `--docs` path.

It covers the cases the generator handles:

- **Sections**: `characters`, `weapons`, `secrets` and `stats-calculator` have `"root": true` in their `meta.json`
- **Private sections**: `secrets` and `stats-calculator` set `"private": true` in `meta.json`
- **Public exception**: `secrets/skill-tips.mdx` sets `private: false` in its frontmatter
- **Private page**: `characters/(classes)/elf.mdx` sets `private: true` in its frontmatter
- **Groups**: `(classes)`, `(guide)` and `(types)` folders add no URL segment

Run `npm run routes:generate` from the project root to generate `docs-routes.json` from it.
