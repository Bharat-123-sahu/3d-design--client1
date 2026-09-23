import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/morphBlob/morphBlobVertex.glsl';
import fragmentShader from '../shaders/morphBlob/morphBlobFragment.glsl';

export class MorphBlob {
    constructor(scene) {
        this.scene = scene;
        this.geometry = new THREE.IcosahedronGeometry(2, 64);
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uFrequency: { value: 1.2 },
                uAmplitude: { value: 0.3 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) }
            },
            wireframe: false
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(0, 0, 0);
        this.scene.add(this.mesh);
    }
    
    update(delta, mouseX, mouseY) {
        if (!this.mesh) return;
        this.material.uniforms.uTime.value += delta;
        this.material.uniforms.uMouse.value.set(
            (mouseX + 1) * 0.5,
            (mouseY + 1) * 0.5
        );
        this.mesh.rotation.y += delta * 0.2;
        this.mesh.rotation.x += delta * 0.1;
    }
    
    show() {
        gsap.to(this.mesh.scale, {
            x: 1, y: 1, z: 1,
            duration: 1.5,
            ease: "elastic.out(1, 0.5)"
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
