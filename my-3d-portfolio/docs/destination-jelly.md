# Destination orb experience

The existing LiquidBlob is the shared hero orb for Home, Work, Services (`value`),
About, Experience, and Contact. Existing routes, page data, Work cinematics,
character navigation, scene, renderer, cameras, render loop, and Lenis are retained.
Feedback and other unrelated features are unchanged.

## Ownership and framing

- Router still waits for the character journey before mounting page content.
- DestinationHero moves the existing hero copy into an introduction immediately
  below one clean viewport; it owns route-scoped input and a focus-only keyboard
  placement button. It does not create a cursor or render loop.
- SceneController selects the destination theme and exposes picking/placement.
- ThreeScene updates LiquidBlob in its existing loop. The existing background
  plane is framed behind the destination camera so its edges cannot enter view.
- The existing route:destination-jelly ScrollTrigger and Lenis integration drive
  retreat, smaller screen size, reduced brightness, and localized composer blur.
  The orb stays visible. DOM content and the character companion remain sharp.

## Material

The custom jelly shader uses a near-black base, subtle refracted internal tint,
Fresnel edge response and a procedural studio environment sampled along the
reflected eye ray: a cool softbox, destination-colored strip, overhead card and
low fill. These are analytical environment reflections, not an HDRI or captures
of nearby scene objects. Existing ACES tone mapping and bloom are reused.

Home uses navy/violet/blue/pink; Work charcoal/orange/amber; Services deep
teal/cyan/green. Configuration remains in navigationData.js. Color transitions
use GSAP; framing uses time-based damping. One sphere and all session marks
survive destination changes. Travel fades the same orb out and arrival reveals
it again without recreating its resources.

## Surface and input

The 80 x 56 sphere uses a bounded radial dent and damped spring, integrated in
1/120-second substeps. Hover speed adds a small impulse; clicks add a stronger
impulse. It never changes topology. Motion recovers and reduced-motion mode
removes spring, ambient ripple, rotation and attachment overshoot.

LiquidBlob.deform and jellySurface.glsl intentionally implement the same surface
function. CPU positions support raycasting against the displaced geometry;
GPU finite-difference normals preserve smooth shading across the sphere seam.
SurfaceStickers uses the shared GLSL function on curved patches, so marks stay
attached through deformation, rotation, scale and camera travel.

Desktop hover displays one surface-oriented 3D preview. A click captures the
local hit and face normal, reserves the next curated sticker synchronously,
places the current mark with a short approach/settle animation, and exposes the
next preview. There is no busy-input lock, picker, panel, or selection mode.
Touch uses direct taps; pointer movement/cancellation/scroll rejects drags.
Text, links, cards, character navigation and dialogs retain input priority.
A keyboard-focusable placement button appears on focus and has a 44px target;
its label names the current sticker and a live region announces placement.

## Lifetime and cost

There is no eviction or configured sticker limit. Marks and per-destination
sequence positions last until reload or ThreeScene destruction. Sequences loop.
SurfaceStickers keeps one 1280 x 1024 atlas assembled from the 20 original local
SVGs, one instanced attached batch, and one preview. The SVGs have ivory die-cut
borders, dark inner outlines, saturated fills and a small silhouette shadow.

Capacity starts at 64 and doubles when needed; this is allocation capacity,
not an interaction limit. Growth copies instance attributes and disposes the
old geometry. No per-click geometry/material/texture or per-frame per-sticker
CPU deformation is allocated. Instance storage and vertex work grow with the
number of marks, as they must; draw count and texture count stay constant.
Overlapping marks naturally cover older ink, but older marks are retained.

Route cleanup aborts all route listeners, removes the keyboard control and
hides the preview. Scene destruction disposes batches, materials and atlas.
In-flight artwork requests cannot resurrect disposed scene resources.

## Validation

Run `npm.cmd run build` and `node scripts/qa-jelly.mjs` against a Vite server.
QA_URL defaults to http://127.0.0.1:5175. PLAYWRIGHT_MODULE can point to an
external Playwright index.mjs; no testing dependency is added to the app.
The harness covers Home/Work/Services at 1440, 1280, 768, 390 and 360px,
real pointer/touch input, sequence progression, retained marks, spring recovery,
scroll/reverse, keyboard focus/placement, reduced motion, one WebGL context,
route re-entry, and 150 extra clicks across instance-buffer growth. It captures
console/request failures, GPU resource counts and viewport screenshots.
Results are written to artifacts/qa/jelly/report.json.

Mobile validation is browser touch emulation, not physical-device testing.
There was no attached reference image available in this conversation; visual
work follows the written direction and original local artwork.
