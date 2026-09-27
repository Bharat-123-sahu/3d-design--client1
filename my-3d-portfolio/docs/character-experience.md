# Persistent character experience

Pip is available after the intro on every page. Click, tap, or hover over the character to choose Home, Work, Services, About, Experience, Contact, or Feedback. Keyboard users can open the destinations with Enter, move with Tab or arrow keys, and close with Escape.

## Architecture and implementation

| Area | Files | Integration |
| --- | --- | --- |
| Character | `src/js/three/CharacterModel.js` | Original articulated mouse replaces the unused boy implementation. One model provides blended idle, look, walk, run, stop, turn, sit, stand, point, wave, celebrate, thinking, curious and transition poses. Temporary reactions retain the underlying seated pose. No GLB animation clips were available; `hero.glb` is an unrelated unanimated mesh and remains untouched. |
| Travel | `src/js/core/CharacterNavigationManager.js` | Reuses the existing navigation manager, removes its duplicate primitive character, follows registry paths, turns through the shortest angle, eases travel and settling, and rejects overlapping movement. |
| Destinations | `src/js/data/navigationData.js` | Existing registry now also defines routes, rotation, scale, Experience and Feedback. Services is `/services`; `/value` remains supported. |
| Persistent controls | `src/js/components/CharacterNavigation.js` | Floating destination labels, hover/click/tap, native links, focus feedback, Escape, arrow navigation, active-page state and arrival announcements. No hamburger dependency. |
| Rendering | `src/js/three/ThreeScene.js` | Existing animation/resize loop renders the world and a small transparent companion viewport. The additional renderer shares the same scene and character, uses capped DPR and no postprocessing. No second animation loop or duplicate character. Main-world objects are hidden from the main camera during content viewing so they cannot obstruct text. |
| Routing | `Router.js`, `TransitionManager.js`, `SceneController.js`, `main.js` | Intro opens the requested route. Router holds the shared transition lock through content exit, movement, arrival and reveal; delegates content transitions to TransitionManager; coordinates Lenis; restores heading focus; reconciles browser history during travel. |
| Intro fix | `src/js/core/ThunderIntro.js` | Starts the WebGL exit before setting STARTING, which previously prevented the exit effect from running. |
| Furniture | `src/js/three/WorldScene.js` | Stops continuous furniture rotation, clears walk endpoints, aligns the About chair and nearby desk, grounds legs, preserves a seating anchor, and disposes owned geometries/materials/textures. |
| Feedback | `FeedbackPage.js`, `FeedbackController.js`, `feedbackService.js` | Native radio group, character reactions, optional note, validation, submission lock, abortable route cleanup and explicit unconfigured-delivery result. |
| Experience | `src/js/pages/ExperiencePage.js` | Uses the real career records already in `siteContent.js`. |
| Rope reveal | `VideoReveal.js`, `VideoRevealController.js`, `HomePage.js` | One reversible scrub timeline, responsive movement, reduced-motion static presentation, route cleanup, native video controls, offscreen pause and media-error feedback when a source is configured. |
| Styling/config | `_character-experience.scss`, `main.scss`, `experienceConfig.js` | Scoped responsive styling and centralized motion/content tuning. Existing framework, project data and Work cinematics remain in place. |

## Required content/integration

- Set `videoRevealConfig.src` in `src/js/data/experienceConfig.js` to an owned video URL/path. Optionally provide a WebVTT captions URL. Until then, the reveal displays the existing hero image with a clear film-coming-soon caption. No missing video request is made.
- Implement the API call in `src/js/services/feedbackService.js`. Return `status: "submitted"` only after server acknowledgement. Update the unconnected-delivery copy in `FeedbackPage.js` when enabling the service. The current UI never claims to send or save feedback.

## QA reproduction

- `npm run dev -- --host 127.0.0.1`
- `node scripts/qa-model.mjs` checks all procedural states for floor penetration, all destination pairs, and feedback validation.
- `node scripts/qa-character.mjs` uses an externally installed Playwright package. Set `PLAYWRIGHT_MODULE` to its absolute `index.mjs` path when it is not resolvable locally. Set `QA_BROWSER` to `chrome`, `msedge`, or `firefox` (default Chrome). No browser-testing dependency is added to this application.
- `node scripts/qa-touch.mjs` checks Chrome touch emulation, DPR caps, orientation, Back during travel and the legacy Services URL.
- Browser reports and screenshots are written to `artifacts/qa/`.

Browser viewport emulation does not establish real-phone GPU performance or Safari compatibility. See `docs/character-qa.md` for the verified coverage and remaining limits.
