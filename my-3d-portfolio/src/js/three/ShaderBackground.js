import * as THREE from "three";

import vertexShader from "./shaders/backgroundVertex.glsl";
import fragmentShader from "./shaders/backgroundFragment.glsl";

export class ShaderBackground {
  constructor(scene) {
    this.scene = scene;

    this.time = 0;

    this.create();
  }

  create() {
    const geometry =
      new THREE.PlaneGeometry(2, 2);

    this.material =
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,

        uniforms: {
          uTime: {
            value: 0,
          },

          uMouse: {
            value: new THREE.Vector2(0, 0),
          },
        },

        depthTest: false,
        depthWrite: false,
      });

    this.mesh =
      new THREE.Mesh(
        geometry,
        this.material
      );

    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -100;

    this.scene.add(this.mesh);
  }

  update(mouseX = 0, mouseY = 0) {
    this.time += 0.01;

    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uMouse.value.set(mouseX, mouseY);
  }

  destroy() {
    this.material.dispose();
    this.scene.remove(this.mesh);
  }
}
