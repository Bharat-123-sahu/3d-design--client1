import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/flowRibbon/flowRibbonVertex.glsl';
import fragmentShader from '../shaders/flowRibbon/flowRibbonFragment.glsl';

export class FlowRibbon {
    constructor(scene) {
        this.scene = scene;
        this.geometry = new THREE.PlaneGeometry(8, 2, 256, 64);
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uFrequency: { value: 1.5 }
            },
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 4;
        this.mesh.rotation.z = Math.PI / 8;
        
        this.mesh.scale.set(0, 0, 0);
        this.scene.add(this.mesh);
    }
    
    update(delta, mouseX, mouseY) {
        if (!this.mesh) return;
        this.material.uniforms.uTime.value += delta;
        this.mesh.position.x = mouseX * 0.5;
        this.mesh.position.y = -mouseY * 0.5;
    }
    
    show() {
        gsap.to(this.mesh.scale, {
            x: 1, y: 1, z: 1,
            duration: 1.5,
            ease: "power3.out"
        });
    }
    
    hide() {
        gsap.to(this.mesh.scale, {
            x: 0, y: 0, z: 0,
            duration: 1,
            ease: "power2.inOut"
        });
    }
}
