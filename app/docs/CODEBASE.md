## Single-purpose Node.js / TypeScript CLI Codebase

_These codebase guidelines are based on personal preferences. Adjust it to sync with your personal development practices and workflows._

### High-level project folder structure

Names enclosed in `<>` are placeholders.

```text
app/
├── src/
|   ├── index.ts                      # Package exports
|   ├── lib/                          # Library code
|   │   ├── classes/                  # Stateful functions written as classes
|   │   ├── constants.ts              # Paths, regexes, flags, global variables
|   │   ├── <method>.ts               # Function that accomplishes a single purpose
|   │   ├── types.ts                  # Shared types
|   │   └── utils.ts                  # Small helper utility functions
|   ├── scripts/                      # NPM scripts (package.json - "scripts")
|   |   └── <script-name>/
|   │       ├── cli.ts                # CLI entry (bin)
|   │       └── main.ts               # Script function building from lib/
|   └── __tests__/                    # Tests, mirroring src/
├── tsconfig.json
└── package.json
```

## Structure Notes

#### 1. Business logic lives in `lib/`

Contains shared library scripts, classes and utilities. Heavy logic decomposed to separate concerns.

#### 2. `scripts/<script-name>/` compose related code

Main scripts entry point (bin), callable from package.json - "scripts"

#### 3. `index.ts` is for package exports

It exports reusable library code.

### Benefits of using this structure

- **Scales cleanly** - You don’t end up with 200 files in one directory.
- **Promotes readability** - You don't end up with 2000+ lines of code in one file.
- **Encourages separation of concerns** - library + scripts (main program entrypoint) composition

## Path Aliases

Follow these path aliases in `tsconfig.json`. Use path aliases when importing code.

```json
"paths": {
  "@/*": ["./src/*"]
}
```

## ESLint Rules

Check and enforce the following ESLint rules for code formatting, correctness, naming, unused variables:

```js
rules: {
  'comma-dangle': ['error', 'always-multiline'],
  'eol-last': ['error', 'always'],
  'indent': ['error', 2],
  'keyword-spacing': ['error', { before: true, after: true }],
  'linebreak-style': ['error', 'unix'],
  'object-curly-spacing': ['error', 'always'],
  'quotes': ['error', 'single'],
  'semi': ['error', 'never'],
  'no-multi-spaces': 'error',
  'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
  'no-trailing-spaces': 'error',
  'space-before-blocks': ['error', 'always'],
  'no-console': 'off',
  'no-undef': 'error',
  'no-unused-vars': 'off',
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'return' },
  ],
  '@typescript-eslint/no-require-imports': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
    },
  ],
  'max-lines': [
    'warn',
    { max: 200, skipBlankLines: true, skipComments: true }
  ],
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/naming-convention': [
    'error',
    { 'selector': 'typeLike', 'format': ['PascalCase'] },
    { 'selector': 'variable', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE'], 'leadingUnderscore': 'allow' },
    { 'selector': 'function', 'format': ['camelCase', 'PascalCase'] },
    { 'selector': 'parameter', 'format': ['camelCase', 'PascalCase'], 'leadingUnderscore': 'allow' },
    { 'selector': 'import', 'format': ['camelCase', 'PascalCase', 'UPPER_CASE'] },
    { 'selector': ['property', 'objectLiteralProperty', 'typeProperty'], 'format': null },
  ],
}
```

### Import order and spacing

> [!NOTE]
> These import rules aren't enforced by ESLint yet, so follow them by hand. `eslint-plugin-import` only supports ESLint 9 and below, so it and its `import/no-commonjs`, `import/order` and `import/newline-after-import` rules were removed from `eslint.config.mjs`. `@typescript-eslint/no-require-imports` still blocks `require()`.

Order imports in these groups, separated by one blank line and sorted A-Z (case-insensitive) within each group:

1. Node.js built-in libraries
2. External packages
3. Internal (`@/`) and relative imports (`./`, `../`)

Also leave one blank line after the import block. ESLint enforces the blank line before every `return` (`padding-line-between-statements`), and `npm run lint:fix` adds it automatically. The exact config is in `eslint.config.mjs`.


## Verification

Before a commit or build is considered good, `npm run verify` and `npm run build` must pass.

`npm run verify` chains:

- `lint` (ESLint — formatting, correctness, naming, unused vars)
- `types:check` (tsc -p tsconfig.json --noEmit — TypeScript types)
- `test` (Unit tests)

Run `npm run verify` and `npm run build` locally and in CI before merging.

## 📐 General Coding Guidelines

