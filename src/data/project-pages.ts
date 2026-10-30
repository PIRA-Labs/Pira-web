import { pira } from "./pira";

export interface ProjectPageContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly { heading: string; body: string }[];
}

export const projectPages = {
  about: {
    eyebrow: "The idea",
    title: "Physical intelligence. Existing hardware.",
    intro: pira.philosophy,
    sections: [
      { heading: "A runtime for the real world", body: "PIRA stands for Physical Intelligence Runtime for Agents. The project explores turning everyday Android devices into physical interfaces for AI agents: a way to connect digital reasoning with the world around us." },
      { heading: "The device is already here", body: "An Android phone brings a camera, microphone, sensors, a screen, and connectivity. PIRA’s approach is to make these existing capabilities available through a runtime, rather than require a new piece of dedicated AI hardware." },
      { heading: "Built around a feedback loop", body: "Observe → Reason → Act → Verify. A useful physical agent needs to check what happened after an action, not just assume that its command succeeded." },
      { heading: "An experimental project", body: "This website describes the project’s direction. Device support, available actions, permissions, and model integrations depend on the actual release. The mascot is an illustration of the idea, not a robot that ships with the software." },
    ],
  },
  "how-it-works": {
    eyebrow: "The runtime loop",
    title: "Observe → Reason → Act → Verify",
    intro: "A connection to reality needs feedback. PIRA is designed around four steps, repeated as the world changes.",
    sections: [
      { heading: "01 / Observe", body: "Gather context through the Android device’s available inputs, such as its camera and sensors. Access depends on explicit device permissions and the capabilities supported by a release." },
      { heading: "02 / Reason", body: "Use that context to decide what should happen next. Nebius AI models are the intended reasoning layer, connecting perception and planning with the agent’s goal." },
      { heading: "03 / Act", body: "Translate the decision into an action the runtime supports. The phone is a physical interface: actions are constrained by Android permissions, device hardware, and the runtime’s implemented tools." },
      { heading: "04 / Verify", body: "Observe again and compare the result with the intended outcome. Feed the evidence into the next reasoning step; a command being sent is not proof that the task is complete." },
    ],
  },
  architecture: {
    eyebrow: "System architecture / proposed",
    title: "An interface between agents and reality.",
    intro: "Existing Android hardware at the edge. Agent reasoning powered by Nebius AI models. A runtime that connects the two.",
    sections: [
      { heading: "Android / physical interface", body: "The device hosts the runtime and provides permission-controlled access to supported inputs and outputs. Hardware support is device-specific; the project does not assume every Android phone exposes the same capabilities." },
      { heading: "Runtime / execution boundary", body: "The proposed runtime translates observations into agent context and agent decisions into supported device actions. It should report errors and outcomes explicitly, so the agent can verify its work." },
      { heading: "Nebius / reasoning layer", body: "The intended integration uses Nebius AI models for reasoning over observations and selecting next steps. Model access and credential handling belong to the runtime’s backend integration, not to this public website." },
      { heading: "Feedback / evidence of results", body: "The next observation closes the loop. Verification should distinguish a requested action, an executed action, and a confirmed outcome. This is an architectural goal, not a claim that every capability is operational today." },
    ],
  },
  download: {
    eyebrow: "Android release",
    title: pira.apkUrl ? "Take PIRA into the real world." : "The Android release is coming.",
    intro: pira.apkUrl ? "An Android APK download has been configured. Review the release notes and device requirements before installing." : "There is no public APK linked yet. This page will point to the Android download when a release is available.",
    sections: [
      { heading: "Follow the project", body: "Visit the PIRA GitHub repository for the project’s published work. Availability and supported capabilities should be checked against the release documentation." },
      { heading: "Use the hardware you have", body: "PIRA is designed for existing Android devices. Minimum Android version, compatible devices, required permissions, and installation steps will be documented with the APK release." },
    ],
  },
} satisfies Record<string, ProjectPageContent>;
