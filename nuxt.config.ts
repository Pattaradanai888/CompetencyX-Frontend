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
    // Page HTML includes cookie-dependent language and account state. Keep it
    // out of shared CDN caches; hashed static assets retain their own caching.
    '/': { headers: { 'cache-control': 'private, no-store' } },
    '/assessment/**': {
      ssr: true,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/results/**': {
      ssr: true,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/roadmaps/**': {
      ssr: true,
      headers: { 'cache-control': 'private, no-store' },
    },
    '/account/**': {
      headers: { 'cache-control': 'private, no-store' },
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
