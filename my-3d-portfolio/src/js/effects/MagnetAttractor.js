import { getViewportProfile } from "../utils/responsive.js";
import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/magnetField/magnetFieldVertex.glsl';
import fragmentShader from '../shaders/magnetField/magnetFieldFragment.glsl';

export class MagnetAttractor {
    constructor(scene) {
        this.scene = scene;
        this.container = new THREE.Group();
        this.scene.add(this.container);
        
        this.numParticles = getViewportProfile().lowPower ? 600 : 2000;
        this.attractor = new THREE.Vector3(0, 0, 0);
        
        this.initParticles();
        
        this.container.visible = false;
    }
    
    initParticles() {
        const geometry = new THREE.BufferGeometry();
        
        this.positions = new Float32Array(this.numParticles * 3);
        this.velocities = new Float32Array(this.numParticles * 3);
        this.speeds = new Float32Array(this.numParticles);
        
        for (let i = 0; i < this.numParticles; i++) {
            // Random initial positions
            this.positions[i * 3] = (Math.random() - 0.5) * 10;
            this.positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            this.positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            
            this.velocities[i * 3] = 0;
            this.velocities[i * 3 + 1] = 0;
            this.velocities[i * 3 + 2] = 0;
            
            this.speeds[i] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(this.speeds, 1));
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.points = new THREE.Points(geometry, this.material);
        this.container.add(this.points);
    }
    
    update(delta, mouseX, mouseY) {
        if (!this.container.visible) return;
        
        this.material.uniforms.uTime.value += delta;
        
        // Update attractor target based on mouse
        // Assuming mouseX, mouseY are in normalized device coordinates (-1 to 1)
        // Project a distance into the scene
        this.attractor.x = mouseX * 5;
        this.attractor.y = mouseY * 5;
        this.attractor.z = 0;
        
        const damping = 0.95;
        const maxSpeed = 0.5;
        
        for (let i = 0; i < this.numParticles; i++) {
            const px = this.positions[i * 3];
            const py = this.positions[i * 3 + 1];
            const pz = this.positions[i * 3 + 2];
            
            // Vector from particle to attractor
            let dx = this.attractor.x - px;
            let dy = this.attractor.y - py;
            let dz = this.attractor.z - pz;
            
            const distSq = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSq) + 0.1; // Add small value to prevent division by zero
            
            // Inverse-square falloff attraction
            const force = 0.05 / distSq;
            
            dx /= dist;
            dy /= dist;
            dz /= dist;
            
            // Update velocities
            this.velocities[i * 3] += dx * force;
            this.velocities[i * 3 + 1] += dy * force;
            this.velocities[i * 3 + 2] += dz * force;
            
            // Apply damping
            this.velocities[i * 3] *= damping;
            this.velocities[i * 3 + 1] *= damping;
            this.velocities[i * 3 + 2] *= damping;
            
            // Limit speed to prevent exploding physics
            const vx = this.velocities[i * 3];
            const vy = this.velocities[i * 3 + 1];
            const vz = this.velocities[i * 3 + 2];
            
            const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
            if (speed > maxSpeed) {
                this.velocities[i * 3] = (vx / speed) * maxSpeed;
                this.velocities[i * 3 + 1] = (vy / speed) * maxSpeed;
                this.velocities[i * 3 + 2] = (vz / speed) * maxSpeed;
            }
            
            this.speeds[i] = speed;
            
            // Update positions
            this.positions[i * 3] += this.velocities[i * 3];
            this.positions[i * 3 + 1] += this.velocities[i * 3 + 1];
            this.positions[i * 3 + 2] += this.velocities[i * 3 + 2];
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
        this.points.geometry.attributes.speed.needsUpdate = true;
    }
    
    show() {
        this.container.visible = true;
        
        gsap.to(this.material.uniforms.uOpacity, {
            value: 1,
            duration: 1.5,
            ease: 'power2.out'
        });
    }
    
    hide() {
        gsap.to(this.material.uniforms.uOpacity, {
            value: 0,
            duration: 1,
            ease: 'power2.in',
            onComplete: () => {
                this.container.visible = false;
            }
        });
    }
}
