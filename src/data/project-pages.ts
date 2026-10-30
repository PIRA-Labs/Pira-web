import { pira } from "./pira";

export interface ProjectSection {
  heading: string;
  body: string;
  items?: readonly string[];
  ordered?: boolean;
}

export interface ProjectAction {
  label: string;
  href: string;
  primary?: boolean;
}

export interface ProjectPageContent {
  eyebrow: string;
  title: string;
  metaTitle: string;
  intro: string;
  sections: readonly ProjectSection[];
  actions: readonly ProjectAction[];
  sequence?: boolean;
}

export const projectPages = {
  about: {
    eyebrow: "PIRA Labs / research",
    title: "It started with a spare Android.",
    metaTitle: "PIRA Research",
    intro: "I wanted to run an AI agent 24/7 without keeping my MacBook powered on. So I tried moving the workload to a second-hand Android phone.",
    sections: [
      { heading: "The device had more than cheap compute", body: "The phone had something more interesting: a camera, speakers, connectivity, and sensors. That led to PIRA. What if agents could use the hardware we already own, instead of needing new devices for every experiment?" },
      { heading: "An ongoing research effort", body: "PIRA Labs explores Android-based physical intelligence, reusable hardware capability interfaces, and security-first agent execution." },
      { heading: "What comes next", body: "Bluetooth, wearable, and sensing integrations are research and roadmap directions—not shipping capabilities in the Android release." },
    ],
    actions: [{ label: "Explore PIRA research", href: pira.researchUrl }],
  },
  "how-it-works": {
    eyebrow: "The runtime execution flow",
    title: "An agent can ask. Only PIRA can act.",
    metaTitle: "How PIRA Works",
    intro: "PIRA separates AI reasoning from device execution. A model can suggest using the camera or another supported capability, but it doesn't get unrestricted control over your phone.",
    sequence: true,
    sections: [
      { heading: "Request", body: "The agent proposes a specific action." },
      { heading: "Check", body: "PIRA validates the action against its policy." },
      { heading: "Approve", body: "You authorize the requested capability." },
      { heading: "Execute", body: "Android performs the permitted operation." },
      { heading: "Return", body: "The result goes back to the agent, with an audit record." },
    ],
    actions: [
      { label: "Explore the architecture", href: "/architecture" },
      { label: "Download PIRA", href: pira.downloadHref, primary: true },
    ],
  },
  architecture: {
    eyebrow: "Technical reference",
    title: "Models propose. Policy decides. Devices execute.",
    metaTitle: "PIRA Architecture",
    intro: "PIRA keeps the trust boundary explicit: AI model → typed action proposal → deny-by-default policy engine → scoped authorization → trusted Android executor → physical capability → auditable result.",
    sequence: true,
    sections: [
      { heading: "AI model", body: "The model provides untrusted reasoning input. It cannot turn its output into shell, ADB, arbitrary URL, or background-surveillance execution." },
      { heading: "Typed action proposal", body: "Every request names the exact capability and parameters PIRA must evaluate." },
      { heading: "Deny-by-default policy engine", body: "Policy checks run before execution; unsupported actions are rejected and logged." },
      { heading: "Scoped authorization", body: "Authorizations are short-lived and tied to the exact action parameters the user approved." },
      { heading: "Trusted Android executor", body: "The executor rechecks approved operations, uses Keystore-backed encrypted provider credentials, and remains independent from model output." },
      { heading: "Physical capability", body: "Android performs the permitted camera, speech, or supported device operation—never unrestricted access." },
      { heading: "Auditable result", body: "Allowed and denied action events, outcomes, and errors form an audit record. An independent emergency stop can block execution." },
    ],
    actions: [{ label: "View Android source", href: pira.androidSourceUrl }],
  },
  security: {
    eyebrow: "Security model",
    title: "The AI isn't in charge of your device. You are.",
    metaTitle: "PIRA Security",
    intro: "Giving an agent access to the physical world should never mean handing it unrestricted control.",
    sections: [
      { heading: "Ask first.", body: "Sensitive capabilities require an explicit, scoped user authorization." },
      { heading: "Allow only what's needed.", body: "Short-lived authorizations bind to exact action parameters rather than broad future access." },
      { heading: "Reject unsupported actions.", body: "A deny-by-default policy blocks unsupported requests before execution. Model output cannot trigger shell, ADB, arbitrary URLs, or background surveillance." },
      { heading: "Protect credentials.", body: "Nebius and Tavily credentials are stored in Android Keystore-backed encrypted preferences and belong only on the device you control." },
      { heading: "Keep an audit trail.", body: "PIRA records allowed and denied action events so decisions and outcomes can be examined." },
      { heading: "Stop execution.", body: "An independent emergency stop can halt an active capability flow." },
      { heading: "Know the boundary.", body: "PIRA is an experimental prototype with a security-first design, not an independently audited security product." },
    ],
    actions: [{ label: "Read the Android security model", href: pira.androidReadmeUrl }],
  },
  download: {
    eyebrow: "PIRA for Android · v0.1.0",
    title: "Your old Android has a new job.",
    metaTitle: "Download PIRA for Android",
    intro: "Install PIRA on a device you control. Connect your AI provider, configure optional web search, and explore physical capabilities through permission-controlled actions.",
    sections: [
      {
        heading: "Requirements",
        body: "Bring a device you control and the credentials for the optional cloud services you want to use.",
        items: [
          "Android 8.0 or newer (API 26+).",
          "Tested on HONOR VNE-LX3 running Android 14.",
          "Internet connection for cloud AI inference.",
          "Nebius Token Factory API key.",
          "Tavily API key for web search.",
          "Experimental debug build; not a production release.",
        ],
      },
      {
        heading: "Install and configure",
        body: "Use the labels below exactly as they appear in the Android app.",
        ordered: true,
        items: [
          "Download the APK.",
          "Open the file and approve installation from your browser or file manager if Android asks.",
          "Open PIRA.",
          "Go to “My Brain → Connections”.",
          "Enter your Nebius Token Factory API key and tap “CONNECT MY BRAIN”.",
          "Discover available models, select one, and activate it.",
          "Configure Tavily using “SEARCH WEB” if you want web research.",
          "Tap “LOOK AT SOMETHING” to request camera access.",
        ],
      },
      { heading: "Keep your keys private", body: "API credentials are stored using Android Keystore-backed encrypted preferences. Never share your keys or include them in screenshots." },
    ],
    actions: [
      { label: "Download APK · v0.1.0", href: pira.downloadHref, primary: true },
      { label: "View source code", href: pira.androidSourceUrl },
      { label: "Read installation guide", href: pira.androidReadmeUrl },
    ],
  },
} satisfies Record<string, ProjectPageContent>;
