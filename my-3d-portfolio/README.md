# Premium Static 3D Portfolio

This project is a reusable static portfolio and creative website built with Vanilla JavaScript, Vite, SCSS, GSAP, Lenis, and Three.js.

The goal is to keep the codebase modular enough to reuse for future client projects while preserving a premium visual style, smooth transitions, and scalable 3D systems.

## Tech Stack

- Vite for fast local development and production builds.
- Vanilla JavaScript ES modules for a framework-free architecture.
- SCSS for reusable styling, component separation, and design tokens.
- Three.js for the 3D scene, model loading, particles, shader effects, and postprocessing.
- GSAP for timeline-based motion, scroll-linked animation, and page transitions.
- ScrollTrigger for section-triggered animation.
- Lenis for smooth scrolling that stays in sync with GSAP.
- GLSL shaders for custom background, liquid, and particle rendering.

## Why These Tools

- Vite keeps the project lightweight and easy to extend.
- Vanilla JavaScript makes the code portable for future client builds.
- SCSS keeps the design system maintainable without introducing a frontend framework.
- Three.js handles the immersive visual layer without blocking the DOM content.
- GSAP and Lenis provide premium motion and navigation polish.
- GLSL gives the project visual identity through custom shader effects.

## Folder Structure

```txt
src/
  js/
    components/        HTML string components for sections and layout
    animations/        GSAP and ScrollTrigger animation initializers
    core/              App-level orchestration
    effects/           Reusable Three.js effect systems
    three/             Scene setup, loaders, model wrapper, utilities
    shaders/           Shared GLSL shader sources
    main.js            App bootstrap
  scss/
    components/        Section and UI styling
    main.scss          SCSS entry point
public/
  images/              Static images and image-to-particle sources
  models/              GLB assets such as the hero model
```

## Architecture Flow

```txt
main.js
  -> renders app shell
  -> initializes Lenis
  -> creates SceneController
  -> creates ThreeScene
  -> creates TransitionManager
  -> binds navigation
  -> starts page and scroll animations

Navbar click
  -> TransitionManager.goTo(target)
  -> SceneController sets scene state
  -> page-transition overlay animates
  -> Lenis scrolls to the section
  -> Three.js visuals update for the active section
  -> section content animates in
```

## How `main.js` Works

`src/js/main.js` is the bootstrap file only.

- It renders the full page shell into `#app`.
- It initializes Lenis smooth scrolling.
- It creates a `SceneController` and connects it to `ThreeScene`.
- It creates `TransitionManager` and passes in Lenis plus scene control.
- It binds navigation links that use `data-nav-target`.
- It starts page load, text, scroll, project, about, and experience animations.

`main.js` should stay small. It should not contain Three.js internals or section-specific animation logic.

## How Components Work

The files in `src/js/components/` are reusable HTML string factories.

- `Navbar()` returns the header and navigation.
- `Hero()` returns the hero section and the `#hero-canvas` mount point.
- `About()` returns the about section content.
- `Experience()` returns the timeline section.
- `Projects()` returns the project grid.
- `Footer()` returns the footer shell.

These components should stay content-driven. Future client work should mainly replace text, images, links, and section-specific data.

## How `ThreeScene` Works

`src/js/three/ThreeScene.js` is the main Three.js orchestrator.

- Creates the scene, camera, renderer, lights, and postprocessing.
- Creates `ShaderBackground`, `ParticleEngine`, and `LiquidBlob`.
- Loads the hero GLB model with `ModelLoader`.
- Converts the image target into particles with `ParticleTarget`.
- Runs the animation loop with `THREE.Clock`.
- Updates the background, hero model, liquid blob, and particles every frame.
- Handles resize updates for camera, renderer, and composer.

`ThreeScene` owns rendering and visual updates, but it should not own navigation or DOM section behavior.

## How `HeroModel` Works

`src/js/three/HeroModel.js` wraps the loaded GLB scene.

- Handles responsive model placement for mobile and desktop.
- Keeps base position, scroll offset, and mouse-driven rotation separate.
- Smoothly interpolates rotation for a premium feel.
- Exposes reusable helpers such as `show()`, `hide()`, `setVisible()`, and `setScale()`.

The hero model should remain a self-contained object so it can be replaced with another client asset later.

## How `LiquidBlob` Works

`src/js/effects/LiquidBlob.js` is a reusable shader-driven 3D effect.

- Uses a high-detail `IcosahedronGeometry`.
- Animates with custom vertex and fragment shaders.
- Reacts to time, mouse position, and mouse velocity.
- Supports configurable colors, distortion, and movement intensity.
- Exposes `show()`, `hide()`, `setVisible()`, `setScale()`, `setColors()`, `setDistortion()`, and `destroy()`.

This effect is designed to be visually reusable across different client projects.

## How `ParticleEngine` Works

`src/js/effects/ParticleEngine.js` manages the reusable particle system.

- Builds a `BufferGeometry` with scattered initial positions.
- Uses custom attributes such as `position`, `aTarget`, and `aRandom`.
- Renders with a `ShaderMaterial` and additive blending.
- Interpolates between scattered and formed states using `uFormation`.
- Reacts to mouse position and velocity.
- Exposes `setTargets()`, `form()`, `scatter()`, `show()`, `hide()`, `setVisible()`, `update()`, and `destroy()`.

The engine is intentionally generic so it can be reused for text, images, icons, or section-specific particle effects.

## How `ParticleTarget` Works

