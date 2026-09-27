# Destination and environment integration

The existing `navigationData.js` registry remains the source of truth. Every node now owns its route/target, label, character position, rotation, scale, arrival action, camera framing, marker type, and optional `environment` settings (effect, bloom strength, active marker). Services keeps its existing internal `value` ID; the visible label is Services and the route is `/services`.

Existing environments reused:

| Destination | Route | Scene effect | World asset |
| --- | --- | --- | --- |
| Home | `/` | Campaign halo | House |
| About | `/about` | Plasma rings | Existing chair/studio |
| Work | `/work` | Glass cards | Monitor |
| Services | `/services` | Flow ribbon | Board |
| Experience | `/experience` | Constellation graph | Board |
| Contact | `/contact` | Magnetic attractor | Desk |
| Feedback | `/feedback` | Existing campaign halo | Existing board |

No new environment assets or feedback functionality were implemented. Team and Company remain existing standalone routes with their existing scene handlers; no invented character destinations were added.

## Ownership

- `main.js` registers destination page paths from the registry.
- `CharacterNavigationManager.js` handles travel and reports arrival; it no longer selects the world's active marker. Movement and responsive size are unchanged.
- `Router.js` calls `SceneController.setDestination()` after travel and before content reveal, using the existing TransitionManager and Lenis flow.
- `SceneController.js` selects the configured effect, bloom, and world marker. Initial state is neutral waiting. Missing optional effects safely hide effects rather than inventing assets. Transition-reset timers are cancellable.
- `WorldScene.js` retains all assets and rendering. Repeated active-marker requests are idempotent and light tweens replace previous light tweens.
- `threeScrollAnimations.js` sends section-only state requests. Shared `.hero`/`.footer` selectors no longer switch a selected destination to Home/Contact; existing scroll animation timelines remain active.

To add a destination, define its node with a real route and an existing effect/marker, then register its page renderer using that node's route. No SceneController handler is needed for registry destinations. A missing bespoke environment can use an existing effect or omit the optional environment configuration.

## QA

- `scripts/qa-destinations.mjs`: existing navigation regression checks plus every destination's effect, marker, content heading, and single persistent companion. Includes resize, rapid clicks, keyboard, and reduced motion.
- `scripts/qa-destinations-touch.mjs`: all destinations via touch, resize during travel, target sizes, no horizontal overflow, and Work scroll-trigger uniqueness, forward/reverse progression, and cleanup.
- Reports: `artifacts/qa/destinations-chrome/report.json` and `artifacts/qa/destinations-touch-report.json`.

Chrome desktop checks passed with no captured console errors or failed HTTP responses. All 12 touch checks passed at 390px/360px with no captured console errors, including all destinations, Work forward/reverse scrolling, re-entry, trigger cleanup, and preserving its selected environment during scrolling. The production build passed; its existing large-chunk warning remains. Browser tests use the Vite development server and emulated touch, not physical devices. No Firefox or Edge validation was performed in this phase.
