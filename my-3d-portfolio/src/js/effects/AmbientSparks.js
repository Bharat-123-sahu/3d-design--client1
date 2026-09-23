import * as THREE from 'three';
import vertexShader from '../shaders/sparks/sparksVertex.glsl';
import fragmentShader from '../shaders/sparks/sparksFragment.glsl';

export class AmbientSparks {
    constructor() {
        this.particleCount = 300;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const offsets = new Float32Array(this.particleCount);
        const sizes = new Float32Array(this.particleCount);
        
        for (let i = 0; i < this.particleCount; i++) {
            // Spread across wide area
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            
            offsets[i] = Math.random() * 100;
            sizes[i] = Math.random() * 2.0 + 1.0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.mesh = new THREE.Points(geometry, this.material);
    }
    
    update(time) {
        if (this.material) {
            this.material.uniforms.uTime.value = time;
        }
    }
}
