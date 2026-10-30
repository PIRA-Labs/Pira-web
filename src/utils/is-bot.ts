import { headers } from "next/headers";

import { isBotUserAgent } from "@/utils/bot-user-agent";

// Detect if the user agent is a bot (Lighthouse, Googlebot, etc.). Server-only:
// reading `headers()` opts the route out of static prerendering.
export const isBot = async (): Promise<boolean> => {
  const headersList = await headers();
  return isBotUserAgent(headersList.get("user-agent"));
};
