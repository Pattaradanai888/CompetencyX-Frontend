// https://nuxt.com/docs/api/configuration/nuxt-config
const apiBase = process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8000'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  features: { inlineStyles: true },
  modules: ['@nuxt/ui', '@nuxt/eslint', '@vueuse/nuxt', 'motion-v/nuxt'],
  nitro: {
    // Pre-compress static assets (JS/CSS/fonts) so the node server can serve
    // gzip/brotli without a reverse proxy in front.
    compressPublicAssets: true,
  },
  fonts: {
    families: [
      { name: 'IBM Plex Mono', provider: 'google', weights: [400, 500] },
      { name: 'Noto Sans Thai', provider: 'google', weights: [400, 700] },
    ],
  },
  routeRules: {
    '/**': {
      headers: {
        'content-security-policy': "frame-ancestors 'none'",
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
      },
    },
    // Session-bound pages: always render fresh, never shared-cache.
    '/assessment/**': { ssr: true },
    '/results/**': { ssr: true },
    '/roadmaps/**': { ssr: true },
    '/fonts/**': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
  },
  $development: {
    routeRules: {
      '/api/v1/**': { proxy: `${apiBase}/api/v1/**` },
    },
  },
  runtimeConfig: {
    public: {
      apiBase,
    },
  },
  vite: {
    server: {
      allowedHosts: ['p51jrjjz-3000.asse.devtunnels.ms'],
    },
  },
  ui: {
    colorMode: false,
    experimental: {
      componentDetection: true,
    },
  },
})
