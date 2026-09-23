import * as THREE from "three";

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
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

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  container.appendChild(
    renderer.domElement
  );

  return renderer;
}
