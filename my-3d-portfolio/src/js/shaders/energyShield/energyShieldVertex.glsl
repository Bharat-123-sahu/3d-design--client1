varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

uniform float uTime;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    float pulse = sin(uTime * 2.0 + position.y * 5.0) * 0.02;
    vec3 displacedPosition = position + normal * pulse;
    
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
