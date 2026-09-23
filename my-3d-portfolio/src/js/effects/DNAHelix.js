import * as THREE from 'three';
import gsap from 'gsap';

export class DNAHelix {
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
    
    this.items = [];
    this.time = 0;
    
    const helixRadius = 0.5;
    const turns = 3;
    const pointsPerTurn = 16;
    const height = 4;
    const totalPoints = turns * pointsPerTurn;
    const heightStep = height / totalPoints;
    
    const sphereGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const sphereMaterial1 = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2
    });
    
    const sphereMaterial2 = new THREE.MeshStandardMaterial({
      color: 0x8855ff,
      emissive: 0x8855ff,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2
    });
    
    const connectorGeometry = new THREE.CylinderGeometry(0.015, 0.015, helixRadius * 2, 8);
    // Rotate cylinder so it spans horizontally between strands
    connectorGeometry.rotateZ(Math.PI / 2);
    
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8855ff,
      emissive: 0x8855ff,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.6
    });

    const startY = -height / 2;
    
    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / pointsPerTurn) * Math.PI * 2;
      const y = startY + i * heightStep;
      
      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;
      
      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;
      
      // Strand 1
      const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial1);
      sphere1.position.set(x1, y, z1);
      this.group.add(sphere1);
      this.items.push(sphere1);
      
      // Strand 2
      const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial2);
      sphere2.position.set(x2, y, z2);
      this.group.add(sphere2);
      this.items.push(sphere2);
      
      // Connector
      const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
      connector.position.set(0, y, 0);
      connector.rotation.y = -angle; // align with the spheres
      this.group.add(connector);
      this.items.push(connector);
    }
    
    this.scene.add(this.group);
    
    this.targetRotation = { x: 0, y: 0 };
    this.isVisible = false;
    
    this.geometries = [sphereGeometry, connectorGeometry];
    this.materials = [sphereMaterial1, sphereMaterial2, connectorMaterial];
  }
  
  update(delta, mouseX, mouseY) {
    if (!this.isVisible) return;
    
    this.time += delta;
    
    // Slow continuous rotation
    this.group.rotation.y += delta * 0.3;
    
    // Gentle floating animation
    this.group.position.y = this.options.position.y + Math.sin(this.time) * 0.15;
    
    // Mouse tilt
    this.targetRotation.x = mouseY * 0.2;
    this.targetRotation.z = -mouseX * 0.2;
    
    this.group.rotation.x += (this.targetRotation.x - this.group.rotation.x) * delta * 2;
    this.group.rotation.z += (this.targetRotation.z - this.group.rotation.z) * delta * 2;
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
    
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
  }
}
