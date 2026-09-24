import { getViewportProfile } from "../utils/responsive.js";
import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/constellationNet/constellationNetVertex.glsl';
import fragmentShader from '../shaders/constellationNet/constellationNetFragment.glsl';

export class ConstellationGraph {
    constructor(scene) {
        this.scene = scene;
        this.container = new THREE.Group();
        this.scene.add(this.container);
        
        this.numNodes = getViewportProfile().lowPower ? 24 : 40;
        this.radius = 4;
        this.maxConnectDistance = 2.5;
        
        this.initNodes();
        this.initLines();
        
        this.container.visible = false;
        this.container.traverse((child) => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0;
            }
        });
    }
    
    initNodes() {
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.numNodes * 3);
        this.basePositions = new Float32Array(this.numNodes * 3);
        
        for (let i = 0; i < this.numNodes; i++) {
            // Random position in sphere
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = Math.cbrt(Math.random()) * this.radius;
            
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            this.positions[i * 3] = x;
            this.positions[i * 3 + 1] = y;
            this.positions[i * 3 + 2] = z;
            
            this.basePositions[i * 3] = x;
            this.basePositions[i * 3 + 1] = y;
            this.basePositions[i * 3 + 2] = z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.points = new THREE.Points(geometry, this.material);
        this.container.add(this.points);
    }
    
    initLines() {
        // Max possible lines: n * (n - 1) / 2
        const maxLines = (this.numNodes * (this.numNodes - 1)) / 2;
        this.linePositions = new Float32Array(maxLines * 6);
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
        
        this.lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.lines = new THREE.LineSegments(geometry, this.lineMaterial);
        this.container.add(this.lines);
    }
    
    update(delta, mouseX, mouseY) {
        if (!this.container.visible) return;
        
        this.material.uniforms.uTime.value += delta;
        const time = this.material.uniforms.uTime.value;
        
        // Update nodes drift manually so we can calculate distances
        for (let i = 0; i < this.numNodes; i++) {
            const bx = this.basePositions[i * 3];
            const by = this.basePositions[i * 3 + 1];
            const bz = this.basePositions[i * 3 + 2];
            
            this.positions[i * 3] = bx + Math.sin(time * 0.5 + bx) * 0.3;
            this.positions[i * 3 + 1] = by + Math.cos(time * 0.5 + by) * 0.3;
            this.positions[i * 3 + 2] = bz + Math.sin(time * 0.5 + bz) * 0.3;
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
        
        // Update connections
        let lineIndex = 0;
        for (let i = 0; i < this.numNodes; i++) {
            for (let j = i + 1; j < this.numNodes; j++) {
                const dx = this.positions[i * 3] - this.positions[j * 3];
                const dy = this.positions[i * 3 + 1] - this.positions[j * 3 + 1];
                const dz = this.positions[i * 3 + 2] - this.positions[j * 3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;
                
                if (distSq < this.maxConnectDistance * this.maxConnectDistance) {
                    this.linePositions[lineIndex * 6] = this.positions[i * 3];
                    this.linePositions[lineIndex * 6 + 1] = this.positions[i * 3 + 1];
                    this.linePositions[lineIndex * 6 + 2] = this.positions[i * 3 + 2];
                    
                    this.linePositions[lineIndex * 6 + 3] = this.positions[j * 3];
                    this.linePositions[lineIndex * 6 + 4] = this.positions[j * 3 + 1];
                    this.linePositions[lineIndex * 6 + 5] = this.positions[j * 3 + 2];
                    
                    lineIndex++;
                }
            }
        }
        
        this.lines.geometry.setDrawRange(0, lineIndex * 2);
        this.lines.geometry.attributes.position.needsUpdate = true;
    }
    
    show() {
        this.container.visible = true;
        
        gsap.to(this.material, {
            opacity: 1,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
                this.material.uniforms.uTime.value += 0.01; 
            }
        });
        
        gsap.to(this.lineMaterial, {
            opacity: 0.3,
            duration: 1.5,
            ease: 'power2.out'
        });
    }
    
    hide() {
        gsap.to(this.material, {
            opacity: 0,
            duration: 1,
            ease: 'power2.in'
        });
        
        gsap.to(this.lineMaterial, {
            opacity: 0,
            duration: 1,
            ease: 'power2.in',
            onComplete: () => {
                this.container.visible = false;
            }
        });
    }
}
