# Pirophone source asset

`pirophone-original.glb` is the unchanged 10,668,348-byte source supplied as
`public/Pirophone.glb`. It lives outside `public/` so the backup is not deployed
as a downloadable runtime asset.

Generate the web assets (glTF Transform CLI 4.5.1):

```sh
npx @gltf-transform/cli@4.5.1 optimize assets/originals/pirophone-original.glb public/pirophone.glb --compress draco --simplify false --texture-compress webp --texture-size 1024
npx @gltf-transform/cli@4.5.1 optimize assets/originals/pirophone-original.glb public/pirophone-mobile.glb --compress draco --simplify false --texture-compress webp --texture-size 512
```

No mesh simplification. Three maps are resized offline and encoded as WebP.
Draco uses the existing same-origin decoder in `public/draco/`. The unsupported
optional exporter extension `FB_ngon_encoding` is omitted; triangle geometry is
retained. WebP keeps the existing loader and avoids adding a Basis transcoder
for three small maps; unlike KTX2, it does not remain compressed in GPU memory.
