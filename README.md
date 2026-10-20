## fumadocs-routes

Generates `docs-routes.json` containing a list of root docs sections + labels, private sections, public exceptions and private pages from the `private` frontmatter or meta flags in [Fumadocs](https://github.com/fuma-nama/fumadocs) `content/docs/`. Its output is a lightweight JSON file, intended for a Fumadocs project's `proxy.ts` to import and use for auth-gated redirects.

Folders set the flag in `meta.json` and pages set it in their **frontmatter**.

> TypeScript application code, codebase guidelines [CODEBASE.md](/app/docs/CODEBASE.md) and workflow [AGENTS.md](/app/AGENTS.md) documentation lives in `app/`.

> [!IMPORTANT]
> Fumadocs doesn't have a `private` frontmatter or meta field by default. The `private` flags used in [`content/docs/`](content/docs/) are a custom added field, added by extending the docs schemas in a Fumadocs project's `source.config.ts`, for example:

<details>
<summary>👉 Click to view an extended Fumadocs <b>source.config.ts</b></summary>

Fumadocs [docs, meta extension reference](https://www.fumadocs.dev/docs/mdx/collections#schema-1)

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

The [`content/docs/`](content/docs/) folder contains sample `.mdx` pages and `meta.json` files, placed where [Fumadocs](https://github.com/fuma-nama/fumadocs) puts docs content by default. It is the default input when `--docs` isn't given, and the [Output](#output) below is generated from it.

### Table of Contents

- [Requirements](#-requirements)
- [Output](#output)
- [Quickstart](#-quickstart)
- [Usage (Node, Docker)](#-usage)
- [Available Scripts](#-available-scripts)
- [Docker Scripts](#-docker-scripts)
- [CLI Usage](#-cli-usage)
- [Layout](#layout)
- [Validation](#validation)

## 📋 Requirements

<details>
<summary>👉 Click to expand the list of requirements</summary>

1. Windows 11/Linux OS
2. NodeJS LTS v24.11.0 or higher
   ```text
   Recommended:
   node: 24.11.0
   npm: 11.6.1
   ```
### Core Libraries/Frameworks

(Installed via npm)

1. [typescript](https://www.npmjs.com/package/typescript) `v6.0.3` - Compile-time error checker
2. [tsx](https://www.npmjs.com/package/tsx) `v4.23.15` - Runs TS files in development mode
3. [vitest](https://www.npmjs.com/package/vitest) `v5.0.5` - Runs tests
4. [js-yaml]() `v5.5.0` - Parses MDX frontmatter

</details>
<br>

## Output

`docs-routes.json`, written to the project root by default (see [`--output`](#-cli-usage)).

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


## 🆕 Quickstart

#### 1. Clone the repository.

```sh
git clone https://github.com/weaponsforge/fumadocs-routes.git
```

#### 2. Install dependencies.

```bash
cd app
npm install
```

#### 3. Transpile to JavaScript.

```bash
npm run build
```

#### 4. Generate routes of the sample content.

Sample content in `content/docs/`. This script generates a `docs-routes.json` in the root project directory.

```sh
npx fumadocs-routes [--docs <dir>] [--output <dir>] [--strict]
npm run routes:generate
```

#### 5. Run available scripts.

See the [Available Scripts](#-available-scripts) section for more information.
<br>


## 🚀 Usage

### Using Node

1. Run a non-test TypeScript file inside the **/app/src** directory from the project's _**"root directory"**_. For example:

   ```bash
   cd app
   npx tsx src/scripts/sample.ts
   ```

2. Run compiled JavaScript code from the TypeScript files. For example:

   ```bash
   cd app
   npm run build
   node dist/scripts/sample.js
   ```

3. Generate `docs-routes.json` from the sample [`content/docs/`](content/docs/):

   ```bash
   cd app
   npm run build
   npm run routes:generate
   ```

4. See the [Available Scripts](#-available-scripts) section for more information.

## ⚡Alternate Usage

### Using Docker

- **Build the image** (Run only once)
   ```bash
   docker compose build --no-cache
   ```

- **Run the container** (Run only once)
   ```bash
   docker compose up
   ```

- **Run an NPM script using Docker compose**<br>
   Ensure the Docker container is running (see **Run the container**)
   ```bash
   docker exec -it fumadocs-routes-dev <AVAILABLE_SCRIPT_OR_DOCKER_SCRIPT>
   ```

- **Run an NPM script using only Docker**<br>
   Ensure the Docker container is running (see **Run the container**)
   ```bash
   docker run -it -v ${pwd}/app:/opt/app -v /opt/app/node_modules --rm weaponsforge/fumadocs-routes:dev <AVAILABLE_SCRIPT_OR_DOCKER_SCRIPT>
   ```

- **Run a non-test TS file using TypeScript Execute (tsx)**<br>
   (requires **Run an NPM script using Docker compose**)
   ```bash
   docker exec -it fumadocs-routes-dev npx tsx /opt/app/src/<PATH_TO_TS_FILE>.ts
   ```

- See the [Available Scripts](#-available-scripts) and [Docker Scripts](#-docker-scripts) sections for more information.


## 📜 Available Scripts

These scripts, compatible with running in Node and Docker, run various TypeScript scripts and tests.

<details>
<summary>👉 Click to expand the list of available scripts</summary>

### A. Running the Codes ⚙️➡️

### `npm run dev`

Runs `vitest` in watch mode, watching file changes and errors to files linked with `*.test.ts` files.

### `npm run watch`

Watches file changes in `.ts` files using the `tsc --watch` option.

### `npm run build`

Builds JavaScript, `.d.ts` declaration files, and map files from the TypeScript source files in the `/src/dist` directory.

### `npm start`

Same as `npm run routes:generate`. Also the entry point of the production Docker image.

### `npm run routes:generate`

> Requires `npm run build` first.

Runs the built CLI (`dist/scripts/generate/cli.js`) and writes `docs-routes.json`.

Pass [CLI options](#-cli-usage) after `--` e.g. `npm run routes:generate -- -o ./public`.

### `npm run routes:check`

Same as `npm run routes:generate`, with `--strict`.

### `npm run types:check`

Runs type-checking without generating the JavaScript or declaration files from the TypeScript files in the `/src` and `__tests__` directories.

### B. Testing 🚦✅

### `npm run lint`
Lints TypeScript source codes.

### `npm run lint:fix`
Fixes lint errors in TypeScript files.

### `npm test`
- Runs test scripts defined in `*.test.ts` files with coverage.
- Generates a vitest test report into the **/.vitest** directory.
- Run `npm run report:view` to preview the generated report.

### `npm run test:ui`

- Runs test scripts defined in `*.test.ts` files with coverage.
- Spawns a local report-like website showing each test's real-time status and coverage using vitest-ui
- This script is similar to the vitest **`npm run dev`** script that watches for changes in the `*.test.ts` files but displays the result logs and coverage details in the local website rather than the command line.

### `npm run report:view`

> **NOTE:** This script requires running `npm test` first to generate a test report into the **/.vitest** directory

- Spins up a local web server accessible at `http://localhost:4173/`
- Serves the website contents of a test report from the **/.vitest** directory

### `npm run info`

Logs the installed Node.js and npm version, environment platform, architecture and V8 version.

### `npm run verify`

Combines `lint` + `types:check` + `test` in one command.

</details>
<br>


## 📦 Docker Scripts

These scripts allow optional Docker-related processes, such as enabling file watching in Docker containers running in Windows WSL2 and others.

> [!TIP]
> Scripts with a `":win"` suffix indicate compatibility for Windows Docker running in WSL2.

<details>
<summary>👉 Click to expand the list of available scripts</summary>

### Docker run command

Run the Docker containers first using options A or B.

**A. Using Docker compose**

```bash
docker compose build
docker compose up
```

Use the template:

```bash
docker exec -it fumadocs-routes-dev <AVAILABLE_DOCKER_SCRIPT>
```

**B. Using Only Docker (PowerShell)**

`docker run -it -v ${pwd}/app:/opt/app -v /opt/app/node_modules --rm weaponsforge/fumadocs-routes:dev <AVAILABLE_DOCKER_SCRIPT>`

### Scripts

### `npm run docker:debug`

1. Runs the `"/src/scripts/sample.ts"` script in containers with debugging enabled in VSCode by default.
2. Replace the `"/src/scripts/sample.ts"` file path in the package.json file's `"docker:debug"` script with a target TypeScript file for debugging.
3. Map port **`9229`** to enable debugging VSCode while running in Docker (PowerShell).
   - (A. Using Docker compose):<br>
   `docker exec -it fumadocs-routes-dev npm run docker:debug`
   - (B. Using Only Docker (PowerShell))<br>
   `docker run -it -v ${pwd}/app:/opt/app -v /opt/app/node_modules -p 9229:9229 --rm weaponsforge/fumadocs-routes:dev npm run docker:debug`
4. Launch the VSCode debugger using the following configuration:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "attach",
         "name": "Attach to Docker",
         "address": "localhost",
         "port": 9229,
         "restart": true,
         "skipFiles": ["<node_internals>/**"],
         "localRoot": "${workspaceFolder}/app",
         "remoteRoot": "/opt/app"
       }
     ]
   }
   ```

### `npm run docker:test:ui`

- Docker command counterpart of the `npm run test:ui` script,  compatible with containers running in **Linux** OS.
- Runs test scripts defined in `*.test.ts` files in watch mode with coverage from a container.
- Spawns a local report-like website showing each test's real-time status and coverage using vitest-ui accessible at `http://localhost:51204/__vitest__/`.

### `npm run docker:report:view`

> **NOTE:** This script requires running `npm test` first to generate a test report into the **/.vitest** directory

- Docker command counterpart of the `npm run report:view` script.
- Spins up a local web server accessible at `http://localhost:4173/`
- Serves the website contents of a test report from the host's **/.vitest** directory

### `npm run docker:watch:win`

Watches file changes in `.ts` files using the `tsc --watch` option with `dynamicPriorityPolling` in Docker containers running in Windows WSL2.

### `npm run docker:dev:win`

- Sets and exports the environment variables: `CHOKIDAR_USEPOLLING=1` and `CHOKIDAR_INTERVAL=1000`
- Runs `vitest` in watch mode inside Docker containers running in Windows WSL2, watching file changes and errors to files linked with `*.test.ts` files.

### `npm run docker:test:ui:win`

- Sets and exports the environment variables: `CHOKIDAR_USEPOLLING=1` and `CHOKIDAR_INTERVAL=1000`
- Runs test scripts defined in `*.test.ts` files in watch mode with coverage inside Docker containers running in **Windows WSL2**.
- Spawns a local report-like website showing each test's real-time status and coverage using vitest-ui accessible at `http://localhost:51204/__vitest__/`.

</details>
<br>


## 💻 CLI Usage

Install the package in a Fumadocs project, then run it from anywhere inside that project:

```bash
npm install fumadocs-routes
npx fumadocs-routes [--docs <dir>] [--output <dir>] [--strict]
```

| Option | Description |
| --- | --- |
| `--docs`, `-d` | Fumadocs docs folder.<br>Default: `<root>/content/docs` |
| `--output`, `-o` | Folder to write `docs-routes.json` into. A file path is rejected, the file is always named `docs-routes.json`. Missing folders are created.<br>Default: `<root>` |
| `--strict` | A top-level folder without `meta.json` is an error instead of a warning (CI gates). See [Validation](#validation).<br>Default: off |

- `<root>` is the nearest folder with a `package.json`, searched from the working directory upwards.
- Relative paths resolve from the working directory.

```bash
npx fumadocs-routes -o ./src/lib/routes/generated
npm run routes:generate -- --docs ./content/docs -o ./public --strict
```

### From code

```ts
import { generate, type IDocsRoutes } from 'fumadocs-routes'

const routes: IDocsRoutes = generate({
  args: {
    docs: 'content/docs',
    output: 'public',
    strict: true,
    cwd: process.cwd() // where to search upwards for the root package.json
  }
})
```

`strict` defaults to `false` and is never read from `process.argv` by the library. Only the CLI parses `--strict`.

`generate()` writes the file and returns the route lists. On validation errors, it prints them to stderr and throws instead of exiting.

The package also exports `findRootDir()`, `DEFAULT_DOCS_PATH`, `OUTPUT_FILE_NAME`, the building blocks (`collectSections`, `walk`, `Reader`, `RoutesCollection`, `Diagnostics`) and the `GeneratorContext`, `IGenerateArgs`, `IGenerateRoutes` and `RawData` types.


## Layout

```text
app/
├── docs/                        # Codebase patterns and guidelines
├── content/docs/                # Sample input, default --docs
├── src/
│   ├── index.ts                 # Package exports
│   ├── lib/
│   │   ├── classes/
│   │   │   ├── diagnostics.ts   # Collects and prints warnings/errors
│   │   │   ├── reader.ts        # Reads meta.json and frontmatter
│   │   │   └── routes.ts        # Accumulates and sorts the lists
│   │   ├── constants.ts         # Default paths, file name, regexes
│   │   ├── section.ts           # Builds sections and section_labels
│   │   ├── types.ts             # Shared types
│   │   ├── utils.ts             # Small helper utility functions
│   │   └── walk.ts              # Builds private_sections, public_exceptions, private_pages
│   └── scripts/generate/
│       ├── cli.ts               # CLI entry (bin)
│       └── main.ts              # generate(): runs the steps, writes the JSON
├── package.json
└── tsconfig.json
```

## Validation

| Condition | Default | `--strict` |
| --- | --- | --- |
| `private` isn't a boolean | error, exit 1 | error, exit 1 |
| Invalid `meta.json` JSON or frontmatter YAML | error, exit 1 | error, exit 1 |
| Top-level folder (including one inside a top-level group) without `meta.json` | warning: the folder is left out of `sections` | error, exit 1 |
| `content/docs` missing (e.g. Docker's `npm ci` stage) | warning: writes empty lists | warning: writes empty lists |
| `--output` is a file path (an existing file, or ends in `.json`) | error, exit 1 | error, exit 1 |

A top-level folder without a `meta.json` can't be a section. This includes folders inside top-level groups. Its pages still get privacy from their own frontmatter and the root `meta.json`. A folder whose `meta.json` has no `root: true` is treated as an intentional non-section folder and is left out without a warning.

@weaponsforge<br>
20261018
