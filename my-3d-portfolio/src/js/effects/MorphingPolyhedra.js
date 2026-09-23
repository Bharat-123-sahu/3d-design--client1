import * as THREE from 'three';
import gsap from 'gsap';

export class MorphingPolyhedra {
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
    
    // Main geometry
    const geometry = new THREE.IcosahedronGeometry(1.0, 4);
    
    // Prepare morph targets manually
    const positions = geometry.attributes.position;
    const vertexCount = positions.count;
    
    const originalPositions = new Float32Array(vertexCount * 3);
    const targetPositions1 = new Float32Array(vertexCount * 3); // Spiky
    const targetPositions2 = new Float32Array(vertexCount * 3); // Sphere-ish variations
    
    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      originalPositions[i*3] = x;
      originalPositions[i*3+1] = y;
      originalPositions[i*3+2] = z;
      
      const vec = new THREE.Vector3(x, y, z);
      const len = vec.length();
      
      // Target 1: Spiky based on coordinate signs
      const spikeFactor = 1.0 + 0.5 * Math.sin(x * 10) * Math.sin(y * 10) * Math.sin(z * 10);
      targetPositions1[i*3] = x * spikeFactor;
      targetPositions1[i*3+1] = y * spikeFactor;
      targetPositions1[i*3+2] = z * spikeFactor;
      
      // Target 2: Squashed/cubish
      const absMax = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
      const cubish = vec.clone().multiplyScalar(1.2 / (absMax > 0 ? absMax : 1));
      
      targetPositions2[i*3] = (x + cubish.x) * 0.5;
      targetPositions2[i*3+1] = (y + cubish.y) * 0.5;
      targetPositions2[i*3+2] = (z + cubish.z) * 0.5;
    }
    
    geometry.morphAttributes.position = [];
    geometry.morphAttributes.position[0] = new THREE.BufferAttribute(targetPositions1, 3);
    geometry.morphAttributes.position[1] = new THREE.BufferAttribute(targetPositions2, 3);
    
    const material = new THREE.MeshPhysicalMaterial({
      metalness: 0.9,
      roughness: 0.15,
      color: 0xaaddff,
      emissive: 0x002244,
      envMapIntensity: 1.0,
      flatShading: true
    });
    
    this.mainMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mainMesh);
    
    // Wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      wireframe: true
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    this.wireframeMesh.scale.setScalar(1.02);
    this.group.add(this.wireframeMesh);
    
    // Orbiting particles
    const particleGeometry = new THREE.BufferGeometry();
    const pCount = 50;
    const pPositions = new Float32Array(pCount * 3);
    
    for(let i=0; i<pCount; i++) {
      pPositions[i*3] = (Math.random() - 0.5) * 4;
      pPositions[i*3+1] = (Math.random() - 0.5) * 4;
      pPositions[i*3+2] = (Math.random() - 0.5) * 4;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.05,
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
    
    this.time += delta;
    
    // Morph interpolation
    const morphFactor1 = (Math.sin(this.time) + 1) * 0.5;
    const morphFactor2 = (Math.cos(this.time * 0.8) + 1) * 0.5;
    
    this.mainMesh.morphTargetInfluences[0] = morphFactor1;
    this.mainMesh.morphTargetInfluences[1] = morphFactor2;
    this.wireframeMesh.morphTargetInfluences[0] = morphFactor1;
    this.wireframeMesh.morphTargetInfluences[1] = morphFactor2;
    
    // Rotation
    this.group.rotation.y += delta * 0.2;
    this.group.rotation.x += delta * 0.1;
    
    // Particles rotation
    this.particles.rotation.y -= delta * 0.3;
    this.particles.rotation.z += delta * 0.15;
    
    // Scale pulsing
    const scale = 1.0 + Math.sin(this.time * 2) * 0.05;
    this.mainMesh.scale.setScalar(scale);
    this.wireframeMesh.scale.setScalar(scale * 1.02);
    
    // Mouse tilt
    this.targetRotation.x = mouseY * 0.4;
    this.targetRotation.y = mouseX * 0.4;
    
    // We apply base rotation plus mouse tilt
    this.mainMesh.rotation.x += (this.targetRotation.x - this.mainMesh.rotation.x) * delta * 5;
    this.mainMesh.rotation.z += (this.targetRotation.y - this.mainMesh.rotation.z) * delta * 5;
    this.wireframeMesh.rotation.copy(this.mainMesh.rotation);
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
    
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
  }
}
