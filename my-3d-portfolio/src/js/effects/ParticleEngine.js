import * as THREE from "three";

import particleVertexShader from "../shaders/particles/particleVertex.glsl";
import particleFragmentShader from "../shaders/particles/particleFragment.glsl";

export class ParticleEngine {
  constructor(
    scene,
    options = {
      interactionStrength: 0.15,
      velocityStrength: 0.35,
      returnSpeed: 0.05,
    },
  ) {
    this.scene = scene;

    this.basePosition = new THREE.Vector3(0, 0, 0);

this.targetPosition = new THREE.Vector3(0, 0, 0);

this.currentScale = 1;

this.targetScale = 1;

    this.targetFormation = 0;

    this.options = {
      count: 5000,

      size: 0.025,

      color: "#ffffff",

      spread: 4,

      formationSpeed: 0.05,
      interactionStrength: 0.15,

      velocityStrength: 0.35,

      returnSpeed: 0.05,

      ...options,
    };

    this.time = 0;

    this.create();
  }

  create() {
    const count = this.options.count;

    const positions = new Float32Array(count * 3);

    const targets = new Float32Array(count * 3);

    const random = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const index = i * 3;

      /*
       * Initial scattered position
       */

      positions[index] = (Math.random() - 0.5) * this.options.spread;

      positions[index + 1] = (Math.random() - 0.5) * this.options.spread;

      positions[index + 2] = (Math.random() - 0.5) * this.options.spread;

      /*
       * Target initially at origin
       */

      targets[index] = 0;
      targets[index + 1] = 0;
      targets[index + 2] = 0;

      random[i] = Math.random();
    }

    this.geometry = new THREE.BufferGeometry();

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );

    this.geometry.setAttribute(
      "aTarget",
      new THREE.BufferAttribute(targets, 3),
    );

    this.geometry.setAttribute("aRandom", new THREE.BufferAttribute(random, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,

      fragmentShader: particleFragmentShader,

      uniforms: {
        uTime: {
          value: 0,
        },

        uSize: {
          value: this.options.size,
        },

        uColor: {
          value: new THREE.Color(this.options.color),
        },

        uFormation: {
          value: 0,
        },

        uMouse: {
          value: new THREE.Vector2(0, 0),
        },

        uMouseVelocity: {
          value: new THREE.Vector2(0, 0),
        },

        uInteractionStrength: {
          value: this.options.interactionStrength,
        },

        uVelocityStrength: {
          value: this.options.velocityStrength,
        },
      },

      transparent: true,

      depthWrite: false,

      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);

    this.basePosition = new THREE.Vector3(0, 0, 0);

this.targetPosition = new THREE.Vector3(0, 0, 0);

this.currentScale = 1;

this.targetScale = 1;

this.scene.add(this.points);

    this.scene.add(this.points);
  }

  update(
  delta,
  mouseX = 0,
  mouseY = 0,
  velocityX = 0,
  velocityY = 0
) {
  this.time += delta;

  const uniforms =
    this.material.uniforms;

  uniforms.uTime.value =
    this.time;

  uniforms.uMouse.value.x +=
    (
      mouseX -
      uniforms.uMouse.value.x
    ) * 0.05;

  uniforms.uMouse.value.y +=
    (
      mouseY -
      uniforms.uMouse.value.y
    ) * 0.05;

  uniforms.uMouseVelocity.value.x +=
    (
      velocityX -
      uniforms.uMouseVelocity.value.x
    ) * 0.1;

  uniforms.uMouseVelocity.value.y +=
    (
      velocityY -
      uniforms.uMouseVelocity.value.y
    ) * 0.1;

  const formation =
    uniforms.uFormation.value;

  uniforms.uFormation.value +=
    (
      this.targetFormation -
      formation
    ) * this.options.returnSpeed;


    this.points.rotation.y +=
  delta * 0.05;

  this.points.rotation.x =
  Math.sin(
    this.time * 0.3
  ) * 0.03;


  this.points.position.lerp(
  this.targetPosition,
  0.06
);

this.currentScale +=
  (this.targetScale - this.currentScale) *
  0.06;

this.points.scale.setScalar(
  this.currentScale
);
}

  setVisible(visible) {
    this.points.visible = visible;
  }

  show() {
    this.setVisible(true);
  }

  hide() {
    this.setVisible(false);
  }

  destroy() {
    this.geometry.dispose();

    this.material.dispose();

    this.scene.remove(this.points);
  }

  setTargets(targetPositions) {
    const targetAttribute = this.geometry.getAttribute("aTarget");

    const targetArray = targetAttribute.array;

    const particleCount = this.options.count;

    const targetCount = targetPositions.length / 3;

    for (let i = 0; i < particleCount; i++) {
      const particleIndex = i * 3;

      /*
       * Reuse target positions
       * when image has fewer points
       */
      const sourceIndex = (i % targetCount) * 3;

      targetArray[particleIndex] = targetPositions[sourceIndex];

      targetArray[particleIndex + 1] = targetPositions[sourceIndex + 1];

      targetArray[particleIndex + 2] = targetPositions[sourceIndex + 2];
    }

    targetAttribute.needsUpdate = true;
  }

  form() {
    this.targetFormation = 1;
  }

  scatter() {
    this.targetFormation = 0;
  }

  setPosition({ x = 2.5, y = 0, z = 0 }) {
  this.targetPosition.set(x, y, z);
}

setScale(scale = 1.2) {
  this.targetScale = scale;
}

resetTransform() {
  this.targetPosition.set(0, 0, 0);

  this.targetScale = 1;
}

}
