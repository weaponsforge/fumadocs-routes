# Contribution Guidelines

Welcome to the **fumadocs-routes** repository! We're excited to have you contribute to a Node.js CLI and library that reads the `private` flags in a Fumadocs `content/docs/` folder - frontmatter and meta.json to generate a lightweight `docs-routes.json` for `proxy.ts` redirects. To ensure a smooth contribution process for everyone, please follow these guidelines.

> [!NOTE]
> **Before Submitting**
>
> Check if there are other similar [PRs](https://github.com/weaponsforge/fumadocs-routes/pulls).
>
> **New Feature**
>
> Before submitting a new feature, please open a **Feature Request issue** that clearly explains the proposed functionality and the reasons behind it. Once the request has been reviewed and approved, you may proceed with submitting a pull request.
>
> **Bug Fixes**
>
> Provide a detailed description of the bug (with live demo if possible). OR open a bug report and link it in your PR.

## Getting Started

1. **Fork the Repository:** Start by forking the repository's `"dev"` branch to your GitHub account. This creates your own copy of the project where you can make changes.

2. **Clone Your Fork:** Clone your forked repository to your local machine using Git. This allows you to work on the files locally.
   ```sh
   git clone https://github.com/yourusername/fumadocs-routes.git
   ```

3. **Set Upstream Remote:** Add the original repository as an upstream remote to your local clone. This helps you to keep your fork up to date.
   ```sh
   git remote add upstream https://github.com/weaponsforge/fumadocs-routes.git
   ```

## Making Changes

1. **Create a New Branch:** Always work on a new branch for your changes. This keeps your contributions organized and separate from the main branch.
   ```sh
   git checkout -b feat/your-new-feature-name
   ```

2. **Add Your Content:** Make your changes or additions to the project. If you're adding new content, ensure it's placed in the correct directory and follows intuitive naming conventions and TypeScript coding best practices and patterns described in the [CODING STYLE](/app/docs/CODEBASE.md) and [AGENTS.md](/app/AGENTS.md) if you're using AI.

   > Before commiting your changes, format your code with `"npm run lint:fix"`, and ensure all updates pass the `"npm run lint"`, `"npm run types:check"` and `"npm test"` scripts.

3. **Commit Your Changes:** After making your changes, commit them to your branch. Use clear and concise commit messages to describe your updates.
   ```sh
   git add .
   git commit -m "Add a brief description of your changes"
   ```

4. **Keep Your Fork Updated:** Regularly sync your fork's `"dev"` branch with the upstream repository to keep it up to date. This reduces potential merge conflicts.
   ```sh
   git fetch upstream
   git checkout dev
   git merge upstream/dev
   git push origin dev
   ```

## Submitting Contributions

1. **Push Your Changes:** Push your changes to your fork on GitHub.
   ```sh
   git push origin feat/your-new-feature-name
   ```

2. **Create a Pull Request (PR):** Go to the original **fumadocs-routes** repository on GitHub and create a new pull request. Base your PR on your feature branch and target the `"dev"` branch of the upstream repository.

3. **Describe Your Contribution:** Provide a clear and detailed description of your pull request. Include the purpose of your changes and any other relevant information.

4. **Review and Collaboration:** Once your PR is submitted, the project maintainers will review your contributions. Be open to feedback and be ready to make additional changes if requested.

## Guidelines

1. **Quality:** Ensure your contributions are high quality, with no spelling or grammatical errors.

2. **Relevance:** Changes should relate to the Node.js and TypeScript CLI and library that generates `docs-routes.json`: reading `private` flags from a Fumadocs `content/docs/` folder, the structure of its output, validation, or the codebase's structure, patterns and naming conventions described in the [CODING STYLE](/app/docs/CODEBASE.md). Keep the output small and flat, and avoid adding libraries for simple code.

3. **Working functionality:** Run `npm run verify` (lint + types:check + test) and `npm run build` from `app/`. Both must pass before you submit. If you change the output rules or the sample `content/docs/`, update the Output example in the README and [AGENTS.md](/app/AGENTS.md). Add tests for critical or shared logic. Aim to keep PRs within **`~700` lines of code changes**, breaking them into smaller, self-contained parts when possible. PRs exceeding **`~1000+` lines** may be accepted when justified (e.g., major refactors or foundational features).

4. **Respect:** Respect the structure and formatting of the existing project. Follow the ESLint rules defined in `app/eslint.config.mjs` and the import conventions in the [CODING STYLE](/app/docs/CODEBASE.md), which ESLint doesn't check. Use conventional-commit messages: a lowercase subject with a bulleted body.

Thank you for contributing to the **fumadocs-routes** repository. Your efforts help make route gating in Fumadocs projects simpler for everyone.
