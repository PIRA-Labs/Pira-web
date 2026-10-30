import { publicEnv } from "@/env";

/** Public release destinations; no credentials belong in these URLs. */
export const pira = {
  name: "PIRA",
  fullName: "Physical Intelligence Runtime for Agents",
  description: "Turn everyday Android devices into physical runtimes for AI agents. Connect, perceive, reason, and act.",
  philosophy: "Stop building new hardware for AI. Start using the devices we already have.",
  apkUrl: publicEnv.NEXT_PUBLIC_ANDROID_APK_URL,
  downloadHref: publicEnv.NEXT_PUBLIC_ANDROID_APK_URL ?? "/download",
  githubUrl: publicEnv.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/PIRA-Labs/Pira-web",
  footer: "PIRA · Physical Intelligence Runtime for Agents",
  privacyLabel: "Privacy",
} as const;
