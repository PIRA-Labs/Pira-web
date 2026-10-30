# Acknowledgements & Credits

This website — the **PIRA** landing page — stands on the shoulders of other
people's craft. The source code of this landing is released as open source under
the [MIT License](./LICENSE.md), but much of what makes it beautiful is not our
invention, and we want to say so plainly and with gratitude.

PIRA (**Physical Intelligence Runtime for Agents**) is a larger project with its
own organization, research repositories, and prior experimentation work. This
repository is **only the landing page** — the front door people use to learn
about PIRA and download the Android APK. The real product lives elsewhere; this
is the welcome mat, and we wanted it to be gorgeous.

## The template — GetLayers / Textura

The foundation of this site is a Next.js starter and meadow scene created by
**[Textura](https://textura.agency)**, distributed through
**GetLayers**. We hold a lifetime license to GetLayers and received this
template with its full source code.

The cinematic 3D landscape, the grass field, the atmospheric sky, the
spring-based motion system, the viewfinder framing, and the overall composition
are **their work and their artistry**. We did not design that world — we fell in
love with it, licensed it honestly, and adapted it into PIRA's own identity (a
new palette, typography, mascot presence, and interface details). The beauty of
the original is theirs; any rough edges in our adaptation are ours.

We're open-sourcing our version not to claim their craft as our own, but because
we believe in giving back to the ecosystem that made PIRA possible — and because
the template's own license (public domain / The Unlicense) generously allows it.
If you build something with this, we'd love for you to look at Textura's and
GetLayers' work too.

> Thank you, Textura and GetLayers. We used your beautiful work to build
> something we're proud of, and we honor the effort behind it.

## The grass shader — pmndrs

The WebGL grass field derives from the open-source **grass-shader** work by the
**[pmndrs](https://github.com/pmndrs)** (Poimandres) community, which the
template ported and tuned. Our scene keeps that lineage; the credit for the
underlying technique is theirs.

## Simplex noise — Ashima Arts / Stefan Gustavson

The GLSL simplex noise used in the terrain and sky (`src/components/scene/
grass-field/shaders.ts`) is the public-domain implementation by **Ashima Arts**
and **Stefan Gustavson**.

## Runtime dependencies

This site is built with open-source libraries, each under its own license
(predominantly **MIT**): Next.js, React, three.js, @react-spring/web, Lenis,
spring-text-engine, Zustand, Zod, and others listed in `package.json`. We thank
their maintainers.

---

*Gratitude is a feature. — PIRA Labs*
