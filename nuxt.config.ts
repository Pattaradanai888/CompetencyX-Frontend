// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint', '@vueuse/nuxt', 'motion-v/nuxt'],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;700&family=Prompt:wght@500;600;700&display=swap',
        },
      ],
    },
  },
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
    // Session-bound pages: always render fresh, never shared-cache.
    '/assessment/**': { ssr: true },
    '/results/**': { ssr: true },
    '/roadmaps/**': { ssr: true },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8000',
    },
  },
  ui: {
    fonts: false,
    colorMode: false,
    experimental: {
      componentDetection: true,
    },
  },
})
