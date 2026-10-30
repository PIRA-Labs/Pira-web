export interface Capability {
  name: string;
  description: string;
  status: "Available capability" | "Controlled integration";
}

/** Public release destinations; no credentials belong in these URLs. */
export const pira = {
  name: "PIRA",
  fullName: "Physical Intelligence Runtime for Agents",
  description: "PIRA is a security-first physical intelligence runtime connecting AI agents to Android device capabilities through scoped permissions and human-controlled execution.",
  philosophy: "Give AI access to reality. Keep humans in control.",
  apkUrl: "https://github.com/PIRA-Labs/Pira-Android",
  downloadHref: "https://github.com/PIRA-Labs/Pira-Android",
  githubUrl: "https://github.com/PIRA-Labs",
  footer: "PIRA · Physical Intelligence Runtime for Agents",
  privacyLabel: "Privacy",
} as const;

/** Product capability model. Access remains policy- and authorization-bound. */
export const capabilities: readonly Capability[] = [
  { name: "See", description: "Capture visual information through the Android camera after user authorization.", status: "Available capability" },
  { name: "Understand", description: "Interpret supported inputs with NVIDIA Nemotron through Nebius Token Factory.", status: "Controlled integration" },
  { name: "Research", description: "Retrieve relevant web sources through Tavily after an authorized search request.", status: "Controlled integration" },
  { name: "Speak", description: "Deliver enabled responses through Android text-to-speech.", status: "Available capability" },
  { name: "Control", description: "Enforce permission boundaries, execution limits, and an emergency stop.", status: "Available capability" },
];
