import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform float uIsLightMode;

varying vec2 vUv;
varying vec3 vWorldPosition;

// Noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 pos = vWorldPosition.xz * 0.5;
    
    // Mouse interaction distortion
    float mouseDist = length(pos - uMouse * 10.0);
    float mouseEffect = smoothstep(5.0, 0.0, mouseDist) * 0.5;
    
    // Contour lines using noise
    float n = snoise(pos * 0.8 - vec2(0.0, uTime * 0.2)) + mouseEffect;
    
    float contours = fract(n * 5.0);
    float line = smoothstep(0.9, 1.0, contours) + smoothstep(0.1, 0.0, contours);
    
    // Colors
    vec3 darkColor = vec3(0.0, 0.05, 0.1);
    vec3 lightColor = vec3(0.9, 0.95, 1.0);
    vec3 lineColor = mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 0.3, 0.8), uIsLightMode);
    
    vec3 baseColor = mix(darkColor, lightColor, uIsLightMode);
    
    // Falloff based on distance
    float distToCenter = length(vWorldPosition.xz);
    float alpha = smoothstep(10.0, 0.0, distToCenter);
    
    vec3 finalColor = mix(baseColor, lineColor, line * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

export class LiquidFloor {
    constructor() {
        const geometry = new THREE.PlaneGeometry(20, 20, 128, 128);
        geometry.rotateX(-Math.PI / 2);
        
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uIsLightMode: { value: 0.0 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, this.material);
    }
    
    update(time, mouse) {
        if (this.material) {
            this.material.uniforms.uTime.value = time;
            if (mouse) {
                this.material.uniforms.uMouse.value.copy(mouse);
            }
        }
    }
    
    setLightMode(isLightMode) {
        if (this.material) {
            this.material.uniforms.uIsLightMode.value = isLightMode ? 1.0 : 0.0;
        }
    }
}
