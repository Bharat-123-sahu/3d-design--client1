varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

uniform float uTime;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec3 displacedPosition = position + normal * sin(position.y * 10.0 + uTime) * 0.02;
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
