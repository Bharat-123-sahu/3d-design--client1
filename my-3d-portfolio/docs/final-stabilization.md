# Final stabilization — 2026-09-28

## Scope and inspection

Inspected the repository inventory, entry point, active route registrations, router/history handling, navigation/transition/content managers, ThreeScene ownership, renderer/camera/composer, character presentation, orb/sticker/particle systems, animation initialization and cleanup, Lenis synchronization, responsive utilities/styles, video reveal, asset references and existing QA harnesses. Legacy page/effect modules remain intact. Existing staged Feedback changes and `qa-model.mjs` were preserved.

## Fixes

- `public/_redirects`: Netlify SPA rewrite `/* /index.html 200`; copied to `dist/_redirects`. No competing Netlify configuration exists.
- `src/js/core/Router.js`: `/home` alias, canonical URLs, destination history state, manual scroll restoration so route/hash positioning owns scrolling.
- `src/js/main.js`: explicit URLs and refreshed destination entries initialize after START; fresh `/` still enters the character world. Renderer-context creation failure loads accessible page content and normal navigation.
- `src/js/three/ThreeScene.js`: cache companion dimensions through its existing ResizeObserver; initialize interaction listeners only after renderer creation succeeds.
- `src/js/effects/LiquidBlob.js`: pass existing viewport profile to the sticker field and apply the mobile burst budget to low-power tablets too.
- `src/js/effects/StickerField.js`: cache fixed canvas bounds on viewport changes, limit mobile background presentation to 14 plus the selected sticker, progressively expose remaining originals, preserve all surface instances, restore short curved sticker flight with immediate reduced-motion placement, prevent redundant refills while reserved artwork awaits its next frame.
- `src/js/effects/SurfaceStickers.js`: reuse a readback-optimized atlas context.
- `src/js/animations/VideoRevealController.js`: rope follows the actual scrubbed timeline, responsive pin distance recalculates on refresh, queued initialization frame is canceled on cleanup.
- `src/scss/components/_cursor.scss`: enforce the existing no-custom-cursor capability state for all pointer decorations.
- `src/scss/components/_video-reveal.scss`: simplify mobile rope shadow rendering.
- `scripts/qa-stabilization.mjs` and `scripts/qa-stabilization-runtime.mjs`: repeatable production and instrumented runtime QA.

## Evidence

See `artifacts/qa/stabilization/report.json` for production checks and `runtime-report.json` for instrumented development checks. A missing `failure` field and empty `errors`/`requests` arrays indicate a successful run. Screenshots are local QA artifacts, not an exhaustive visual acceptance record.

The production matrix covers seven destinations at 360, 375, 390, 393, 414, 430, 768, 820, 1024, 1280, 1440 and 1920 pixels (84 combinations); direct/new-tab and refresh for destination routes and aliases; Back/Forward; a Work hash link; touch sticker placement; normal-motion touch navigation; mobile reveal/reverse; landscape menu bounds; and content/navigation with WebGL unavailable. Public assets are compared byte-for-byte against their build copies.

Runtime checks cover all 40 original SVGs, complex/animated source classification and nontransparent atlas pixels, each SVG's actual target/flight/attachment pipeline, 110 retained attachments, orb framing at requested widths, exactly three Work timelines with forward/reverse progress and cleanup/re-entry, Home rope scrub/cleanup, and shared WebGL context loss/restoration. These checks use the existing instances; they do not create a second application renderer or Lenis.

## Build and remaining limits

`npm.cmd run build` passes. The main JavaScript bundle remains approximately 1.09 MB / 300 KB gzip, with Vite's large-chunk warning. Runtime retains the understood `THREE.Clock` deprecation warning; migration was outside this stabilization scope.

The video source in `experienceConfig.js` is empty. The original poster and cinematic reveal work; actual video playback cannot be verified without a supplied video. All available public models, images and SVGs are included in the build; there is no configured video payload to copy.

Browser QA uses local Chrome and touch/viewport emulation. Physical iOS/Android devices, Safari and Firefox have not been tested. Netlify rewrite packaging is verified locally; live-host refresh behavior must be checked after deployment. Vite preview provides its own SPA fallback and is not proof that a remote host applied `_redirects`. No deployment or external form submission was performed.

## Re-run

Use an installed Playwright module through `PLAYWRIGHT_MODULE` (absolute path to `playwright/index.mjs`), or install Playwright separately from the application. The runtime harness requires that environment variable.

1. `npm.cmd run build`
2. `npm.cmd run preview -- --host 127.0.0.1 --port 4180 --strictPort`
3. `node scripts/qa-stabilization.mjs`
4. `npm.cmd run dev -- --host 127.0.0.1 --port 5180 --strictPort`
5. `node scripts/qa-stabilization-runtime.mjs`

Run the browser suites sequentially to avoid GPU contention. `QA_URL` can override each suite's default server URL; the runtime suite requires the development server.
