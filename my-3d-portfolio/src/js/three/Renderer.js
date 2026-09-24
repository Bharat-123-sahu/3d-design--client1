import { getViewportProfile } from "../utils/responsive.js";
import * as THREE from "three";

export function createRenderer(container) {
  const profile = getViewportProfile();
  const renderer = new THREE.WebGLRenderer({
    antialias: !profile.lowPower,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: profile.lowPower ? "default" : "high-performance",
  });

  renderer.setPixelRatio(
    profile.dpr
  );

  renderer.setSize(
    container.clientWidth,
    container.clientHeight,
    false
  );

  // Correct color management
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Better cinematic contrast
  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1;

  renderer.shadowMap.enabled = !profile.lowPower;
  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  container.appendChild(
    renderer.domElement
  );

  return renderer;
}
