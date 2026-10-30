<!-- .github/profile/README.md — PIRA-Labs Organization Profile -->
<!-- This file renders at https://github.com/PIRA-Labs -->

<div align="center">

  <img src="https://raw.githubusercontent.com/PIRA-Labs/.github/main/assets/banners/hero.png" alt="PIRA organization banner" width="100%" style="max-width:1200px; border-radius:12px; margin-bottom:24px;"/>

  <h1 style="font-family: Space Grotesk, -apple-system, sans-serif; font-size: 3.2rem; font-weight: 700; letter-spacing: -0.02em; margin: 0.2em 0 0.1em;">
    PIRA
  </h1>
  <p style="font-family: Space Grotesk, -apple-system, sans-serif; font-size: 1.25rem; color: #7b61ff; margin: 0 0 0.6em; letter-spacing: 0.02em;">
    Physical Intelligence Runtime for Agents
  </p>
  <p style="font-size: 1.15rem; color: #cbd5e1; max-width: 640px; margin: 0 auto 1.2em; line-height: 1.6;">
    <strong style="color: #ffffff;">Give AI access to reality. Keep humans in control.</strong>
  </p>

  <p style="font-size: 0.95rem; color: #9da3b3; max-width: 680px; margin: 0 auto 1.6em; line-height: 1.65;">
    PIRA is an infrastructure-first runtime that lets AI agents interact with physical device capabilities through a trusted, permissioned boundary. The Android Companion is the first client — not the entire product.
  </p>

  <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
    <a href="https://github.com/PIRA-Labs/Pira-web" style="background: #3d5af1; color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">Landing Page</a>
    <a href="https://github.com/PIRA-Labs/Pira-Android" style="background: rgba(255,255,255,0.06); color: #e2e8f0; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.12);">Android Runtime</a>
    <a href="https://github.com/PIRA-Labs/Pira-Research" style="background: rgba(255,255,255,0.06); color: #e2e8f0; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.12);">Research</a>
  </div>

</div>

---

## What is PIRA?

PIRA provides the missing layer between agents that reason and the physical world they can act on.

Digital agents can browse the web, query databases, and call APIs. Giving them unrestricted access to a phone's camera, microphone, sensors, or Bluetooth stack is a different class of risk. PIRA exists to make that gap explicit and controllable.

The runtime converts untrusted model output into typed, allowlisted action proposals. A deterministic policy engine evaluates each proposal against short-lived, scoped authorizations. The user retains consent, revocation, and auditability at every step.

**PIRA does not give agents a body. PIRA gives agents a controlled interface to one.**

---

## Architecture

```text
AI Agent / Model Provider
        │
        ▼  untrusted output
  Typed Action Proposal
        │
        ▼
  Policy & Consent
  deny-by-default · user-scoped · short-lived grants
        │
        ▼
  Trusted Capability Executor
  revalidates parameters · audits outcomes · emergency stop
        │
        ▼
  Android APIs / Sensors / Wearables
  Camera · Microphone · GPS · Bluetooth LE · Notifications
```

The dashed box above is the trust boundary. Everything inside it is PIRA's responsibility. Everything outside it is untrusted.

<img src="https://raw.githubusercontent.com/PIRA-Labs/.github/main/assets/diagrams/architecture.svg" alt="PIRA architecture diagram" width="100%" style="max-width: 1100px; border-radius: 8px; margin-top: 16px;"/>

---

## The missing layer

| Layer | Example | Status |
|-------|---------|--------|
| Agents reason | LLM planning, tool use | Mature |
| Agents access information | Web search, RAG, code execution | Mature |
| Agents access physical reality | Camera, sensors, wearables, device control | **Underserved** |

PIRA targets the third layer. The Android Companion is the first implementation of that interface.

---

## Security by design

These are the controls the project is building toward. Each item is tagged with its current evidence status.

