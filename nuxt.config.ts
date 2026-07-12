// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint', '@vueuse/nuxt', 'motion-v/nuxt'],
  nitro: {
    // Pre-compress static assets (JS/CSS/fonts) so the node server can serve
    // gzip/brotli without a reverse proxy in front.
    compressPublicAssets: true,
  },
  fonts: {
    families: [
      { name: 'Anuphan', provider: 'google', weights: [400, 500, 700] },
      { name: 'Prompt', provider: 'google', weights: [500, 600, 700] },
    ],
  },
  routeRules: {
    // Session-bound pages: always render fresh, never shared-cache.
    '/assessment/**': { ssr: true },
    '/results/**': { ssr: true },
    '/roadmaps/**': { ssr: true },
  },
  // SWR caching is production-only: in dev the Nitro cache driver writes to
  // .nuxt/cache (breaks on Windows) and cached routes trigger _payload.json
  // fetches on every client navigation.
  $production: {
    routeRules: {
      // Public pages: SWR-cache the SSR HTML, keyed by cookie because the
      // rendered language depends on the cx-locale cookie.
      '/': { cache: { swr: true, maxAge: 3600, varies: ['cookie'] } },
      '/assessment/start': {
        cache: { swr: true, maxAge: 3600, varies: ['cookie'] },
      },
      '/assessment/preferred-role': {
        cache: { swr: true, maxAge: 3600, varies: ['cookie'] },
      },
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8000',
    },
  },
  ui: {
    colorMode: false,
    experimental: {
      componentDetection: true,
    },
  },
})
