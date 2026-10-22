# The Nuxt 4 Production Stack in 2026

Research date: 2026-09-16

This document answers "which dependencies does a Nuxt 4 project use?" as of September 2026 — both what Nuxt 4 itself is built on and what the official/recommended ecosystem looks like. All versions were read from primary sources on research day: the npm registry (`registry.npmjs.org/<pkg>/latest`), GitHub releases/feeds of the relevant repos, and official docs served from nuxt.com, vite.dev, nitro.build, ui.nuxt.com, pinia.vuejs.org and better-auth.com. nuxt.com serves every docs page as raw markdown under `https://nuxt.com/raw/docs/4.x/<path>.md`, which is what was fetched for docs claims.

Versions move; treat the numbers below as a snapshot of 2026-09-16, not a floor or ceiling.

---

## 1. Nuxt 4 core

### Current release line

- Latest release: **nuxt 4.5.2** (2026-08-05). The 4.x line progressed 4.0 (Jul 2025) → 4.1 (Sep 2025) → 4.2 (Oct 2025) → 4.3 (Jan 22, 2026) → 4.4 (Mar 12, 2026) → 4.5 (Jul 18, 2026), roughly one minor every 2–3 months. ([github.com/nuxt/nuxt releases](https://github.com/nuxt/nuxt/releases.atom), [nuxt.com/blog](https://nuxt.com/blog))
- **Nuxt 3 is end-of-life as of July 31, 2026**; the final 3.x release (v3.21.11, 2026-08-05) carries the notice "Nuxt v3 is now end-of-life. Please upgrade to Nuxt v4." ([/blog/v4-5](https://nuxt.com/blog/v4-5), [releases feed](https://github.com/nuxt/nuxt/releases.atom))
- 4.5.1 / 3.21.10 (Jul 27, 2026) were security patches, fixing "server-side RCE and unauthorized component instantiation via server island props". ([nuxt.com/blog](https://nuxt.com/blog), [releases feed](https://github.com/nuxt/nuxt/releases.atom))
- The Nuxt 5 workstream is testable today via `future.compatibilityVersion: 5`. ([/blog/v4-5](https://nuxt.com/blog/v4-5))

### What released Nuxt 4.5.x is built on (npm, `nuxt@4.5.2`)

From the [registry metadata of nuxt@4.5.2](https://registry.npmjs.org/nuxt/latest):

- **vue** `^3.5.40` (current Vue release: **3.5.42**, [registry](https://registry.npmjs.org/vue/latest)) — the Vue 3.5 line
- **vue-router** `^5.2.0` (current: **5.3.1**) — vue-router v5 arrived with Nuxt 4.4 ("We've upgraded to vue-router v5, which removes the dependency on unplugin-vue-router"; "the first major vue-router upgrade since Nuxt 3"). ([/blog/v4-4](https://nuxt.com/blog/v4-4))
- **Server engine:** nuxt 4.5.x depends on **`@nuxt/nitro-server: 4.5.2`**, which in turn pins **nitropack `^2.13.4`** and **h3 `^1.15.11`**. So the _released_ Nuxt 4 line still runs on **Nitro 2 with h3 v1**. ([@nuxt/nitro-server](https://registry.npmjs.org/@nuxt%2Fnitro-server/latest), [nuxt](https://registry.npmjs.org/nuxt/latest))
- **@unhead/vue** `^3.3.1` (Unhead v3 line; main branch catalogs `^3.4.0`)
- **ofetch** `^1.5.1` (the 2.0 rewrite, `2.0.0-alpha.3`, is only cataloged on nuxt main, not released)
- **peerDependencies: rolldown `~1.2.1`** — Vite's Rolldown-based core is a first-class peer of Nuxt itself
- TypeScript is **not** a peer dependency of nuxt (it appears only in Nuxt's own devDependencies as `6.0.3`)

### Nitro 3 / h3 v2 status (the Nuxt 5 path)

- The new **`nitro` package `3.0.260903-beta`** is published in beta and depends on **h3 `^2.0.1-rc.31`**, **srvx `^1.0.3`** and **rolldown `^1.2.7`**. h3's latest published version is still a release candidate: **`2.0.1-rc.32`**. ([nitro](https://registry.npmjs.org/nitro/latest), [h3](https://registry.npmjs.org/h3/latest))
- The nuxt/nuxt main branch already catalogs `nitro: ^3.0.260903-beta` (runtime) and `h3: ^2.0.1-rc.31` (`h3-next`), i.e. **Nitro 3 + h3 v2 is where Nuxt is heading, but no Nuxt 4.x release ships it yet**. ([nuxt/nuxt pnpm-workspace.yaml](https://raw.githubusercontent.com/nuxt/nuxt/main/pnpm-workspace.yaml))
- The Nuxt 4.5 announcement mentions no Nitro 3/h3 v2 change; Nitro appears only in dev-performance and inline-styles notes. ([/blog/v4-5](https://nuxt.com/blog/v4-5))

### Bundler: Vite 8 / Rolldown / Oxc / Rspack

- Nuxt 4.5 moved to **Vite 8** ("faster cold starts, the latest Rolldown-powered internals"). ([/blog/v4-5](https://nuxt.com/blog/v4-5)) Current Vite release: **8.3.0**. ([registry](https://registry.npmjs.org/vite/latest))
- **Vite 8 (Mar 12, 2026) made Rolldown the single, unified, Rust-based bundler**, replacing the old esbuild(dev) + Rollup(build) split ("up to 10-30x faster builds"), with **Oxc as the compiler layer** ("the build tool (Vite), the bundler (Rolldown), and the compiler (Oxc)"). Vite 8 is ESM-only and requires Node 20.19+ / 22.12+. The `rolldown-vite` package remains as a migration vehicle from Vite 7. ([vite.dev/blog/announcing-vite8](https://vite.dev/blog/announcing-vite8); Vite 8.1 followed Jun 23, 2026 — [vite.dev/blog](https://vite.dev/blog/))
- The alternative builder is **Rspack 2, rebuilt on `@rsbuild/core`** — opt-in via `builder: 'rspack'`, dev server "in middleware mode via Rsbuild", described as "Rsbuild all the way down". webpack remains available via `@nuxt/webpack-builder`. ([/blog/v4-5](https://nuxt.com/blog/v4-5))

### TypeScript handling

- **Nuxt does not type-check by default** ("By default, Nuxt doesn't check types when you run `nuxt dev` or `nuxt build`, for performance reasons"). Type checking is done with **`vue-tsc` + `typescript`** via `npx nuxt typecheck`, or continuously with `typescript.typeCheck: true`. ([/raw/docs/4.x/guide/concepts/typescript.md](https://nuxt.com/raw/docs/4.x/guide/concepts/typescript.md))
- Nuxt generates **TypeScript project references** (`tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.server.json`, `tsconfig.shared.json`); the legacy `.nuxt/tsconfig.json` "will be removed in a future version". (same doc)
- Ecosystem TS support in 2026: latest **typescript on npm is 7.0.2** (the native/Go line), nuxt's own repo develops against `typescript: 6.0.3`, **vue-tsc 3.3.11** peers `typescript >=5.0.0` (no upper bound), and **@nuxt/ui peers `typescript ^5.6.3 || ^6.0.0 || ^7.0.0`**. So TS 5/6/7 are all in the supported window; the docs themselves make no version statement. ([registry: typescript](https://registry.npmjs.org/typescript/latest), [vue-tsc](https://registry.npmjs.org/vue-tsc/latest), [@nuxt/ui](https://registry.npmjs.org/@nuxt%2Fui/latest), [nuxt pnpm-workspace.yaml](https://raw.githubusercontent.com/nuxt/nuxt/main/pnpm-workspace.yaml))

### Other Nuxt 4.5 features worth knowing

- **Experimental SSR streaming** (`experimental: { ssrStreaming: true }`): flushes the HTML shell immediately, streams the body; bots excluded automatically; routes using `redirect`/`cache`/`isr`/`swr`/`ssr: false` fall back to buffered rendering. ([/blog/v4-5](https://nuxt.com/blog/v4-5))
- New **`useLayout`** composable (read-only reactive view of the resolved layout). (same)
- Nuxt 4.4 also added `createUseFetch`/`createUseAsyncData` factories and **typed layout props**. ([/blog/v4-4](https://nuxt.com/blog/v4-4))
- The CLI is `@nuxt/cli` (v3.36/v3.37 cited in the 4.5 post); June 2026's "Meet Nuxi" post rebrands the CLI/agent experience. ([nuxt.com/blog](https://nuxt.com/blog))

---

## 2. Official first-party modules (`@nuxt/*`)

Current versions from the npm registry on 2026-09-16 (each linked at its `/latest` endpoint):

| Package               | Version    | What it does                                                                                                                                                        | Source                                                                                                                                               |
| --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@nuxt/ui`            | **4.11.1** | Nuxt UI library: "125+ accessible, TypeScript components", built on Reka UI + Tailwind Variants, MIT. v4 (Sep 2025) merged Nuxt UI and UI Pro into one free library | [registry](https://registry.npmjs.org/@nuxt%2Fui/latest), [ui.nuxt.com](https://ui.nuxt.com/), [nuxt.com/blog](https://nuxt.com/blog)                |
| `@nuxt/image`         | **2.1.0**  | Image optimization module ("Nuxt Image Module"); v2 (Nov 2025) added TS support and IPX v3                                                                          | [registry](https://registry.npmjs.org/@nuxt%2Fimage/latest), [nuxt.com/blog](https://nuxt.com/blog)                                                  |
| `@nuxt/content`       | **3.16.0** | "Write your content inside your Nuxt app" — file-based CMS/markdown content                                                                                         | [registry](https://registry.npmjs.org/@nuxt%2Fcontent/latest)                                                                                        |
| `@nuxt/fonts`         | **0.14.0** | "Automatic font configuration for Nuxt apps" (still pre-1.0)                                                                                                        | [registry](https://registry.npmjs.org/@nuxt%2Ffonts/latest)                                                                                          |
| `@nuxt/icon`          | **2.5.1**  | "The `<Icon>` component, supporting Iconify, Emojis and custom components"                                                                                          | [registry](https://registry.npmjs.org/@nuxt%2Ficon/latest), [github.com/nuxt/icon](https://api.github.com/repos/nuxt/icon)                           |
| `@nuxt/scripts`       | **1.3.9**  | "Load third-party scripts with better performance, privacy and DX in Nuxt Apps"                                                                                     | [registry](https://registry.npmjs.org/@nuxt%2Fscripts/latest)                                                                                        |
| `@nuxt/hints`         | **1.1.4**  | "Nuxt module that shows hints for aspects of your application such as Performance, Security, and more!"                                                             | [registry](https://registry.npmjs.org/@nuxt%2Fhints/latest)                                                                                          |
| `@nuxt/eslint`        | **1.17.0** | "Generate ESLint config from current Nuxt settings" (project-aware flat config; ships `@nuxt/eslint-config` + `@nuxt/eslint-plugin`; docs at eslint.nuxt.com)       | [registry](https://registry.npmjs.org/@nuxt%2Feslint/latest), [github.com/nuxt/eslint](https://raw.githubusercontent.com/nuxt/eslint/main/README.md) |
| `@nuxt/test-utils`    | **4.3.2**  | Test utilities giving "first-class support for end-to-end and unit testing" of Nuxt apps                                                                            | [registry](https://registry.npmjs.org/@nuxt%2Ftest-utils/latest), [testing docs](https://nuxt.com/raw/docs/4.x/getting-started/testing.md)           |
| `@nuxtjs/tailwindcss` | **6.14.0** | Legacy "Tailwind CSS module for Nuxt" (Tailwind v3-era; still published, not npm-deprecated, but superseded by the Tailwind v4 + `@nuxt/ui` flow)                   | [registry](https://registry.npmjs.org/@nuxtjs%2Ftailwindcss/latest)                                                                                  |

**`@nuxt/jsdom` / `@nuxt/happy-dom`: these packages do not exist** (npm returns 404 for both). In 2026 the DOM environments are consumed directly as **optional peer dependencies of `@nuxt/test-utils`**: `happy-dom >=20.0.11` (the default) or `jsdom >=27.4.0`. ([npm 404s](https://registry.npmjs.org/@nuxt%2Fjsdom/latest), [@nuxt/test-utils](https://registry.npmjs.org/@nuxt%2Ftest-utils/latest))

Notable `@nuxt/ui` internals (from its [registry metadata](https://registry.npmjs.org/@nuxt%2Fui/latest)): `reka-ui 2.10.4` (pinned), `tailwind-variants ^3.2.2`, `motion-v ^2.4.2`, `@tanstack/vue-table ^8.21.3`, `@vueuse/core ^14.4.0`, TipTap `^3.31.3` for the rich editor; peers `tailwindcss ^4.0.0`.

---

## 3. State management

- The Nuxt state-management docs remain built around `useState` ("an SSR-friendly `ref` replacement"), `callOnce`, and `clearNuxtState`, and state clearly: **"Nuxt is not opinionated about state management"**, listing **Pinia — "the official Vue recommendation"** — plus Harlem and XState. Pinia is added with `npx nuxt module add pinia`. **Pinia Colada is not mentioned** in that doc. ([/raw/docs/4.x/getting-started/state-management.md](https://nuxt.com/raw/docs/4.x/getting-started/state-management.md))
- **Pinia 4** is the current line: v4.0.0 (Jul 14, 2026) was "only technically breaking changes: ESM only" plus a devtools-api upgrade; latest is **4.0.3** (Aug 12, 2026, adds Nuxt 5 compatibility). The Nuxt integration package **`@pinia/nuxt` 1.0.2** and **`@pinia/testing` 2.0.1** ship alongside. ([github.com/vuejs/pinia releases](https://github.com/vuejs/pinia/releases.atom), [registry: pinia](https://registry.npmjs.org/pinia/latest))
- **`@pinia/colada` 1.4.4** ("The smart data fetching layer for Vue.js") is a stable v1 — the Pinia team's query/cache layer — but it is an _adjacent_ option, not something the Nuxt docs push. ([registry](https://registry.npmjs.org/@pinia%2Fcolada/latest), [pinia.vuejs.org](https://pinia.vuejs.org/))

---

## 4. Styling: Tailwind CSS and @nuxt/ui

- Current Tailwind: **tailwindcss 4.3.3** — the v4 line (CSS-first config, `@tailwindcss/vite`). ([registry](https://registry.npmjs.org/tailwindcss/latest))
- **`@nuxt/ui` v4 is the first-party styling layer**: its peer range is `tailwindcss ^4.0.0` and it itself depends on `tailwindcss ^4.3.3` + `tailwind-merge ^3.6.0`, with theming via **Tailwind Variants + CSS variables** and accessible primitives from **Reka UI** ("WAI-ARIA compliant primitives"). Install: `npx nuxt module add ui` (Nuxt) or `@nuxt/ui` + `@nuxt/ui/vite` (plain Vue). ([@nuxt/ui registry](https://registry.npmjs.org/@nuxt%2Fui/latest), [ui.nuxt.com](https://ui.nuxt.com/))
- Since v4, **Nuxt UI and Nuxt UI Pro are one MIT-licensed package** ("Free and open source, MIT licensed" — no Pro tier on the site); the merger was announced Sep 22, 2025. ([ui.nuxt.com](https://ui.nuxt.com/), [nuxt.com/blog](https://nuxt.com/blog))
- The old `@nuxtjs/tailwindcss` module (6.14.0) still exists but belongs to the Tailwind v3 era; nothing in the current first-party story depends on it. ([registry](https://registry.npmjs.org/@nuxtjs%2Ftailwindcss/latest))

---

## 5. Testing

From the [official testing doc](https://nuxt.com/raw/docs/4.x/getting-started/testing.md) and [@nuxt/test-utils 4.3.2 metadata](https://registry.npmjs.org/@nuxt%2Ftest-utils/latest):

- **Vitest is the recommended runner** and the only one supported for the Nuxt runtime environment ("It currently _only has support for vitest_"). E2E can use Vitest, Jest, Cucumber or Playwright. Current **vitest: 5.0.1**; `@nuxt/test-utils` peers `vitest ^4.0.2 || ^5.0.0`, so v4 and v5 both work. ([testing doc](https://nuxt.com/raw/docs/4.x/getting-started/testing.md), [registry: vitest](https://registry.npmjs.org/vitest/latest))
- The documented layout is **Vitest projects**: `test/unit/` (plain Node env), `test/nuxt/` (`environment: 'nuxt'` via `defineVitestProject`, with Nuxt aliases/auto-import types), `test/e2e/` (Node project using `@nuxt/test-utils/e2e`'s `setup()`). Mixing runtime and E2E imports in one file is unsupported (use `.nuxt.spec.ts` or split files). (testing doc)
- **DOM environments**: `happy-dom` is the **default**, `jsdom` optional; built-in mocks for `intersectionObserver` (on) and `indexedDb` (off, via fake-indexeddb). (testing doc)
- **Helpers**: `mountSuspended` (wraps `@vue/test-utils`), `renderSuspended` (Testing Library), `mockNuxtImport`, `mockComponent`, `registerEndpoint`; E2E APIs `$fetch`, `url`, `createPage`, server-log access. (testing doc)
- **Browser/E2E story**: first-class **Playwright Test Runner** support via `@nuxt/test-utils/playwright` (`@playwright/test ^1.43.1`), plus **Vitest Browser Mode** via `@nuxt/test-utils/browser` with `@vitest/browser-playwright` (render, `locator`, `setupState`, `emitted()`, `rerender()`). The nuxt/nuxt repo itself develops against `@playwright/test 1.63.0`. (testing doc, [@nuxt/test-utils](https://registry.npmjs.org/@nuxt%2Ftest-utils/latest), [nuxt pnpm-workspace.yaml](https://raw.githubusercontent.com/nuxt/nuxt/main/pnpm-workspace.yaml))

---

## 6. Linting and formatting

- **`@nuxt/eslint` 1.17.0** is the official integration: a Nuxt module that generates a **project-aware ESLint (flat) config** from your Nuxt settings (auto-imports, routes, etc.), alongside static `@nuxt/eslint-config` and `@nuxt/eslint-plugin`; docs at eslint.nuxt.com. Peer range: **`eslint ^9.0.0 || ^10.0.0`**. Current ESLint on npm: **10.10.0** (nuxt's own repo pins `eslint: 10.10.0`). It also powers `eslint-typegen` and ships the config-inspector integration. ([@nuxt/eslint](https://registry.npmjs.org/@nuxt%2Feslint/latest), [registry: eslint](https://registry.npmjs.org/eslint/latest), [README](https://raw.githubusercontent.com/nuxt/eslint/main/README.md))
- **Formatters:** neither the @nuxt/eslint README nor the checked nuxt.com docs pages mention Prettier, oxlint, or Biome — **there is no official Nuxt endorsement of oxlint/Biome in the sources checked**. Prettier remains an external choice teams make themselves (this repo uses it via `prettier . --write`). If you want a source-backed statement: there isn't one; formatting is left outside the Nuxt integration. ([README](https://raw.githubusercontent.com/nuxt/eslint/main/README.md))
- Knip (unused-dependency detection) is used inside the nuxt/nuxt monorepo itself, but is a general dev tool, not Nuxt-specific. ([nuxt pnpm-workspace.yaml](https://raw.githubusercontent.com/nuxt/nuxt/main/pnpm-workspace.yaml))

---

## 7. Deployment (Nitro presets)

From the [Nuxt deployment doc](https://nuxt.com/raw/docs/4.x/getting-started/deployment.md) and [nitro.build/deploy](https://nitro.build/deploy):

- **Default preset: `node-server`** — `.output/server/index.mjs`, run with `node .output/server/index.mjs`; `NITRO_PORT`/`NITRO_HOST` env vars; `node_cluster` preset for multi-process scaling. Preset selection: `nitro: { preset: 'node-server' }` in nuxt.config or `NITRO_PRESET=... nuxt build`.
- **Cloud presets are auto-detected** ("Nitro tries to detect the provider environment and set the right preset automatically"). Zero-config documented providers: **Vercel, Netlify, Cloudflare, AWS Amplify, Azure, Firebase App Hosting, Stormkit, Zeabur**; others (e.g. `cloudflare_pages`) via explicit `NITRO_PRESET` / `--preset` / config. Preset behavior is tied to `compatibilityDate`.
- **Static**: `nuxt generate` = full SSG (prerenders routes, emits `_payload.json` for client navigation, plus `200.html`/`404.html` fallbacks); `nuxt build --prerender` also emits the fallbacks; `ssr: false` produces an SPA shell. (deployment doc)
- nuxt.com/deploy is a directory of **24 per-platform guides** (Vercel, Netlify, Cloudflare, Deno Deploy, GitHub/GitLab Pages, Render, Railway-adjacent hosts like Northflank/Zerops/Koyeb, IIS, SST for AWS, etc.). ([nuxt.com/deploy](https://nuxt.com/deploy))
- New in 2026 relevant to serving: experimental **SSR streaming** for lower TTFB (see section 1). ([/blog/v4-5](https://nuxt.com/blog/v4-5))

---

## 8. Common production add-ons the docs/ecosystem point to

### Auth

- **`nuxt-auth-utils` 0.5.30** — "Add Authentication to Nuxt applications with secured & sealed cookies sessions"; maintained by **atinux and danielroe** (Nuxt team members). It is a community module by the framework's own people, not an `@nuxt/*` package. ([registry](https://registry.npmjs.org/nuxt-auth-utils/latest))
- **`@sidebase/nuxt-auth` 1.3.1** — NextAuth-style auth module ("Authentication built for Nuxt 3! ... OAuth providers, credentials or Email Magic URLs"). ([registry](https://registry.npmjs.org/@sidebase%2Fnuxt-auth/latest))
- **better-auth 1.7.5** ("The most comprehensive authentication framework for TypeScript") documents an official **Nuxt integration**: catch-all Nitro route `server/api/auth/[...all].ts` calling `auth.handler(toWebRequest(event))`, a client created from **`better-auth/vue`** (`useSession` returns refs), `authClient.useSession(useFetch)` for SSR cookie forwarding, route middleware + `auth.api.getSession` for server protection — and it links to the first-party module repo **`nuxt-modules/better-auth`**. ([better-auth.com/docs/integrations/nuxt](https://www.better-auth.com/docs/integrations/nuxt), [registry](https://registry.npmjs.org/better-auth/latest))

### Database / ORM

- **drizzle-orm 0.45.2** is the current release line. Drizzle has no dedicated Nuxt guide on orm.drizzle.team, but **NuxtHub Database — the Nuxt ecosystem's own SQL database product — is "powered by Drizzle ORM"** (`drizzle-orm` + `drizzle-kit`, schemas in `server/db/schema.ts`, migrations via `npx nuxt db generate`, `postgresql`/`mysql`/`sqlite` dialects). ([registry](https://registry.npmjs.org/drizzle-orm/latest), [hub.nuxt.com/docs/database](https://hub.nuxt.com/docs/database))
- **Prisma's official Nuxt module `@prisma/nuxt` (0.3.0) is deprecated** ("Package no longer supported"). ([registry](https://registry.npmjs.org/@prisma%2Fnuxt/latest))

### Forms / validation

- **zod 4.6.5** (v4 line) and **valibot 1.5.0** are the current schema/validation libraries in the Vue/Nuxt orbit; @nuxt/ui's Form component is schema-agnostic and pairs with either. ([registry: zod](https://registry.npmjs.org/zod/latest), [registry: valibot](https://registry.npmjs.org/valibot/latest))

---

## How this repo compares

Anchor: `D:\Flook\SE\Personal Project\Competency\CompentencyX-Frontend\package.json` (researched 2026-09-16).

| Package                          | This repo                        | Ecosystem latest (2026-09-16)                                        | Verdict                                                                                                  |
| -------------------------------- | -------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `nuxt`                           | `^4.4.5`                         | 4.5.2                                                                | The caret range resolves into the current 4.5.x line; effectively current                                |
| `vue`                            | `^3.5.34`                        | 3.5.42 (nuxt wants `^3.5.40`)                                        | Fine; `nuxt` will pull ≥3.5.40 itself                                                                    |
| `vue-router`                     | `^5.0.6`                         | 5.3.1                                                                | Same v5 line Nuxt 4.4+ standardized on                                                                   |
| `@nuxt/ui`                       | `^4.7.0`                         | 4.11.1                                                               | Current major; caret picks up patches/minors                                                             |
| `tailwindcss`                    | `^4.3.0`                         | 4.3.3                                                                | Current v4 line; matches `@nuxt/ui` v4's requirement                                                     |
| `@vueuse/core`                   | `^14.3.0` (+ `@vueuse/nuxt`)     | 14.4.0                                                               | Current major                                                                                            |
| `motion-v`                       | `^2.2.1`                         | `@nuxt/ui` itself depends on `motion-v ^2.4.2`                       | Consistent with the ecosystem                                                                            |
| `@nuxt/eslint`                   | `1.15.2` (pinned)                | 1.17.0                                                               | One minor behind; peer range `eslint ^9 \|\| ^10` unaffected                                             |
| `eslint`                         | `^10.3.0`                        | 10.10.0                                                              | Same ESLint 10 line Nuxt's repo uses                                                                     |
| `typescript`                     | `~5.9.3` (pinned)                | 7.0.2 latest; nuxt repo uses 6.0.3                                   | Deliberate conservative pin; `vue-tsc` (>=5.0.0) and `@nuxt/ui` (^5.6.3 \|\| ^6 \|\| ^7) would allow 6/7 |
| `vue-tsc`                        | `^3.3.11`                        | 3.3.11                                                               | Current                                                                                                  |
| `vitest`                         | `^4.1.6`                         | 5.0.1                                                                | One major behind; `@nuxt/test-utils` supports both `^4` and `^5`                                         |
| `@nuxt/test-utils`               | `^4.0.3`                         | 4.3.2                                                                | Same major                                                                                               |
| `@vue/test-utils`                | `^2.4.10`                        | current 2.x                                                          | Fine                                                                                                     |
| `happy-dom`                      | `^20.9.0`                        | `@nuxt/test-utils` peer wants `>=20.0.11` (nuxt repo uses 20.14.5)   | Satisfied                                                                                                |
| `playwright-core`                | `^1.60.0`                        | `@playwright/test` 1.63.0 in nuxt repo                               | Slightly behind, same 1.x line                                                                           |
| `knip` / `lefthook` / `prettier` | `^6.35.1` / `^2.1.14` / `^3.8.3` | not part of the official Nuxt stack                                  | Repo-specific tooling; knip is at least used by nuxt/nuxt itself                                         |
| `pnpm@10.28.0`, Node `>=22`      | —                                | nuxt repo: `pnpm@12.4.1`; Vite 8/Nitro 3 floor is Node 20.19+/22.12+ | Repo's Node floor is already the modern one                                                              |

Overall: this repo tracks the 2026 mainstream Nuxt 4 stack closely. The only deliberate divergences are the `typescript ~5.9` pin (below the 6/7 lines the ecosystem now supports) and `vitest ^4` (v5 exists, but is a drop-in as far as `@nuxt/test-utils` is concerned). Nothing in the repo predates Nuxt 4; the `tailwindcss ^4 + @nuxt/ui ^4` pairing and the Vitest three-project layout (`test/unit`, `test/nuxt`, `test/e2e`) match the documented 2026 recommendations exactly.

### Notes/caveats

- The docs-site URL structure used here (`https://nuxt.com/raw/docs/4.x/<path>.md`) is the current raw-markdown mirror of nuxt.com docs; the old recipe path for ESLint (e.g. `guide/recipes/eslint`) returned 404 — ESLint guidance now lives in the module docs at eslint.nuxt.com.
- "Vitest browser mode vs Playwright": both are documented as supported paths; the docs present Playwright (via `@nuxt/test-utils/playwright`) for full E2E and Vitest Browser Mode (via `@nuxt/test-utils/browser`) for component-level browser tests. Neither is deprecated.
- Nothing called `@nuxt/jsdom` or `@nuxt/happy-dom` exists; if you see those names in older advice, the 2026 reality is optional peer deps on `@nuxt/test-utils`.

---

## Sources

- https://github.com/nuxt/nuxt/releases.atom
- https://raw.githubusercontent.com/nuxt/nuxt/main/pnpm-workspace.yaml
- https://nuxt.com/blog
- https://nuxt.com/blog/v4-5
- https://nuxt.com/blog/v4-4
- https://registry.npmjs.org/nuxt/latest
- https://registry.npmjs.org/@nuxt/nitro-server/latest
- https://registry.npmjs.org/nitro/latest
- https://registry.npmjs.org/nitropack/latest
- https://registry.npmjs.org/h3/latest
- https://registry.npmjs.org/vue/latest
- https://registry.npmjs.org/vue-router/latest
- https://registry.npmjs.org/vite/latest
- https://registry.npmjs.org/typescript/latest
- https://registry.npmjs.org/vue-tsc/latest
- https://registry.npmjs.org/@nuxt/ui/latest
- https://registry.npmjs.org/tailwindcss/latest
- https://registry.npmjs.org/@nuxtjs/tailwindcss/latest
- https://registry.npmjs.org/@nuxt/image/latest
- https://registry.npmjs.org/@nuxt/content/latest
- https://registry.npmjs.org/@nuxt/fonts/latest
- https://registry.npmjs.org/@nuxt/icon/latest
- https://registry.npmjs.org/@nuxt/scripts/latest
- https://registry.npmjs.org/@nuxt/hints/latest
- https://registry.npmjs.org/@nuxt/eslint/latest
- https://registry.npmjs.org/@nuxt/test-utils/latest
- https://registry.npmjs.org/@nuxt/jsdom/latest (404 — package does not exist)
- https://registry.npmjs.org/@nuxt/happy-dom/latest (404 — package does not exist)
- https://registry.npmjs.org/pinia/latest
- https://registry.npmjs.org/@pinia/colada/latest
- https://registry.npmjs.org/vitest/latest
- https://registry.npmjs.org/eslint/latest
- https://registry.npmjs.org/@vueuse/core/latest
- https://registry.npmjs.org/nuxt-auth-utils/latest
- https://registry.npmjs.org/@sidebase/nuxt-auth/latest
- https://registry.npmjs.org/better-auth/latest
- https://registry.npmjs.org/drizzle-orm/latest
- https://registry.npmjs.org/@prisma/nuxt/latest
- https://registry.npmjs.org/zod/latest
- https://registry.npmjs.org/valibot/latest
- https://github.com/vuejs/pinia/releases.atom
- https://api.github.com/repos/nuxt/icon
- https://raw.githubusercontent.com/nuxt/eslint/main/README.md
- https://nuxt.com/raw/docs/4.x/getting-started/deployment.md
- https://nuxt.com/raw/docs/4.x/getting-started/testing.md
- https://nuxt.com/raw/docs/4.x/getting-started/state-management.md
- https://nuxt.com/raw/docs/4.x/guide/concepts/typescript.md
- https://nuxt.com/deploy
- https://nitro.build/deploy
- https://vite.dev/blog/
- https://vite.dev/blog/announcing-vite8
- https://ui.nuxt.com/
- https://pinia.vuejs.org/
- https://www.better-auth.com/docs/integrations/nuxt
- https://hub.nuxt.com/docs/database
