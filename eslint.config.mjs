// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Vendored agent skills are documentation for agents, not app code. They
    // are tracked on purpose (no longer gitignored), so they must be ignored
    // here explicitly rather than through the gitignore-derived defaults. A
    // flat-config object counts as a global ignore only when `ignores` is its
    // sole key, hence the separate object.
    ignores: ['.agents/**'],
  },
  {
    rules: {
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
    },
  },
)
