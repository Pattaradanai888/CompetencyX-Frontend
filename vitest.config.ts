import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
          // A browser against a served app: each step may wait on a real
          // navigation, and the whole file shares one browser.
          testTimeout: 90000,
          hookTimeout: 90000,
          fileParallelism: false,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          testTimeout: 20000,
          // Each file's first mount compiles the page it tests. Five files
          // doing that at once on a small machine or a CI runner pushes the
          // first test of each past its timeout; one file at a time is
          // deterministic and only a little slower.
          fileParallelism: false,
        },
      }),
    ],
  },
})
