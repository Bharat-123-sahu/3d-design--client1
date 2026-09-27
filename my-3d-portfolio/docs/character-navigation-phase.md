# Character navigation refinement

Scope: responsive character size, deliberate travel, waiting after Start, and persistent destination selection. Existing unrelated feature work is preserved.

## Architecture and changes

- `src/js/data/experienceConfig.js`: central character settings. Visual scale is 0.70 above 1024px, 0.76 on tablets, and 0.64 at 600px and below. Hit areas are independent. Waiting position and movement timings live here.
- `src/js/main.js`: intro completion unlocks the world and companion without requesting a route. Even an initial deep URL waits for explicit selection.
- `src/js/core/CharacterNavigationManager.js`: extends the existing state machine and curved paths. Sine velocity gives zero endpoint speed, smooth acceleration/deceleration, tangent-facing turns, and distance-aware walk/run selection. Arrival settles before releasing the navigation lock.
- `src/js/three/CharacterModel.js`: continuous procedural gait driven by travel speed, blended poses, and scale-aware sitting alignment. The active procedural mouse has no imported animation clips to crossfade.
- `src/js/components/CharacterNavigation.js`: existing persistent companion UI also opens when the world character is clicked or hovered. Desktop supports hover/click and keyboard; touch uses tap. Listeners share the component's abort lifecycle.
- `src/js/three/ThreeScene.js`: companion presentation reuses the existing scene, model, WebGL renderer, and animation loop. A 2D canvas displays the companion crop. Canvas resizing and repaint happen together to avoid a blank frame during resize.

Destination content remains in `navigationData.js`. Links use the existing Router, TransitionManager, SceneController, and Lenis lifecycle. Services retains its existing internal `value` identifier. Existing destinations are reused, including the previously implemented Feedback route; this phase does not change its feature implementation.

## Validation

Run `npm.cmd run build` and `node scripts/qa-navigation-model.mjs`.

Browser harnesses use an existing Playwright installation via `PLAYWRIGHT_MODULE`; no project dependency was added:

- `scripts/qa-navigation-only.mjs` (`QA_BROWSER=chrome` or `msedge`): ten-second idle wait, direct world-character interaction, velocity sampling, repeated destinations, walk/run/walk transitions, rapid-click locking, widths 360/390/768/1024/1280/1440/1920, keyboard and reduced motion. Reports include console/request failures and assert one WebGL context.
- `scripts/qa-navigation-touch.mjs`: touch at 390px and 360px, direct URL waiting, repeated destinations, target sizes, overflow, and resizing during travel.
- `scripts/qa-navigation-model.mjs`: floor clearance and seat alignment at all three visual scales.

Machine-readable results are under `artifacts/qa/navigation-only-*`. Older broad QA scripts predate the explicit wait-after-Start requirement and must not be used as acceptance evidence for this phase.

Verified on 2026-09-26: production build passed; Chrome and Edge each passed all nine navigation checks against the Vite development server, with zero captured console errors and failed HTTP responses. All eight touch checks passed with zero captured console errors. Model checks passed at every configured scale. Browser coverage is automated/headless.

Limitations: automated desktop browser and emulated touch checks do not establish real-device performance or subjective visual acceptance. Firefox was unavailable after browser download attempts timed out. The production build retains its large-bundle warning.
