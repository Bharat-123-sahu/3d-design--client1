import * as THREE from 'three';
import gsap from 'gsap';
import shieldVertex from '../shaders/energyShield/energyShieldVertex.glsl';
import shieldFragment from '../shaders/energyShield/energyShieldFragment.glsl';

export class GeodesicSphere {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      position: new THREE.Vector3(0, 0, 0),
      ...options
    };
    
    this.group = new THREE.Group();
    this.group.position.copy(this.options.position);
    this.group.scale.set(0.01, 0.01, 0.01);
    this.group.visible = false;
    
    this.time = 0;
    this.lastRippleTime = 0;
    
    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uHexScale: { value: 8.0 },
      uRippleOrigin: { value: new THREE.Vector3(0, 0, 0) },
      uRippleTime: { value: 0 },
      uColor: { value: new THREE.Color(0x00ffff) },
      uOpacity: { value: 0.6 }
    };

    // Main mesh
    const geometry = new THREE.IcosahedronGeometry(1.5, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: shieldVertex,
      fragmentShader: shieldFragment,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    this.mainMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mainMesh);
    
    // Wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    // slightly larger to avoid z-fighting
    this.wireframeMesh.scale.setScalar(1.01);
    this.group.add(this.wireframeMesh);
    
    // Inner glow
    const innerGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2
    });
    this.innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    this.group.add(this.innerMesh);
    
    this.scene.add(this.group);
    
    this.targetRotation = { x: 0, y: 0 };
    this.isVisible = false;
  }
  
  update(delta, mouseX, mouseY) {
    if (!this.isVisible) return;
    
    this.time += delta;
    this.uniforms.uTime.value = this.time;
    this.uniforms.uMouse.value.set(mouseX, mouseY);
    
    // Ripple trigger logic
    if (this.time - this.lastRippleTime > 4.0) {
      this.lastRippleTime = this.time;
      this.uniforms.uRippleTime.value = this.time;
      
      // Random ripple origin
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      this.uniforms.uRippleOrigin.value.set(
        Math.sin(angle2) * Math.cos(angle1),
        Math.cos(angle2),
        Math.sin(angle2) * Math.sin(angle1)
      ).normalize();
    }
    
    // Slow rotation
    this.group.rotation.y += delta * 0.15;
    this.group.rotation.x += delta * 0.05;
    
    // Mouse proximity glow effect
    const mouseDist = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    const intensity = Math.max(0.2, 1.0 - mouseDist);
    this.innerMesh.material.opacity = 0.1 + intensity * 0.3;
    
    // Pulse inner mesh scale slightly
    this.innerMesh.scale.setScalar(1.0 + Math.sin(this.time * 2) * 0.03);
  }
  
  show() {
    this.isVisible = true;
    this.group.visible = true;
    gsap.killTweensOf(this.group.scale);
    gsap.to(this.group.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.5,
      ease: "elastic.out(1, 0.7)"
    });
  }
  
  hide() {
    gsap.killTweensOf(this.group.scale);
    gsap.to(this.group.scale, {
      x: 0.01, y: 0.01, z: 0.01,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        this.group.visible = false;
        this.isVisible = false;
      }
    });
  }
  
  setVisible(visible) {
    if (visible) this.show();
    else this.hide();
  }
  
  destroy() {
    this.scene.remove(this.group);
    
    if (this.mainMesh) {
      this.mainMesh.geometry.dispose();
      this.mainMesh.material.dispose();
    }
    if (this.wireframeMesh) {
      this.wireframeMesh.material.dispose();
    }
    if (this.innerMesh) {
      this.innerMesh.geometry.dispose();
      this.innerMesh.material.dispose();
    }
  }
}
