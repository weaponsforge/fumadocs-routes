## fumadocs-routes

NPM library and CLI for reading or generating a list of [Fumadocs](https://github.com/fuma-nama/fumadocs) routes root docs sections + labels, private sections, public exceptions and private pages from the `private` frontmatter or meta flags in `content/docs/`.

Its output is `docs-routes.json`, a lightweight JSON file, intended for a Fumadocs project's `proxy.ts` to import and use for auth-gated redirects and  session checks. Its data is also available for programmatic access and usage via the library's scripts and classes.

### CLI Available

> - **Run via npx (no installation required)**
>   - Requirements: NodeJS LTS v24.11.0 or later<br>
>     Next.js (App Router) Fumadocs project
>   - Run `npx fumadocs-routes --help`
>
> - **Docker image**<br>
>   A Docker image is available at https://hub.docker.com/r/weaponsforge/fumadocs-routes

### Table of Contents

- [Requirements](#-requirements)
- [Quickstart](#-quickstart)
- [Code Samples](#-code-samples)
- [CLI Usage](#-cli-usage)

## 📋 Requirements

<details>
<summary>👉 Click to expand the list of requirements</summary>

1. NodeJS LTS v24.11.0 or higher
   ```text
   Recommended:
   node: 24.11.0
   npm: 11.6.1
   ```
2. [Fumadocs](https://www.fumadocs.dev/) documentation project (tested for Next.js - App Router. Other options/variations are untested)
3. Fumadocs `source.config.ts` extended to hold the `private` field in its `meta.json` and frontmatter (pages).

   <details>
   <summary>👉 Click to view custom config</summary>

   `source.config.ts` [reference](https://www.fumadocs.dev/docs/mdx/collections#schema-1)

   ```ts
   import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'
   import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
   import { z } from 'zod'

   export const docs = defineDocs({
     dir: 'content/docs',
     docs: {
       schema: pageSchema.extend({
         private: z.boolean().default(false),
       }),
     },
     meta: {
       schema: metaSchema.extend({
         private: z.boolean().default(false),
       }),
     },
   })
   ```
   </details>

### Core Libraries/Frameworks

(Installed via npm)

- [js-yaml](https://www.npmjs.com/package/js-yaml) `v5.5.0` - YAML 1.2 parser and serializer for JavaScript. Reads frontmatter data.

</details>
<br>

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](/CONTRIBUTING.md) and the [CODING STYLE](/app/docs/CODEBASE.md) for guidelines.

## 🆕 Quickstart

1. Install the library preferrably within a Fumadocs project.
   ```bash
   npm i fumadocs-routes
   ```

2. Take note of the MDX `"content/docs/"` folder location in the Fumadocs project. Fumadocs initializes it by default in `/<project-root>/content/docs`. Example:

   ```text
   fumadocs-project/
   ├── content/                # MDX docs content
   |   └── docs/
   |       ├── characters/
   |       |   ├── meta.json
   |       |   ├── index.mdx
   |       |   ├── knight.mdx
   |       |   ├── wizard.mdx
   |       |   ├── elf.mdx
   |       └── information/
   |           ├── meta.json
   |           ├── index.mdx
   |           └── training.mdx
   ├── package.json
   ├── ...
   ```

3. Mark private folders and pages.
   - Add `"private": true` in the `meta.json` of main folders (sections) or nested sub-folders that you'd like to keep private.
   - Add `private: true` in the frontmatter of `*.mdx` files for specific pages that you'd like to keep private.

   > **INFO**: Marking them private does not automatically make them private in Fumadocs. You'd need to set its `proxy.ts` for auth gates (eg., configure Google OAuth2 sign-in, session checks) and server-side redirects using the routes list output in step #5.

3. To generate the public/private/exceptions routes list into `docs-routes.json` from the default Fumadocs `content/docs/` MDX docs content directory using the CLI:

   `package.json`

   ```json
   "scripts": {
      "generate:routes": "npx fumadocs-routes"
   },
   "dependencies": {
      "fumadocs-routes": "^1.1.6"
   }
   ```

   Run `npm run generate:routes`

4. Read the parsed structured folders and MDX (pages) into JSON format programmatically via code. See the examples under the [Code Samples](#-code-samples) section for more information.

<br>

## 🧾 Code Samples

### 🟢 A. Generate `docs-routes.json` and Access All Proccessed Routes

#### 1. Simple Usage

Generate `docs-routes.json` in the root project folder,<br>
reading docs files from `"./content/docs"` (default Fumadocs content location)

```typescript
import path from 'path'
import { generate } from "fumadocs-routes"

generate()
```

#### 2. Set input folder path and JSON output path

Generate `docs-routes.json` under `"./nested/folder/inner"`,<br>
reading docs files from `"./info/content/docs"`

```typescript
import path from 'path'
import { generate } from "fumadocs-routes"

// Folder with Fumadocs MDX content
const docsContentDir = path.join('info', 'content', 'docs')
const outputDir = path.join('nested', 'folder', 'inner')

generate({
  args: {
    docs: docsContentDir,
    output: outputDir
  }
})
```

#### 3. Advanced Usage

Send `RoutesCollection` as context to programatically access the processed routes via code.

```typescript
import { generate, RoutesCollection } from "fumadocs-routes"

const routes = new RoutesCollection()

generate({
  context: { routes }
})

// Read key routes member variables containing routes prefixes
const {
  sections,           // string[] array
  sectionLabels,      // object
  privateSections,    // string[] array
  publicExceptions,   // string[] array
  privatePages        // string[] array
} = routes

// Log everything to JSON
console.log(routes.toJSON())
```

### 🟢 B. Parse Only Section Routes

Parse and access only the `sections[]` and `sectionLabels {}` values.

> **NOTE**: All values are read, processed and parsed with `generate()`

```typescript
import path from 'path'
import { collectSections, Reader, RoutesCollection } from "fumadocs-routes"

// Folder with Fumadocs MDX content
const docsContentDir = path.join('content', 'docs')

const context = {
  reader: new Reader(),
  routes: new RoutesCollection(),
  contentDir: docsContentDir
}

collectSections(context)

console.log(context.routes.toJSON())
```

### 🟢 C. Parse Only Private Routes and Public Exceptions

Parse and access only the `privateSections[]`, `publicExceptions[]`, and `privatePages[]` values.

> **NOTE**: All values are read, processed and parsed with `generate()`

```typescript
import path from 'path'
import { walk, Reader, RoutesCollection } from "fumadocs-routes"

// Folder with Fumadocs MDX content
const docsContentDir = path.join('content', 'docs')

const context = {
  reader: new Reader(),
  routes: new RoutesCollection(),
  contentDir: docsContentDir
}

walk({
  context,
  dir: docsContentDir,
  urlSegments: [],
  inheritedPrivate: false,
  isCovered: false
})

console.log(context.routes.toJSON())
```

## 💻 CLI Usage

The following are available flags, passed as arguments to `generate()` when using the CLI.

```bash
npx fumadocs-routes [--docs <dir>] [--output <dir>] [--strict]
```

| Option | Description |
| --- | --- |
| `--docs`, `-d` | Fumadocs docs folder.<br>Default: `<root>/content/docs` |
| `--output`, `-o` | Folder to write `docs-routes.json` into. A file path is rejected,<br>the file is always named `docs-routes.json`. Missing folders are created.<br>Default: `<root>` |
| `--strict` | A top-level folder without `meta.json` is an error instead of a warning (CI gates). See [Validation](#validation).<br>Default: off |

- `<root>` is the nearest folder with a `package.json`, searched from the working directory upwards.
- Relative paths resolve from the working directory.

**Example Usage**:

```bash
npx fumadocs-routes -d ./info/content/docs -o ./info
npm run routes:generate -- --docs ./info/content/docs -o ./some/other --strict
```

## References

- [Fumadocs](https://github.com/fuma-nama/fumadocs) - The beautiful & flexible React.js docs framework
- [Fumadocs - Extend Schemas](https://www.fumadocs.dev/docs/mdx/collections#schema-1)
- [Fumadocs - Access Control](https://www.fumadocs.dev/docs/guides/access-control)

@weaponsforge<br>
20260225
