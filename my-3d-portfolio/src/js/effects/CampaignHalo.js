import * as THREE from "three";
import gsap from "gsap";

import vertexShader from "../shaders/campaignHalo/campaignHaloVertex.glsl";
import fragmentShader from "../shaders/campaignHalo/campaignHaloFragment.glsl";

export class CampaignHalo {
  constructor(scene) {
    this.group = new THREE.Group();
    this.layers = [];

    const geometry = new THREE.PlaneGeometry(5.8, 5.8, 180, 180);

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: index * 1.7 },
          uPulse: { value: 0.8 + index * 0.2 },
          uColorA: {
            value: new THREE.Color(index === 0 ? "#29d9ff" : "#bbff5c"),
          },
          uColorB: {
            value: new THREE.Color(index === 1 ? "#f84f8f" : "#8855ff"),
          },
          uColorC: { value: new THREE.Color("#ffffff") },
          uOpacity: { value: 0.0 },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = (Math.PI / 3) * index;
      mesh.position.z = -0.35 * index;
      mesh.scale.setScalar(0.72 + index * 0.18);

      this.layers.push(mesh);
      this.group.add(mesh);
    }

    this.group.rotation.x = -0.18;
    this.group.scale.setScalar(0.001);
    scene.add(this.group);
  }

  update(delta, mouseX, mouseY) {
    this.layers.forEach((layer, index) => {
      layer.material.uniforms.uTime.value += delta;
      layer.rotation.z += delta * (0.08 + index * 0.035);
    });

    this.group.rotation.y += (mouseX * 0.22 - this.group.rotation.y) * 0.035;
    this.group.rotation.x +=
      (-0.18 - mouseY * 0.12 - this.group.rotation.x) * 0.035;
  }

  show() {
    gsap.to(this.group.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.4,
      ease: "expo.out",
    });

    this.layers.forEach((layer, index) => {
      gsap.to(layer.material.uniforms.uOpacity, {
        value: 0.35 - index * 0.1, // Reduced significantly from 0.68
        duration: 1.1,
        delay: index * 0.08,
        ease: "power2.out",
      });
    });
  }

  hide() {
    gsap.to(this.group.scale, {
      x: 0.001,
      y: 0.001,
      z: 0.001,
      duration: 0.8,
      ease: "power2.inOut",
    });

    this.layers.forEach((layer) => {
      gsap.to(layer.material.uniforms.uOpacity, {
        value: 0,
        duration: 0.6,
        ease: "power2.inOut",
      });
    });
  }

  destroy() {
    this.layers.forEach((layer) => {
      layer.geometry.dispose();
      layer.material.dispose();
    });
  }
}
