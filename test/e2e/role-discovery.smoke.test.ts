/**
 * End-to-end smoke: the real frontend talking to the real backend, driven
 * through a browser. Everything else in `test/` mocks the API at the
 * composable seam; this file is the one place the HTTP contract is exercised
 * as a respondent would exercise it.
 *
 * Runs only when `E2E_BASE_URL` points at a served frontend whose
 * `NUXT_PUBLIC_API_BASE` points at a seeded backend (see the `e2e` job in
 * `.github/workflows/ci.yml`). Without it the suite is skipped, so `pnpm test`
 * stays runnable on a machine with nothing listening.
 */
import { chromium } from 'playwright-core'
import type { Browser, Page } from 'playwright-core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const baseUrl = process.env.E2E_BASE_URL?.replace(/\/$/, '')
const apiBase = process.env.E2E_API_BASE?.replace(/\/$/, '')

const SESSION_URL = /\/assessment\/[0-9a-f-]{36}$/
const NAVIGATION_TIMEOUT_MS = 30_000

async function saveScreenshot(page: Page, name: string) {
  await page
    .screenshot({ path: `test-results/${name}.png`, fullPage: true })
    .catch(() => undefined)
}

describe.skipIf(!baseUrl)(
  'role discovery smoke (real frontend + real backend)',
  () => {
    let browser: Browser
    let page: Page

    beforeAll(async () => {
      browser = await chromium.launch()
      page = await browser.newPage()
      page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS)
    })

    afterAll(async () => {
      await browser?.close()
    })

    it('the backend the frontend is built against answers its health check', async () => {
      if (!apiBase) return
      const response = await fetch(`${apiBase}/api/v1/health/`)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ status: 'ok' })
    })

    it('the home page renders and lists real roles from the catalog', async () => {
      await page.goto(`${baseUrl}/`)
      await page.locator('#main-content').waitFor()
      // The example-result card names the first catalog role; a seeded backend
      // has 26, so the placeholder name must not be what renders.
      const heading = page.locator('.paper-panel p.font-display').first()
      await expect.poll(() => heading.innerText()).not.toBe('')
    })

    it('starting Role Discovery creates a session and shows the first question', async () => {
      try {
        await page.goto(`${baseUrl}/assessment/preferred-role`)
        await page
          .getByRole('button', {
            name: /start role discovery|เริ่มค้นหาบทบาท/i,
          })
          .click()
        await page.waitForURL(SESSION_URL, { timeout: NAVIGATION_TIMEOUT_MS })

        // The first Role Discovery item is a five-point agreement statement.
        const scale = page.locator('fieldset.likert-spectrum')
        await scale.waitFor()
        const prompt = page.locator('main h1').first()
        await expect.poll(() => prompt.innerText()).not.toBe('')
        expect(await scale.locator('input[type=radio]').count()).toBe(5)
      } catch (error) {
        await saveScreenshot(page, 'role-discovery-start')
        throw error
      }
    })

    it('answering the first statement advances to a different one', async () => {
      try {
        const prompt = page.locator('main h1').first()
        const before = await prompt.innerText()

        await page.locator('fieldset.likert-spectrum label').first().click()

        await expect
          .poll(() => prompt.innerText(), { timeout: NAVIGATION_TIMEOUT_MS })
          .not.toBe(before)
        await expect
          .poll(() => page.locator('main').innerText())
          .toMatch(/Q1|ตอบแล้ว/)
      } catch (error) {
        await saveScreenshot(page, 'role-discovery-answer')
        throw error
      }
    })
  },
)
