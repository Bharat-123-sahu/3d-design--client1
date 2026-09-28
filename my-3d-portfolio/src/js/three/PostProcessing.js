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

    resize(width, height, profile) {
      composer.setPixelRatio(profile.dpr * (profile.lowPower ? 0.8 : 1));
      composer.setSize(width, height);
      chromaticPass.enabled = !profile.lowPower && !profile.reduced;
      filmGrainPass.uniforms.uGrainIntensity.value = profile.reduced ? 0 : profile.lowPower ? 0.025 : 0.06;
    },
    destroy() {
      bloomPass.dispose(); chromaticPass.dispose(); filmGrainPass.dispose(); composer.dispose();
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
      bloomPass.strength = strength;
    },

    /**
     * Adjust chromatic aberration intensity
     */
    setChromaticOffset(offset) {
      chromaticPass.uniforms.uOffset.value = offset;
    },
  };
}
