import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/plasmaRing/plasmaRingVertex.glsl';
import fragmentShader from '../shaders/plasmaRing/plasmaRingFragment.glsl';

export class PlasmaRings {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.rings = [];
        
        const colors = [
            [new THREE.Color(0x6a0dad), new THREE.Color(0x00ffff)], // Purple, Cyan
            [new THREE.Color(0xff00ff), new THREE.Color(0x0000ff)], // Hot pink, Blue
            [new THREE.Color(0x00ffff), new THREE.Color(0xff00ff)], // Cyan, Hot pink
            [new THREE.Color(0x4b0082), new THREE.Color(0x00ced1)], // Indigo, Dark Turquoise
            [new THREE.Color(0x8a2be2), new THREE.Color(0xff1493)]  // BlueViolet, DeepPink
        ];
        
        for(let i=0; i<5; i++) {
            const radius = 1.5 + (i * 0.6);
            const geometry = new THREE.TorusGeometry(radius, 0.05, 16, 100);
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTime: { value: 0 },
                    uFrequency: { value: 20.0 + (i * 5.0) },
                    uColor1: { value: colors[i][0] },
                    uColor2: { value: colors[i][1] }
                },
                transparent: true,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            
            this.rings.push({
                mesh: mesh,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                speedZ: (Math.random() - 0.5) * 0.5
            });
            
            this.group.add(mesh);
        }
        
        this.group.scale.set(0, 0, 0);
        this.scene.add(this.group);
    }
    
    update(delta, mouseX, mouseY) {
        this.rings.forEach(ring => {
            ring.mesh.material.uniforms.uTime.value += delta;
            ring.mesh.rotation.x += ring.speedX * delta;
            ring.mesh.rotation.y += ring.speedY * delta;
            ring.mesh.rotation.z += ring.speedZ * delta;
        });
        
        this.group.rotation.y += delta * 0.1;
        this.group.rotation.x = mouseY * 0.2;
        this.group.rotation.y += mouseX * 0.2;
    }
    
    show() {
        gsap.to(this.group.scale, {
            x: 1, y: 1, z: 1,
            duration: 1.5,
            ease: "back.out(1.2)"
        });
    }
    
    hide() {
        gsap.to(this.group.scale, {
            x: 0, y: 0, z: 0,
            duration: 1,
            ease: "power2.inOut"
        });
    }
}
