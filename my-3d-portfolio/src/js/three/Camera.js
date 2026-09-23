import * as THREE from "three";

export function createCamera(container) {
  const width = container.clientWidth;

  const height = container.clientHeight;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);

  camera.position.set(0, 0, 6);

  return camera;
}
