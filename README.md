## fumadocs-routes

Generates `docs-routes.json` containing a list of root docs sections + labels, private sections, public exceptions and private pages from the `private` flags in Fumadocs `content/docs`.

Folders set the flag in `meta.json` and pages set it in their **frontmatter**.

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

</details>
<br>

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

## 🆕 Quickstart

#### 1. Clone the repository.

```sh
https://raw.githubusercontent.com/weaponsforge/fumadocs-routes.git
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

#### 4. Run available scripts.

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

3. See the [Available Scripts](#-available-scripts) section for more information.

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

Builds JavaScript, `.d.ts` declaration files, and map files from the TypeScript source files in the `/src` directory.

### `npm run types:check`

Runs type-checking without generating the JavaScript or declaration files from the TypeScript files in the `/src` and `__tests__` directories.

### B. Testing 🚦✅

### `npm run lint`
Lints TypeScript source codes.

### `npm run lint:fix`
Fixes lint errors in TypeScript files.

### `npm test`
- Runs test scripts defined in `*.test.ts` files with coverage.
- Generates a vitest test report into the **/html** directory.
- Run `npm run report:view` to preview the generated report.

### `npm run test:ui`

- Runs test scripts defined in `*.test.ts` files with coverage.
- Spawns a local report-like website showing each test's real-time status and coverage using vitest-ui
- This script is similar to the vitest **`npm run dev`** script that watches for changes in the `*.test.ts` files but displays the result logs and coverage details in the local website rather than the command line.

### `npm run report:view`

> **NOTE:** This script requires running `npm test` first to generate a test report into the **/html** directory

- Spins up a local web server accessible at `http://localhost:4174/`
- Serves the website contents of a test report from the **/html** directory

### `npm run info`

Logs the installed Node.js and npm version, environment platform, architecture and V8 version.

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

`docker run -it -v ${pwd}/app:/opt/app -v /opt/app/node_modules --rm weaponsforge/sendemail:dev <AVAILABLE_DOCKER_SCRIPT>`

### Scripts

### `npm run docker:debug`

1. Runs the `"/src/scripts/sample/sample.ts"` script in containers with debugging enabled in VSCode by default.
2. Replace the `"/src/scripts/sample/sample.ts"` file path in the package.json file's `"docker:debug"` script with a target TypeScript file for debugging.
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

> **NOTE:** This script requires running `npm test` first to generate a test report into the **/html** directory

- Docker command counterpart of the `npm run report:view` script.
- Spins up a local web server accessible at `http://localhost:4174/`
- Serves the website contents of a test report from the host's **/html** directory

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
