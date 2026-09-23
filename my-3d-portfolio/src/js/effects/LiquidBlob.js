import * as THREE from "three";
import gsap from "gsap";

import liquidVertexShader from "../shaders/liquid/liquidVertex.glsl";
import liquidFragmentShader from "../shaders/liquid/liquidFragment.glsl";

export class LiquidBlob {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.options = {
      radius: 1.4,

      colorA: "#00ffff",
      colorB: "#8b5cf6",

      distortion: 0.25,
      mouseStrength: 0.12,
      velocityStrength: 0.08,

      speed: 0.5,
      rotationSpeed: 0.15,

      ...options,
    };

    this.time = 0;

    this.mouse = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
    };

    this.create();
  }

  create() {
    const geometry =
      new THREE.IcosahedronGeometry(
        this.options.radius,
        64
      );

    const material =
      new THREE.ShaderMaterial({
        vertexShader: liquidVertexShader,

        fragmentShader:
          liquidFragmentShader,

        uniforms: {
          uTime: {
            value: 0,
          },

          uDistortion: {
            value:
              this.options.distortion,
          },

          uMouse: {
            value:
              new THREE.Vector2(0, 0),
          },

          uMouseVelocity: {
            value:
              new THREE.Vector2(0, 0),
          },

          uMouseStrength: {
            value:
              this.options.mouseStrength,
          },

          uVelocityStrength: {
            value:
              this.options.velocityStrength,
          },

          uColorA: {
            value: new THREE.Color(
              this.options.colorA
            ),
          },

          uColorB: {
            value: new THREE.Color(
              this.options.colorB
            ),
          },
        },

        transparent: false,
      });

    this.mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    this.scene.add(
      this.mesh
    );
  }

  update(
    delta,
    mouseX = 0,
    mouseY = 0,
    velocityX = 0,
    velocityY = 0
  ) {
    this.time +=
      delta * this.options.speed;

    this.mouse.x +=
      (mouseX - this.mouse.x) *
      0.05;

    this.mouse.y +=
      (mouseY - this.mouse.y) *
      0.05;

    this.mouse.velocityX +=
      (
        velocityX -
        this.mouse.velocityX
      ) * 0.1;

    this.mouse.velocityY +=
      (
        velocityY -
        this.mouse.velocityY
      ) * 0.1;

    const uniforms =
      this.mesh.material.uniforms;

    uniforms.uTime.value =
      this.time;

    uniforms.uMouse.value.set(
      this.mouse.x,
      this.mouse.y
    );

    uniforms.uMouseVelocity.value.set(
      this.mouse.velocityX,
      this.mouse.velocityY
    );

    this.mesh.rotation.y +=
      delta *
      this.options.rotationSpeed;
  }

  setColors(
    colorA,
    colorB
  ) {
    this.mesh.material.uniforms
      .uColorA.value.set(
        colorA
      );

    this.mesh.material.uniforms
      .uColorB.value.set(
        colorB
      );
  }

  setDistortion(value) {
    this.mesh.material.uniforms
      .uDistortion.value =
      value;
  }

  setVisible(visible) {
    this.mesh.visible = visible;
  }

  setScale(value) {
    this.mesh.scale.setScalar(value);
  }

  show({ scale = 1, duration = 0.8, ease = "power3.out" } = {}) {
    this.setVisible(true);

    gsap.to(this.mesh.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration,
      ease,
    });
  }

  hide({ scale = 0.01, duration = 0.5, ease = "power2.in" } = {}) {
    gsap.to(this.mesh.scale, {
      x: scale,
      y: scale,
      z: scale,
      duration,
      ease,
      onComplete: () => {
        this.setVisible(false);
      },
    });
  }

  destroy() {
    this.mesh.geometry.dispose();

    this.mesh.material.dispose();

    this.scene.remove(
      this.mesh
    );
  }
}
