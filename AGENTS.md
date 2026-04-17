# Repository Guidelines

## Project Structure & Module Organization
This repository is a minimal Nuxt 4 application. App code lives in `app/`, with the root UI currently starting at `app/app.vue`. Static assets belong in `public/` and are served as-is, for example `public/favicon.ico`. Tests are organized under `test/` and should follow the existing Vitest project split: `test/unit/`, `test/e2e/`, and `test/nuxt/`.

## Build, Test, and Development Commands
Use `pnpm` for local work because `pnpm-lock.yaml` is committed.

- `pnpm dev` runs the Nuxt dev server on `http://localhost:3000`.
- `pnpm build` creates the production build.
- `pnpm preview` serves the production build locally.
- `pnpm generate` generates a static build when needed.
- `pnpm lint` runs ESLint across the repo.
- `pnpm lint:fix` applies safe ESLint fixes.
- `pnpm format` formats files with Prettier.
- `pnpm format:check` verifies formatting in CI or before a PR.

If you add tests, expose them through `package.json` scripts so contributors do not need to remember raw Vitest commands.

## Coding Style & Naming Conventions
Follow the current Prettier config: single quotes and no semicolons. Use the default Nuxt ESLint rules from `@nuxt/eslint`; run linting before opening a PR. Prefer TypeScript for new logic, PascalCase for Vue components, and kebab-case for route-like file names and static asset names. Keep components small and colocate future composables, utilities, and tests in clearly named directories.

## Testing Guidelines
Vitest is configured in `vitest.config.ts` with three projects:

- `unit` for isolated logic in `test/unit/*.{test,spec}.ts`
- `e2e` for end-to-end coverage in `test/e2e/*.{test,spec}.ts`
- `nuxt` for framework-aware tests in `test/nuxt/*.{test,spec}.ts`

Name new tests `*.test.ts` or `*.spec.ts`. Cover behavior that changes user-visible output, routing, or Nuxt integration points.

## Commit & Pull Request Guidelines
This repository has Git initialized but no commit history yet, so there is no established convention to copy. Start with short, imperative commit subjects such as `feat: add landing hero` or `fix: correct route announcer usage`. Keep pull requests focused, describe the change and validation steps, and include screenshots for UI changes.

## Configuration Notes
Core project settings live in `nuxt.config.ts`. Update `compatibilityDate` and module registrations deliberately, and avoid committing generated folders such as `.nuxt/` or local package stores.
