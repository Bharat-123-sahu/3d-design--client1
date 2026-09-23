import * as THREE from 'three';
import gsap from 'gsap';
import holoVertex from '../shaders/holographic/holoVertex.glsl';
import holoFragment from '../shaders/holographic/holoFragment.glsl';

export class TorusKnotGalaxy {
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
    
    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uFresnelPower: { value: 3.0 },
      uRainbowIntensity: { value: 0.6 },
      uBaseColor: { value: new THREE.Color(0xaaddff) }
    };

    // Main mesh
    const geometry = new THREE.TorusKnotGeometry(1.2, 0.35, 200, 32);
    const material = new THREE.ShaderMaterial({
      vertexShader: holoVertex,
      fragmentShader: holoFragment,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.mainMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mainMesh);
    
    // Orbiting particle ring
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      
      const r1 = 1.2;
      const r2 = 0.35 + (Math.random() * 0.4 - 0.2);
      
      const x = (r1 + r2 * Math.cos(v)) * Math.cos(u);
      const y = (r1 + r2 * Math.cos(v)) * Math.sin(u);
      const z = r2 * Math.sin(v);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.02,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.group.add(this.particles);
    
    this.scene.add(this.group);
    
    this.targetRotation = { x: 0, y: 0 };
    this.isVisible = false;
  }
  
  update(delta, mouseX, mouseY) {
    if (!this.isVisible) return;
    
    this.uniforms.uTime.value += delta;
    this.uniforms.uMouse.value.set(mouseX, mouseY);
    
    // Auto-rotation
    this.mainMesh.rotation.y += delta * 0.2;
    this.mainMesh.rotation.z += delta * 0.1;
    
    this.particles.rotation.y -= delta * 0.3;
    this.particles.rotation.x += delta * 0.1;
    
    // Mouse influence
    this.targetRotation.x = mouseY * 0.3;
    this.targetRotation.y = mouseX * 0.3;
    
    this.group.rotation.x += (this.targetRotation.x - this.group.rotation.x) * delta * 5;
    this.group.rotation.y += (this.targetRotation.y - this.group.rotation.y) * delta * 5;
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
    
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
  }
}
