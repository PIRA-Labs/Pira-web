export interface Capability {
  name: string;
  description: string;
}

/** Public release destinations; no credentials belong in these URLs. */
export const pira = {
  name: "PIRA",
  fullName: "Physical Intelligence Runtime for Agents",
  description: "PIRA is a security-first physical intelligence runtime connecting AI agents to Android device capabilities through scoped permissions and human-controlled execution.",
  philosophy: "Give AI access to reality. Keep humans in control.",
  apkUrl: "https://github.com/PIRA-Labs/Pira-Android/releases/download/v0.1.0/PIRA-Android-v0.1.0.apk",
  downloadHref: "https://github.com/PIRA-Labs/Pira-Android/releases/download/v0.1.0/PIRA-Android-v0.1.0.apk",
  androidReleaseUrl: "https://github.com/PIRA-Labs/Pira-Android/releases/tag/v0.1.0",
  androidSourceUrl: "https://github.com/PIRA-Labs/Pira-Android",
  androidReadmeUrl: "https://github.com/PIRA-Labs/Pira-Android/blob/main/README.md",
  researchUrl: "https://github.com/PIRA-Labs/Pira-Research",
  githubUrl: "https://github.com/PIRA-Labs",
  footer: "PIRA · Physical Intelligence Runtime for Agents",
  privacyLabel: "Privacy",
} as const;

/** Product capability model. Access remains policy- and authorization-bound. */
export const capabilities: readonly Capability[] = [
  { name: "See", description: "Capture an image with explicit camera permission." },
  { name: "Understand", description: "Connect to NVIDIA Nemotron through Nebius Token Factory." },
  { name: "Research", description: "Retrieve web results with Tavily after an authorized request." },
  { name: "Speak", description: "Use Android text-to-speech for supported responses." },
  { name: "Control", description: "Review permissions, approve scoped actions, and stop execution." },
];
