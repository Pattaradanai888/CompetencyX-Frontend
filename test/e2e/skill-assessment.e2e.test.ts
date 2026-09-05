/**
 * End-to-end: the two flows the Role Discovery smoke leaves out, driven
 * through a real browser against the real frontend and a seeded backend.
 *
 * 1. A respondent who already knows their role answers the Skill Assessment
 *    until the backend stops asking (ADR-0005) and lands on the finished
 *    view: next topics listed, and the notice that marking needs an account.
 * 2. A respondent registers in the browser, completes a session while signed
 *    in, marks a suggested topic as already held, sees it leave the
 *    suggestions and join the marked list, then undoes the mark.
 *
 * Marks belong to the account and are read from the *session's* owner, so
 * the second flow completes its own session after registering rather than
 * reusing the anonymous one from the first.
 *
 * Runs only when `E2E_BASE_URL` points at a served frontend whose
 * `NUXT_PUBLIC_API_BASE` points at a seeded backend (see the `e2e` job in
 * `.github/workflows/ci.yml`). Without it the suite is skipped. A failing
 * test saves a full-page screenshot under `test-results/`.
 */
import { chromium } from 'playwright-core'
import type { Browser, BrowserContext, Page } from 'playwright-core'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

const baseUrl = process.env.E2E_BASE_URL?.replace(/\/$/, '')

/**
 * The seeded role with the smallest catalog (eight Assessable Topic Sets), so
 * the floor and the ceiling both collapse to eight and the run stays short.
 */
const ROLE_SLUG = 'ai-data-scientist'
const ROADMAP_URL = /\/roadmaps\/[0-9a-f-]{36}$/
const STEP_TIMEOUT_MS = 30_000
/** The backend's ceiling is twenty; a loop past it is a bug, not patience. */
const MAX_ANSWERS = 25

const ROLE_NAME = 'AI and Data Scientist'
const ROLE_CARD = new RegExp(`^(Select|เลือก) ${ROLE_NAME}$`)
const START_BUTTON = /start skill assessment|เริ่มประเมิน/i
const MARK_BUTTON = /I already know this|ฉันทำส่วนนี้ได้แล้ว/i
const UNDO_BUTTON = /Undo mark|ยกเลิกการระบุ/i