- **Deny by default.** The policy engine rejects every proposal unless an explicit authorization matches. [`PolicyEngineTest.kt`](https://github.com/PIRA-Labs/Pira-Android/blob/main/app/src/test/java/com/taak/watch/signedtest/PolicyEngineTest.kt) verifies missing, expired, reused, mismatched, modified, and emergency-stop cases. ✅ Tested
- **Least privilege.** Authorizations are capability-scoped, parameter-bound, and time-limited. Single-use state prevents replay. ✅ Implemented
- **Typed action proposals.** Model output is never executed directly. Only allowlisted `Capability` enum values reach policy evaluation. ✅ Implemented
- **User-controlled permissions.** Android permissions are requested at the moment a user-initiated capability runs. No background camera or unattended actuation. ✅ Implemented
- **Revocation.** An independent emergency-stop flag blocks all policy evaluation without invalidating individual grants. Partial; durable grant storage and revocation UI remain incomplete. ⚠️ Partial
- **Auditable execution.** Every authorization decision and capability invocation is recorded with a timestamp. Current storage is application-local SharedPreferences; durable audit export is planned. ⚠️ Partial
- **Prompt injection threat model.** Model credentials are separate from hardware authorization. The threat model documents confused deputy, replay, parameter tampering, BLE impersonation, and exported-component risks. ✅ Documented

**Not implemented / not guaranteed:**
- Cryptographically signed grants
- StrongBox hardware attestation
- Process isolation
- Hardware-backed Keystore verification
- General wearable compatibility

See [`docs/THREAT_MODEL.md`](https://github.com/PIRA-Labs/Pira-Android/blob/main/docs/THREAT_MODEL.md) for the full analysis.

---

## Engineering methodology

PIRA is built like an infrastructure project, not a demo.

### Architecture Decision Records
Every significant choice is recorded in `docs/adr/`:
- **ADR-0001** — Infrastructure-first runtime
- **ADR-0002** — Agent/runtime trust boundary
- **ADR-0003** — Nebius as initial configurable model provider
- **ADR-0004** — Keystore-backed application credential storage

### Experiment registry
`docs/EXPERIMENTS.md` tracks every hypothesis with status: Not Tested, Blocked, Passed, Partially implemented, or Failed. No claim is made without an experiment entry.

### Reproducible builds
Debug APK builds are verified with JDK 17 and Gradle 8.7.3. Build and test commands are documented in `CONTRIBUTING.md`.

### Automated tests
Unit tests cover the policy engine's rejection matrix. Tests pass on the current codebase.

### Evidence classification
The project distinguishes:
- **Verified** — build-verified, test-verified, or device-verified
- **Inherited research** — code carried over from prior experimentation, marked experimental until boundary review passes
- **Planned** — roadmap items with no implementation yet

---

## Research lineage

PIRA did not begin as a hackathon submission. Its roots are in months of hands-on experimentation:

1. **Always-on agent gateway** running on a MacBook
2. **Android gateway exploration** — Termux, persistent agent execution, local automation on an inexpensive secondhand Android device (~4 GB RAM)
3. **Android Developer Options** investigation for persistent execution
4. **Native Android/Kotlin development** — replacing the prototype with a typed, maintainable runtime
5. **Xiaomi Mi Fitness reverse engineering** — XMS messaging, Redmi Watch 4 DID, Bluetooth connectivity
6. **Device bridge experiments** — Android-to-watch and watch-to-Android communication
7. **Identity, authentication, and authorization research** — prompt injection, capability authorization, trusted execution
8. **Physical intelligence infrastructure** — formalized since September 2026 as a complement to the Nebius agent ecosystem

This history is reconstructed from code, commit provenance, and available research notes. See `docs/DEVELOPMENT_LOG.md` for the reconstructed chronology.

---

## Ecosystem

| Repository | Role | Status |
|------------|------|--------|
| **PIRA Web** | Public landing, brand experience, APK download page | In development — build verified |
| **PIRA Android** | Runtime and companion implementation | In development — debug build + unit tests verified |
| **PIRA Research** | Experimental evidence, ADRs, threat models, research history | Not yet published |

Cross-links between repositories will be added as each repo goes public.

---

## Current status

Transparent, evidence-only reporting:

| Component | Status |
|-----------|--------|
| Android debug APK build | ✅ Verified with JDK 17 |
| Policy unit tests | ✅ All cases pass |
| Nebius API client | ⚠️ Shape verified against official Swagger; no live key tested |
| Vision / camera-to-model flow | ⏳ Blocked on model capability verification and device |
| Wearable messaging (Xiaomi/XMS) | ⏳ Inherited research only; no production adapter |
| Revocation UI | ⚠️ Emergency stop implemented; full UI incomplete |
| Device capability discovery | ⏳ Not implemented |
| Keystore hardware backing | ⏳ Not verified |

**PIRA is experimental software. It is not production-ready.**

---

## Get involved

PIRA is early. If you want to help:

- **Developers** — Read the ADRs and `CONTRIBUTING.md` before opening a PR. The policy engine and experiment registry need the most attention.
- **Security researchers** — Review the threat model. Attack surface documentation is a priority.
- **Contributors** — Reproducible evidence > marketing language. Bring tests, not claims.

There is no formal governance or community structure yet. This organization is the starting point.

---

<div align="center" style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
  <p style="font-size: 0.85rem; color: #6b7280; line-height: 1.6;">
    PIRA Labs · Physical Intelligence Runtime for Agents<br>
    Trust makes physical intelligence possible.
  </p>
</div>