`src/js/effects/ParticleTarget.js` converts a transparent image into particle coordinates.

- Loads an image.
- Draws it into an offscreen canvas.
- Reads pixel data.
- Ignores transparent or dark pixels.
- Converts visible pixels into X, Y, Z positions.
- Returns a `Float32Array` that `ParticleEngine.setTargets()` can consume.

This is the system that allows particles to form a character or image shape for the About section or future client assets.

## How GLSL Shaders Work

The shader files live in `src/js/shaders/`.

- `three/shaders/` contains the background shader pair.
- `shaders/liquid/` contains the blob vertex and fragment shaders.
- `shaders/particles/` contains the particle vertex and fragment shaders.

The JavaScript classes own the uniforms, while the GLSL files define the visual logic. This separation keeps the effect systems reusable and easier to maintain.

## How `SceneController` Works

`src/js/core/SceneController.js` is the state manager for Three.js visuals.

Scene states currently include:

- `hero`
- `about`
- `projects`
- `experience`
- `transition`

The controller decides which visuals should be visible and how they should animate for each section.

- `hero` shows the hero model and liquid blob.
- `about` hides the hero model and blob, then forms the particle character.
- `projects` hides the 3D focus and keeps the canvas quiet.
- `experience` also hides the 3D focus.
- `transition` prepares the visual system for navigation changes.

This is the correct place for scene rules. It should not know about section HTML structure or page transition timing.

## How `TransitionManager` Works

`src/js/core/TransitionManager.js` orchestrates navigation transitions.

- Prevents overlapping transitions.
- Calls `SceneController` to update the visual state.
- Covers the page with the transition overlay.
- Scrolls to the target section with Lenis or native scrolling.
- Reveals the page again.
- Animates section-specific content after navigation.

`TransitionManager` should not directly manage Three.js objects. It should talk only to `SceneController`.

## How Lenis Works

Lenis provides smooth scrolling for the page.

- `initSmoothScroll()` creates the Lenis instance.
- Scroll events are synced back into GSAP ScrollTrigger.
- The GSAP ticker drives `lenis.raf()` so scroll and animation remain synchronized.

This keeps the page feeling fluid while still allowing section-based navigation.

## How GSAP Animations Work

GSAP powers the motion system outside of Three.js.

- `pageLoad.js` handles the initial intro timeline.
- `textAnimations.js` splits and animates hero text.
- `scrollAnimations.js` handles global scroll motion.
- `aboutAnimations.js`, `experienceAnimations.js`, and `projectAnimations.js` handle section-specific reveal timing.
- `threeScrollAnimations.js` maps hero scroll progress into 3D model motion.

GSAP should remain the animation layer, while the component files remain content-only.

## How Navigation Transitions Work

Navigation uses `data-nav-target` on links.

1. The click is intercepted in `main.js`.
2. `TransitionManager.goTo(target)` runs.
3. The scene enters the `transition` state.
4. The overlay covers the page.
5. Lenis scrolls to the target section.
6. `SceneController` updates the Three.js visual state.
7. The overlay reveals the page.
8. The section content animates in.

This keeps the DOM transition and Three.js state in sync.

## How Image-to-Particle Formation Works

1. A transparent image such as `public/images/character.png` is loaded.
2. `ParticleTarget.fromImage()` samples the visible pixels.
3. It converts visible pixels into 3D target positions.
4. `ParticleEngine.setTargets()` copies those positions into the particle geometry.
5. `ParticleEngine.form()` raises the formation state.
6. Particles move from a scattered state into the final image shape.

This pattern is reusable for future logos, portraits, symbols, or section graphics.

## How To Reuse This Architecture For Another Client

- Replace the HTML component content in `src/js/components/`.
- Replace images in `public/images/`.
- Replace or add GLB models in `public/models/`.
- Swap colors, spacing, typography, and section layout in SCSS.
- Adjust animation timing in `src/js/animations/`.
- Swap scene presets in `SceneController`.
- Reuse `ParticleEngine`, `ParticleTarget`, `LiquidBlob`, and the shader files as shared systems.

## What Should Change For Another Project

- Copywriting and section order.
- Brand colors and typography.
- Images and project thumbnails.
- GLB models and particle source images.
- Scene state presets and transition timings.
- Section-specific animation timing.

## What Should Not Need Rewriting

- `main.js` bootstrap pattern.
- `TransitionManager` orchestration flow.
- `SceneController` state management pattern.
- `ThreeScene` rendering pipeline.
- `ParticleEngine` and `ParticleTarget`.
- `LiquidBlob`.
- `Lenis` and GSAP integration pattern.
- Shader loading structure.

## Current Completed Features

- Static Vite-based portfolio shell.
- Modular Vanilla JavaScript component architecture.
- Smooth scrolling with Lenis.
- Page load and scroll-triggered GSAP animations.
- Fixed Three.js visual layer.
- Hero GLB loading and responsive control.
- Shader background layer.
- Reusable liquid blob effect.
- Reusable particle engine.
- Image-to-particle target conversion.
- Scene-based Three.js state management.
- Navigation transition overlay.
- Production build verified successfully.

## Next Development Step

**Step 40 - Section-specific particle positioning and scaling**

The next improvement should let scenes configure the particle system more precisely, for example:

- `particles.setPosition({ x, y, z })`
- `particles.setScale(value)`
- section-specific layout presets for About, Projects, and future pages

That step should be added after this cleanup so the architecture stays reusable and predictable.
