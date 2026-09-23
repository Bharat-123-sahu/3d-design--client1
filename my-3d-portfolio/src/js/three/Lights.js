import * as THREE from "three";

export function createLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);

  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);

  keyLight.position.set(3, 5, 4);

  keyLight.castShadow = true;

  keyLight.shadow.mapSize.set(1024, 1024);

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);

  fillLight.position.set(-4, 2, 2);

  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 2, 10);

  rimLight.position.set(2, 1, -3);

  scene.add(rimLight);

  return {
    ambientLight,
    keyLight,
    fillLight,
    rimLight,
  };
}
