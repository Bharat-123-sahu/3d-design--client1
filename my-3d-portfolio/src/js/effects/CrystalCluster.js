import * as THREE from 'three';
import gsap from 'gsap';

export class CrystalCluster {
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
    this.crystals = [];
    
    const crystalCount = 7 + Math.floor(Math.random() * 3); // 7 to 9
    
    const colors = [0x00ffff, 0x8855ff, 0xff4488];
    this.materials = [];
    
    for (let i = 0; i < crystalCount; i++) {
      const radius = 0.2 + Math.random() * 0.4;
      const geometry = new THREE.OctahedronGeometry(radius, 0);
      
      const stretchY = 2 + Math.random();
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        transmission: 0.8,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
        metalness: 0.1,
        ior: 2.0,
        thickness: 0.5,
        side: THREE.DoubleSide
      });
      
      this.materials.push(material);
      
      const crystal = new THREE.Mesh(geometry, material);
      
      crystal.scale.set(1, stretchY, 1);
      
      // Arrange in cluster
      if (i > 0) {
        crystal.position.set(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 1.5
        );
        
        crystal.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.5,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * Math.PI * 0.5
        );
      }
      
      // Store custom properties for animation
      crystal.userData = {
        basePosition: crystal.position.clone(),
        rotSpeedX: (Math.random() - 0.5) * 0.5,
        rotSpeedY: (Math.random() - 0.5) * 0.5,
        rotSpeedZ: (Math.random() - 0.5) * 0.5,
        floatSpeed: 1 + Math.random() * 2,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmplitude: 0.05 + Math.random() * 0.1
      };
      
      this.group.add(crystal);
      this.crystals.push(crystal);
    }
    
    // Inner light
    this.light = new THREE.PointLight(0xffffff, 2, 5);
    this.group.add(this.light);
    
    this.scene.add(this.group);
    
    this.isVisible = false;
  }
  
  update(delta, mouseX, mouseY) {
    if (!this.isVisible) return;
    
    this.time += delta;
    
    // Group rotation
    this.group.rotation.y += delta * 0.1;
    this.group.rotation.x = Math.sin(this.time * 0.2) * 0.1;
    
    // Individual crystal animation
    for (const crystal of this.crystals) {
      const data = crystal.userData;
      
      crystal.rotation.x += data.rotSpeedX * delta;
      crystal.rotation.y += data.rotSpeedY * delta;
      crystal.rotation.z += data.rotSpeedZ * delta;
      
      crystal.position.y = data.basePosition.y + Math.sin(this.time * data.floatSpeed + data.floatPhase) * data.floatAmplitude;
    }
    
    // Light pulse
    this.light.intensity = 1.5 + Math.sin(this.time * 3) * 0.5;
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
    
    for (const crystal of this.crystals) {
      crystal.geometry.dispose();
    }
    
    for (const material of this.materials) {
      material.dispose();
    }
    
    if (this.light) {
      this.light.dispose();
    }
  }
}