function screenshotName(testName: string) {
  return testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

async function saveScreenshot(page: Page | undefined, name: string) {
  if (!page) return
  await page
    .screenshot({ path: `test-results/${name}.png`, fullPage: true })
    .catch(() => undefined)
}

/** The second scale option: a low rating keeps every set a gap, so the suggestions are never empty. */
function enabledLowOption(page: Page) {
  return page.locator('.skill-assessment-scale__option:not([disabled])').nth(1)
}

/** Choose the role on the start page, as a respondent would, then start. */
async function startAssessment(page: Page) {
  await page.goto(`${baseUrl}/assessment/start`)
  await page.getByRole('button', { name: ROLE_CARD }).click()
  await page.waitForURL(new RegExp(`role=${ROLE_SLUG}`), {
    timeout: STEP_TIMEOUT_MS,
  })
  // The label only reads "start" once a role is selected, so this waits too.
  await page.getByRole('button', { name: START_BUTTON }).first().click()
  await page.waitForURL(ROADMAP_URL, { timeout: STEP_TIMEOUT_MS })
}

/**
 * Answer one item at a time until the finished view appears. Each click is
 * followed by a wait for either a *different* prompt or the finished view,
 * so the same item is never answered twice and the loop never runs ahead of
 * the backend's next-question decision.
 */
async function answerUntilFinished(page: Page): Promise<number> {
  const finished = page.getByTestId('next-topics')
  const prompt = page.locator('.skill-assessment-question-card__prompt')
  const promptText = () =>
    prompt
      .first()
      .textContent({ timeout: 1_000 })
      .catch(() => null)

  let answered = 0
  while (answered < MAX_ANSWERS) {
    await expect
      .poll(
        async () =>
          (await finished.isVisible()) ||
          (await enabledLowOption(page).isVisible()),
        { timeout: STEP_TIMEOUT_MS },
      )
      .toBe(true)
    if (await finished.isVisible()) return answered

    const before = await promptText()
    await enabledLowOption(page).click()
    answered += 1

    await expect
      .poll(
        async () =>
          (await finished.isVisible()) || (await promptText()) !== before,
        { timeout: STEP_TIMEOUT_MS },
      )
      .toBe(true)
  }
  throw new Error(
    `answered ${MAX_ANSWERS} items and the backend still asked for more`,
  )
}

async function nextTopicTitles(page: Page) {
  return await page.getByTestId('next-topic-item').locator('h3').allInnerTexts()
}

async function markedTopicTitles(page: Page) {
  return await page
    .getByTestId('recently-marked-list')
    .locator('li .font-semibold')
    .allInnerTexts()
}

describe.skipIf(!baseUrl)(
  'skill assessment and held-topic marking (real frontend + real backend)',
  () => {
    let browser: Browser
    let context: BrowserContext | undefined
    let page: Page | undefined

    beforeAll(async () => {
      browser = await chromium.launch()
    })

    // A fresh context per test: the first flow must be anonymous and the
    // second signs in, so neither may inherit the other's cookies.
    beforeEach(async ({ task, onTestFailed }) => {
      context = await browser.newContext()
      page = await context.newPage()
      page.setDefaultTimeout(STEP_TIMEOUT_MS)
      onTestFailed(async () => {
        await saveScreenshot(page, screenshotName(task.name))
      })
    })

    afterEach(async () => {
      await context?.close()
      context = undefined
      page = undefined
    })

    afterAll(async () => {
      await browser?.close()
    })

    it('a respondent who knows their role answers until the backend stops asking and lands on the finished view', async () => {
      await startAssessment(page!)

      const answered = await answerUntilFinished(page!)
      expect(answered).toBeGreaterThan(0)

      // Between one and five next topics, in the order the backend chose.
      const titles = await nextTopicTitles(page!)
      expect(titles.length).toBeGreaterThanOrEqual(1)
      expect(titles.length).toBeLessThanOrEqual(5)
      expect(new Set(titles).size).toBe(titles.length)

      // Signed out: the control is absent and the notice takes its place.
      const notice = page!.getByTestId('mark-requires-account')
      await notice.waitFor()
      expect((await notice.innerText()).trim()).not.toBe('')
      expect(
        await page!.getByRole('button', { name: MARK_BUTTON }).count(),
      ).toBe(0)
    })

    it('a respondent who registers marks a suggested topic, sees it move to the marked list, and undoes the mark', async () => {
      const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`
      const next = '/assessment/start'

      await page!.goto(
        `${baseUrl}/account/register?next=${encodeURIComponent(next)}`,
      )
      await page!.locator('input[name="email"]').fill(email)
      await page!
        .locator('input[name="password"]')
        .fill('correct-horse-battery')
      await page!.locator('form button[type="submit"]').click()

      // Registering lands back where the respondent was headed, signed in.
      await page!.waitForURL(/\/assessment\/start/, {
        timeout: STEP_TIMEOUT_MS,
      })
      const header = page!.getByTestId('header-account')
      await header.waitFor()
      expect(await header.innerText()).toContain(email)

      // A session started while signed in belongs to the account, so the
      // marks the account makes are in effect on it.
      await page!.getByRole('button', { name: ROLE_CARD }).click()
      await page!.getByRole('button', { name: START_BUTTON }).first().click()
      await page!.waitForURL(ROADMAP_URL, { timeout: STEP_TIMEOUT_MS })
      await answerUntilFinished(page!)

      const before = await nextTopicTitles(page!)
      expect(before.length).toBeGreaterThan(0)
      const target = before[0]!
      expect(await page!.getByTestId('mark-requires-account').count()).toBe(0)

      await page!
        .getByTestId('next-topic-item')
        .first()
        .getByRole('button', { name: MARK_BUTTON })
        .click()

      // The mark leaves the suggestions and appears in the marked list.
      await expect
        .poll(() => nextTopicTitles(page!), { timeout: STEP_TIMEOUT_MS })
        .not.toContain(target)
      await expect
        .poll(() => markedTopicTitles(page!), { timeout: STEP_TIMEOUT_MS })
        .toContain(target)

      // Undo from where the mark was made: the suggestion returns.
      await page!
        .getByTestId('recently-marked-list')
        .locator('li', { hasText: target })
        .getByRole('button', { name: UNDO_BUTTON })
        .click()

      await expect
        .poll(() => markedTopicTitles(page!), { timeout: STEP_TIMEOUT_MS })
        .not.toContain(target)
      await expect
        .poll(() => nextTopicTitles(page!), { timeout: STEP_TIMEOUT_MS })
        .toContain(target)
    })
  },
)