- Use **`LF` (Line Feed)** as the line ending format for all code and other files to ensure consistency across environments and platforms.
- Use **arrow functions** instead of traditional function declarations when defining helper or utility functions and methods. Only use `function()` definitions for specific cases.
- Follow **camelCase** for naming variables, files, functions/methods and folders.
- Follow **PascalCase** for naming **Zod** schemas, **TypeScript** `types`, `interfaces`, `enums` and other TypeScript constructs.
- Follow consistent file naming conventions based on content:
  - Use `*.schema.ts` for files containing Zod schemas.
  - Use `*.enum.ts` for files containing only enums.
  - Use `*.interface.ts` for files containing only interfaces.
  - Use `*.types.ts` for files that include a mix of types, interfaces, enums, or other related constructs.
- Always define the **types** of function parameters and return values. Use TypeScript **interfaces** or **types** for generic parameters when applicable.
  - Avoid `any` unless absolutely necessary (prefer `unknown`, `Record`, etc.)
- Use **early `return` statements** to exit a hooks or functions as soon as possible when conditions aren't met, to avoid unnecessary processing and to keep the logic clean and efficient.

### Source File Size

- Aim to keep each source file **under approximately 200 lines of code**.
- When a file exceeds 200 lines, **evaluate whether it can be split into smaller, cohesive modules** with clear responsibilities.
- Prefer **smaller, focused files** when splitting improves readability, maintainability, or separation of concerns.
- **Do not split code arbitrarily** just to satisfy the line-count target; keep closely related logic together when that produces a clearer design.

### Constants

- Extract **meaningful, repeated, or configuration-like constant values** into well-named `ALL_CAPS` variables to improve readability and maintainability.
  ```typescript
  ✅ const DISCUSSIONS_API = "/api/v1/discussions"
      fetch(DISCUSSIONS_API)
  ❌ fetch("/api/v1/discussions")
  ```
- Do **not** extract trivial or self-explanatory literals solely to avoid inline values.
  ```typescript
  ✅ if (items.length === 0) { ... }
  ❌ const EMPTY_LENGTH = 0
  if (items.length === EMPTY_LENGTH) { ... }
  ```
- Store global constants that are **shared across multiple codes** in `src/lib/constants.ts`.
- Keep constants that are **only used by one module** local to that module rather than moving them to the global-level constants.ts.
- Avoid creating constants for values that are used only once unless the name provides meaningful semantic context.

### TypeScript Types

- **Global-shared types:** Create `types.ts` at `lib/` for types used by **multiple files**.
- **Folder-internal types:** Create `types.ts` inside `classes/`, `scripts/`, `<script-name>/`, etc. when the types are used **only within that folder**.
- **Keep types at the narrowest scope that satisfies their usage.** Do not create or move types to a shared `types.ts` solely for convenience.
- **Promote a folder-internal type to the global-level `types.ts` when another folder needs to use it.**

### ⚡ Optimization

- Avoid circular redundancy in exports/imports.

## 📄 Code Documentation

- Always use short, direct-to-the point **JSDoc-style descriptions** to describe function parameters, return types, and TypeScript type or interface definitions.
- Add **minimal, short, direct-to-the-point inline comments** where necessary to clarify intent, especially for complex or non-obvious logic.
- Use **descriptive and self-explanatory variable names** to reduce the need for excessive comments and improve overall code readability.

## 📦 Use of External Libraries

- Strive to **minimize external dependencies**, especially for simple or easily implementable functionality (e.g., a function that sums two numbers).
- Only use third-party Node libraries when **truly necessary**—for example, when a library:
  - Provides functionality that would be complex or time-consuming to build from scratch
  - Is used frequently across the app
  - Helps avoid "reinventing the wheel" for heavy processing tasks
- Before adding a library, consider the following 🟢 green flags:
  - It comes from a **credible author or organization**, with an active and trustworthy GitHub repository
  - It has **high usage** and community trust (e.g., ~100K+ downloads on the NPM registry)
  - It has **small and lightweight footprint** (eg., about ~300KB-2MB unpacked) or if it supports **tree-shaking**.
  - The source code is **open, transparent, and actively maintained** (eg., few open GitHub Issues or PRs)
  - Even if not actively maintained, the library still **aligns with your needs** and is simple enough to extend or adapt for custom use (e.g., a JavaScript `class` that can be easily refactored or subclassed (`extend`) for custom use)

## 🧪 Testing

> [!NOTE]
> _Use **Vitest** for simple feature-level tests. Aim for e2e tests at the post-deployment stage on appropriate cases._

### General Testing Guidelines

- Place test files in the `__tests__` folder mirroring the the component, hook, or script they test in `src/`.
- Name test files to match the target module, using the suffix: `*.test.ts` or `*.test.tsx`.
  > **Example:** reader.ts → reader.test.ts
- **selectively write tests** for critical or global components, features, or business logic as needed.
- All code should pass `"npm test"` before commit.
