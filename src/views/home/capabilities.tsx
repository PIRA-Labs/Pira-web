import type { Capability } from "@/data/pira";

export interface CapabilitiesProps {
  capabilities: readonly Capability[];
}

/** A concise, explicit status-led view of PIRA's capability surface. */
export const Capabilities = ({ capabilities }: CapabilitiesProps) => (
  <section aria-labelledby="capabilities-title" className="bg-project-surface px-6 py-16 sm:py-24">
    <div className="mx-auto max-w-document">
      <p className="font-ui text-label uppercase text-overlay-text-muted">Capability model</p>
      <h2 id="capabilities-title" className="mt-4 max-w-prose font-display text-subtitle-compact leading-display text-overlay-text sm:text-subtitle">
        A controlled path from intent to device capability.
      </h2>
      <p className="mt-6 max-w-prose font-body text-body leading-relaxed text-overlay-text-muted">
        Each capability passes through PIRA’s policy and authorization boundary before trusted Android execution.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {capabilities.map((capability) => (
          <li key={capability.name} className="border-t border-overlay-hairline pt-5">
            <p className="font-ui text-label uppercase text-overlay-text-muted">{capability.status}</p>
            <h3 className="mt-3 font-display text-body leading-display text-overlay-text">{capability.name}</h3>
            <p className="mt-3 font-body text-label leading-relaxed text-overlay-text-muted">{capability.description}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
