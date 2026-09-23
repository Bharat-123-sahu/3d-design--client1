uniform float uTime;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    float freq = 2.0;
    float disp = sin(pos.y * freq + uTime * 3.0) * 0.3;
    
    vec2 dir = normalize(pos.xz);
    pos.x += dir.x * disp;
    pos.z += dir.y * disp;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
