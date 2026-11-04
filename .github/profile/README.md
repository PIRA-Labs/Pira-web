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
  <p style="font-size: 1.15rem; color: #cbd5e1; max-width: 720px; margin: 0 auto 1.2em; line-height: 1.6;">
    <strong style="color: #ffffff;">Turn existing smartphones into secure physical interfaces for AI agents.</strong>
  </p>
  <p style="font-size: 0.95rem; color: #9da3b3; max-width: 760px; margin: 0 auto 1.6em; line-height: 1.65;">
    PIRA is an experiment-driven runtime that connects cloud reasoning and web discovery with trusted, permissioned access to Android device capabilities. The first client is an Android application. The long-term goal is a reusable infrastructure layer for physical AI on inexpensive hardware.
  </p>

  <div style="display: inline-flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
    <a href="https://github.com/PIRA-Labs/Pira-web" style="background: #3d5af1; color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">Landing Page</a>
    <a href="https://github.com/PIRA-Labs/Pira-Android" style="background: rgba(255,255,255,0.06); color: #e2e8f0; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.12);">Android Runtime</a>
    <a href="https://github.com/PIRA-Labs/Pira-Research" style="background: rgba(255,255,255,0.06); color: #e2e8f0; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.12);">Research</a>
  </div>

</div>

---

## Product position

PIRA solves a practical gap in physical AI:

- Most AI systems reason in digital environments.
- Purpose-built robots and hardware are expensive and specialized.
- Billions of Android phones already have cameras, microphones, speakers, GPS, motion sensors, radios, and compute.
- The missing layer is a trusted boundary that lets an agent use those capabilities without exposing the device to unrestricted control.

PIRA provides that boundary as infrastructure:
- **Android** — persistent agent hosting and controlled device capability execution
- **Nebius Token Factory** — cloud reasoning and model access
- **Tavily** — web search and discovery
- **PIRA Runtime** — typed capabilities, policy enforcement, consent, execution, auditing, and revocation

This is not a chat interface with device permissions. It is an authorization layer between untrusted agent output and physical device APIs.

---

## Why existing Android hardware

Research on repurposed inexpensive Android hardware showed that a persistent agent can run continuously on a second-hand device. The pivotal experiment recovered native physical actuation from the device itself, not through a chat attachment or remote proxy.

That milestone proved an important distinction:

- **agent output to chat** = inference cost, no physical actuation
- **native device execution** = zero inference tokens, direct physical effect, but requires explicit human authorization

PIRA's architecture is a direct response to that distinction.

---

## Current status

| Layer | Status |
|-------|--------|
| Android runtime (`Pira-Android`) | Experimental prototype · v0.1.0 available · debug build verified |
| Trust boundary | Implemented: deny-by-default policy, typed proposals, short-lived authorization, emergency stop |
| Credential storage | Android Keystore AES-GCM; hardware backing not yet verified |
| Nebius integration | Client shape verified; live inference requires user-entered key |
| Tavily integration | Client implemented; live search requires user-entered key |
| Wearable transport | Inherited research only; no production adapter in current release |
| v0.2 beta | In development; native TTS behind explicit authorization is the next execution milestone |

**PIRA is experimental software. It is not production-ready.**

---

## Security principle

The project's core rule:

> Agents may propose actions. Only a trusted, user-controlled runtime may authorize and execute them.

Implemented controls include:
- deny-by-default evaluation for every proposal
- capability-scoped, parameter-bound, time-limited authorizations
- typed allowlists; model output never reaches device APIs directly
- audit logging and emergency stop
- no shell execution bridge from agent to actuator

Unresolved items remain: durable grant storage, revocation UI, hardware-backed Keystore verification, process isolation, and broader wearable compatibility.

See [`docs/THREAT_MODEL.md`](https://github.com/PIRA-Labs/Pira-Android/blob/main/docs/THREAT_MODEL.md).

---

## Repositories

| Repository | Role |
|------------|------|
| **PIRA Web** | Public landing page, product experience, APK download |
| **PIRA Android** | Runtime, trust boundary, Nebius/Tavily clients, device capability execution |
| **PIRA Research** | Experimental history, evidence, recovered artifacts, ADRs, threat models |

The Research repository preserves recovered primary evidence, including the August 29, 2026 Android Body experiment that demonstrated remote native TTS execution on a persistent Android agent node.

---

## Research-backed credibility

PIRA is grounded in reproducible experiment records rather than claims:
- persistent agent runtime on inexpensive Android hardware
- recovered native physical actuation artifacts with provenance
- wearable communication experiments with documented limitations
- typed policy implementation verified by unit tests and device install

Detailed evidence lives in [`PIRA-Labs/Pira-Research`](https://github.com/PIRA-Labs/Pira-Research).

---

<div align="center" style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
  <p style="font-size: 0.85rem; color: #6b7280; line-height: 1.6;">
    PIRA Labs · Physical Intelligence Runtime for Agents<br>
    Trust makes physical intelligence possible.
  </p>
</div>
