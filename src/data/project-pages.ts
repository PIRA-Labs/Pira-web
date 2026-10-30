import { pira } from "./pira";

export interface ProjectSection {
  heading: string;
  body: string;
}

export interface ProjectPageContent {
  eyebrow: string;
  title: string;
  metaTitle: string;
  intro: string;
  sections: readonly ProjectSection[];
  sequence?: boolean;
}

export const projectPages = {
  about: {
    eyebrow: "Physical Intelligence Runtime for Agents",
    title: "A controlled execution layer for reality.",
    metaTitle: "About PIRA",
    intro: "PIRA gives AI agents a disciplined way to work through Android devices: models can propose actions, while policy, authorization, and trusted execution keep people in control.",
    sections: [
      { heading: "Built for a real-world boundary", body: "PIRA sits between model reasoning and Android capabilities. It turns agent intent into typed action proposals instead of granting a language model direct access to privileged device operations." },
      { heading: "Android first, including the device you already have", body: "Android is PIRA’s first trusted client: a practical physical interface with a camera, screen, audio, connectivity, and hardware permissions. A repurposed or second-hand smartphone can become a secure, reusable interface for an AI agent instead of requiring dedicated new hardware." },
      { heading: "Human control by design", body: "Sensitive actions require scoped user authorization. PIRA is not an unrestricted remote-control layer, a generic chatbot, or a system that bypasses consent." },
      { heading: "An accountable loop", body: "A request moves from observation to proposal, authorization, execution, and an auditable result. Agents receive outcomes they can reason about instead of assuming an operation succeeded." },
    ],
  },
  "how-it-works": {
    eyebrow: "The runtime execution flow",
    title: "From agent intent to a controlled physical result.",
    metaTitle: "How PIRA Works",
    intro: "PIRA turns an Android device—new, spare, or repurposed—into a controlled physical interface for an AI agent. The runtime gives every capability request a defined shape, scope, and result.",
    sequence: true,
    sections: [
      { heading: "Agent", body: "An AI agent interprets a request or supported observation and decides that a physical capability could help: a camera capture, sensor reading, or spoken response." },
      { heading: "Action request", body: "The agent creates a typed request that declares the capability, inputs, and intended scope. It is a proposal—not direct device control." },
      { heading: "Policy", body: "PIRA evaluates the request against allowed capabilities, execution boundaries, and the current context before an operation can proceed." },
      { heading: "Authorization", body: "When a request crosses a sensitive boundary, the person using the device explicitly approves the scoped action." },
      { heading: "Physical capability", body: "The trusted Android executor performs the approved operation through the device’s camera, sensors, speech, or another enabled capability." },
      { heading: "Result", body: "PIRA returns a concrete outcome to the agent and records the flow, so the agent can respond to evidence instead of assuming success." },
    ],
  },
  architecture: {
    eyebrow: "The PIRA execution model",
    title: "Models propose. Policy decides. Devices execute.",
    metaTitle: "PIRA Architecture",
    intro: "PIRA creates a deliberate boundary between AI reasoning and physical capability execution, so every request has a defined shape, scope, and result.",
    sequence: true,
    sections: [
      { heading: "AI model", body: "A model interprets a user request or a supported device observation. It reasons about the next useful step; it does not receive direct privileged Android control." },
      { heading: "Typed action proposal", body: "The model’s intent becomes structured data that names an operation, its inputs, and its requested scope." },
      { heading: "PIRA policy engine", body: "Policy evaluates the proposal against allowed capabilities, limits, and context before any device operation is considered." },
      { heading: "Scoped user authorization", body: "Sensitive operations wait for explicit human approval. Authorization is specific to the requested action rather than a blanket grant." },
      { heading: "Trusted capability executor", body: "The Android runtime performs only approved operations through the capability boundary and returns a concrete outcome." },
      { heading: "Android / physical device", body: "The device supplies the authorized hardware capability and the resulting evidence enters the audit trail for the agent and user. The capability boundary is designed to extend to future sensor, Bluetooth, and wearable integrations." },
    ],
  },
  security: {
    eyebrow: "Security model",
    title: "Physical access should be explicit, bounded, and interruptible.",
    metaTitle: "PIRA Security",
    intro: "PIRA is designed so that AI can request access to physical capability without turning a model into an unrestricted device operator.",
    sections: [
      { heading: "Human authorization", body: "PIRA asks for user approval when an action crosses a sensitive boundary. The user authorizes the requested operation, not a vague future category of access." },
      { heading: "Least privilege", body: "Capabilities are scoped to the smallest action and inputs needed for the task. Policy can deny requests that do not fit the runtime’s allowed execution surface." },
      { heading: "Deny by default", body: "An unsupported, malformed, or unauthorized proposal does not become a device operation. The executor accepts approved, typed work only." },
      { heading: "Credential boundaries", body: "Provider credentials are handled by the runtime integration and are not exposed through the browser-facing PIRA website." },
      { heading: "Emergency stop", body: "PIRA includes an execution boundary that can stop an active capability flow, keeping control with the person using the device." },
      { heading: "Auditability", body: "The runtime records proposals, authorizations, execution outcomes, and errors so a result can be traced back to the decision that produced it." },
    ],
  },
  download: {
    eyebrow: "Developers / Android",
    title: "Build with physical intelligence, deliberately.",
    metaTitle: "Developers and Android",
    intro: "Start with the Android client and connect your agent to PIRA’s policy-controlled capability boundary.",
    sections: [
      { heading: "Android / Kotlin", body: "The Android client is built in Kotlin and is the first PIRA executor for device capabilities, permissions, and user-facing authorization." },
      { heading: "Model provider", body: "NVIDIA Nemotron is available through Nebius Token Factory for supported model reasoning and vision workflows." },
      { heading: "Research provider", body: "Tavily Search can be invoked as a separate, policy-governed capability when an agent requests web research." },
      { heading: "Get the Android build", body: "The Android repository contains the current installation path, configuration guidance, and contribution context for PIRA." },
    ],
  },
} satisfies Record<string, ProjectPageContent>;
