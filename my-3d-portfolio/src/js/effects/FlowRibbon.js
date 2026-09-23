import * as THREE from "three";
import gsap from "gsap";
import vertexShader from "../shaders/flowRibbon/flowRibbonVertex.glsl";
import fragmentShader from "../shaders/flowRibbon/flowRibbonFragment.glsl";

export class FlowRibbon {
  constructor(scene) {
    this.scene = scene;
    // Changed to a much cooler, premium shape (TorusKnot)
    this.geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 256, 64);
    // Changed to a highly elegant thin ring (Torus) that will wave into a ribbon
    this.geometry = new THREE.TorusGeometry(1.8, 0.15, 64, 128);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: 2.0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // Removed specific plane rotations to let the TorusKnot float naturally
    this.mesh.rotation.x = Math.PI / 2.5; // Tilt it slightly towards camera

    this.mesh.scale.set(0, 0, 0);
    this.scene.add(this.mesh);
  }

  update(delta, mouseX, mouseY) {
    if (!this.mesh) return;
    this.material.uniforms.uTime.value += delta;

    // Add slow continuous rotation for the TorusKnot
    this.mesh.rotation.x += delta * 0.2;
    this.mesh.rotation.y += delta * 0.3;
    // Graceful spin around its own center
    this.mesh.rotation.z -= delta * 0.4;
    
    // Slight tilt wobble based on time
    this.mesh.rotation.x = (Math.PI / 2.5) + Math.sin(this.material.uniforms.uTime.value * 0.5) * 0.15;

    this.mesh.position.x = mouseX * 0.5;
    this.mesh.position.y = -mouseY * 0.5;
  }

  show() {
    gsap.to(this.mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.5,
      ease: "power3.out",
    });
  }

  hide() {
    gsap.to(this.mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1,
      ease: "power2.inOut",
    });
  }
}
