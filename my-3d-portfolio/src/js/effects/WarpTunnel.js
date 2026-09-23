import * as THREE from 'three';
import gsap from 'gsap';
import vertexShader from '../shaders/warpTunnel/warpTunnelVertex.glsl';
import fragmentShader from '../shaders/warpTunnel/warpTunnelFragment.glsl';

export class WarpTunnel {
    constructor(scene) {
        this.scene = scene;
        this.container = new THREE.Group();
        this.scene.add(this.container);
        
        this.initTunnel();
        
        this.container.visible = false;
        this.material.opacity = 0;
    }
    
    initTunnel() {
        // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded
        const geometry = new THREE.CylinderGeometry(2, 2, 20, 64, 128, true);
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0 }
            },
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.tunnel = new THREE.Mesh(geometry, this.material);
        // Rotate so we look down the tunnel (along Z axis)
        this.tunnel.rotation.x = Math.PI / 2;
        
        this.container.add(this.tunnel);
    }
    
    update(delta, mouseX, mouseY) {
        if (!this.container.visible) return;
        
        this.material.uniforms.uTime.value += delta;
        
        // Subtle rotation based on mouse
        this.tunnel.rotation.z += delta * 0.2;
        this.tunnel.rotation.x = Math.PI / 2 + mouseY * 0.1;
        this.tunnel.rotation.y = mouseX * 0.1;
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
