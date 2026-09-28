import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

/**
 * Chromatic Aberration shader — splits RGB channels with offset
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: 0.003 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Offset increases toward edges for a lens-like effect
      float aberration = uOffset * dist * (1.0 + sin(uTime * 0.5) * 0.2);

      vec2 dir = center / max(length(center), 0.0001);
      float r = texture2D(tDiffuse, vUv + dir * aberration).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * aberration).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

/**
 * Film grain + vignette combo shader
 */
const FilmGrainVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainIntensity: { value: 0.06 },
    uVignetteIntensity: { value: 0.35 },
    uVignetteSmoothness: { value: 0.45 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrainIntensity;
    uniform float uVignetteIntensity;
    uniform float uVignetteSmoothness;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.8975, 397.2973));
      p += dot(p, p.yx + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Film grain
      float grain = hash(vUv * 1000.0 + uTime * 100.0) - 0.5;
      color.rgb += grain * uGrainIntensity;

      // Vignette
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float vignette = 1.0 - smoothstep(0.5 - uVignetteSmoothness, 0.5, dist);
      color.rgb *= mix(1.0 - uVignetteIntensity, 1.0, vignette);

      gl_FragColor = color;
    }
  `,
};

// Local depth blur in the existing composer. DOM content and the companion
// presentation stay sharp; only the sphere's screen region is sampled.
const JellyFocusShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uRadius: { value: 0 },
    uBlur: { value: 0 },
  },
  vertexShader: ChromaticAberrationShader.vertexShader,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform vec2 uResolution;
    uniform float uRadius;
    uniform float uBlur;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - uCenter;
      d.x *= uResolution.x / uResolution.y;
      float mask = 1.0 - smoothstep(uRadius, uRadius + 0.04, length(d));
      vec2 stepUV = vec2(uBlur) / uResolution;
      vec4 sharp = texture2D(tDiffuse, vUv);
      if (mask < 0.001) { gl_FragColor = sharp; return; }
      vec4 color = sharp * 0.2;
      color += texture2D(tDiffuse, vUv + vec2(stepUV.x, 0.0)) * 0.12;
      color += texture2D(tDiffuse, vUv - vec2(stepUV.x, 0.0)) * 0.12;
      color += texture2D(tDiffuse, vUv + vec2(0.0, stepUV.y)) * 0.12;
      color += texture2D(tDiffuse, vUv - vec2(0.0, stepUV.y)) * 0.12;
      color += texture2D(tDiffuse, vUv + stepUV) * 0.08;
      color += texture2D(tDiffuse, vUv - stepUV) * 0.08;
      color += texture2D(tDiffuse, vUv + vec2(stepUV.x, -stepUV.y)) * 0.08;
      color += texture2D(tDiffuse, vUv + vec2(-stepUV.x, stepUV.y)) * 0.08;
      gl_FragColor = mix(sharp, color, mask);
    }`,
};

export function createPostProcessing(renderer, scene, camera, width, height) {
  const composer = new EffectComposer(renderer);

  // Base render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom — cinematic glow
  const bloomPass = new UnrealBloomPass(
    { x: width, y: height },
    0.8, // strength
    0.5, // radius
    0.82, // threshold
  );
  composer.addPass(bloomPass);
  const jellyFocusPass = new ShaderPass(JellyFocusShader);
  jellyFocusPass.enabled = false;
  composer.addPass(jellyFocusPass);

  // Chromatic Aberration
  const chromaticPass = new ShaderPass(ChromaticAberrationShader);
  composer.addPass(chromaticPass);

  // Film Grain + Vignette
  const filmGrainPass = new ShaderPass(FilmGrainVignetteShader);
  composer.addPass(filmGrainPass);

  return {
    composer,
    bloomPass,
    chromaticPass,
    filmGrainPass,
    jellyFocusPass,
    setJellyFocus(x, y, radius, blur) {
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(radius) ||
        !Number.isFinite(blur) ||
        blur <= 0.05 ||
        radius <= 0
      ) {
        jellyFocusPass.enabled = false;
        return;
      }
      jellyFocusPass.enabled = true;
      jellyFocusPass.uniforms.uCenter.value.set(x, y);
      jellyFocusPass.uniforms.uRadius.value = radius;
      jellyFocusPass.uniforms.uBlur.value = blur;
    },

    resize(width, height, profile) {
      composer.setPixelRatio(profile.dpr * (profile.lowPower ? 0.8 : 1));
      composer.setSize(width, height);
      jellyFocusPass.uniforms.uResolution.value.set(width, height);
      chromaticPass.enabled = !profile.lowPower && !profile.reduced;
      filmGrainPass.uniforms.uGrainIntensity.value = profile.reduced
        ? 0
        : profile.lowPower
          ? 0.025
          : 0.06;
    },
    destroy() {
      jellyFocusPass.dispose();
      bloomPass.dispose();
      chromaticPass.dispose();
      filmGrainPass.dispose();
      composer.dispose();
    },
    /**
     * Update time-based uniforms each frame
     */
    update(elapsed) {
      chromaticPass.uniforms.uTime.value = elapsed;
      filmGrainPass.uniforms.uTime.value = elapsed;
    },

    /**
     * Adjust bloom for different sections
     */
    setBloomStrength(strength) {
      if (Number.isFinite(strength)) {
        bloomPass.strength = strength;
      }
    },

    /**
     * Adjust chromatic aberration intensity
     */
    setChromaticOffset(offset) {
      if (Number.isFinite(offset)) {
        chromaticPass.uniforms.uOffset.value = offset;
      }
    },
  };
}
