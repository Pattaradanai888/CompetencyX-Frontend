export const PREFERRED_ROLE_KEY = 'competencyx:preferred-role'
export const LAST_SESSION_ID_KEY = 'competencyx:last-session-id'
export const PREFERRED_LANGUAGE_KEY = 'competencyx:preferred-language'
export const LOCALE_COOKIE_KEY = 'cx-locale'
/**
 * The account credential returned by register/sign-in. It lives in a cookie
 * rather than localStorage so the server render can present it too: an
 * owned session is invisible to an unauthenticated request, and a page
 * rendered without the credential would 404 on the very session it is for.
 */
export const ACCOUNT_TOKEN_COOKIE = 'cx-account-token'

export const AUTO_ADVANCE_DELAY_MS = 220
