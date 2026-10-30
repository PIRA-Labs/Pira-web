/**
 * Crawler / audit user agents that must never be served the WebGL scene.
 *
 * Isomorphic on purpose: `is-bot.ts` checks it server-side against the request
 * header, and the scene's client leaf checks `navigator.userAgent` before the
 * `three` chunk is ever requested — which keeps `/` statically prerendered.
 */
const BOT_PATTERN =
  /lighthouse|googlebot|pagespeed|headlesschrome|gtmetrix|pingdom|bingbot|yandexbot|duckduckbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot/i;

export const isBotUserAgent = (userAgent: string | null | undefined): boolean =>
  typeof userAgent === "string" && BOT_PATTERN.test(userAgent);
