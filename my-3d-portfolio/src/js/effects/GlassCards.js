import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/glassRefract/glassRefractVertex.glsl';
import fragmentShader from '../shaders/glassRefract/glassRefractFragment.glsl';

export class GlassCards {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.cards = [];
        
        const geometry = new THREE.PlaneGeometry(1.6, 2.2);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uHover: { value: 0.0 },
                uOpacity: { value: 0.8 }
            },
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        // 3x2 grid
        for(let i=0; i<6; i++) {
            const x = (i % 3) - 1;
            const y = Math.floor(i / 3) - 0.5;
            
            const cardMat = material.clone();
            const mesh = new THREE.Mesh(geometry, cardMat);
            
            mesh.position.set(x * 2.2, -y * 2.8, 0);
            mesh.rotation.x = (Math.random() - 0.5) * 0.2;
            mesh.rotation.y = (Math.random() - 0.5) * 0.2;
            mesh.rotation.z = (Math.random() - 0.5) * 0.1;
            
            this.cards.push({
                mesh: mesh,
                offsetY: Math.random() * Math.PI * 2
            });
            
            this.group.add(mesh);
        }
        
        this.group.scale.set(0, 0, 0);
        this.scene.add(this.group);
    }
    
    update(delta, mouseX, mouseY) {
        const time = performance.now() * 0.001;
        
        this.cards.forEach(card => {
            card.mesh.material.uniforms.uTime.value += delta;
            // Float up and down
            card.mesh.position.y += Math.sin(time + card.offsetY) * 0.002;
        });
        
        this.group.rotation.y = mouseX * 0.1;
        this.group.rotation.x = -mouseY * 0.1;
    }
    
    show() {
        this.group.scale.set(1, 1, 1);
        this.cards.forEach((card, i) => {
            card.mesh.scale.set(0, 0, 0);
            gsap.to(card.mesh.scale, {
                x: 1, y: 1, z: 1,
                duration: 1,
                delay: i * 0.1,
                ease: "back.out(1.5)"
            });
        });
    }
    
    hide() {
        this.cards.forEach((card, i) => {
            gsap.to(card.mesh.scale, {
                x: 0, y: 0, z: 0,
                duration: 0.8,
                delay: i * 0.05,
                ease: "power2.in"
            });
        });
        
        // Hide group slightly after
        gsap.delayedCall(1, () => {
            this.group.scale.set(0, 0, 0);
        });
    }
}
