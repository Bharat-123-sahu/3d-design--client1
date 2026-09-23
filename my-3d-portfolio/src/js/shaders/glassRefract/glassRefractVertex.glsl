varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uHover;
uniform float uTime;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 newPosition = position;
    // Slight hover displacement
    newPosition.z += sin(uTime * 2.0 + position.x) * 0.1 * uHover;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
