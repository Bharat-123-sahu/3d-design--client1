varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uFrequency;

void main() {
    vUv = uv;
    
    vec3 newPosition = position;
    // Wave displacement
    newPosition.y += sin(position.x * uFrequency + uTime) * cos(position.z * uFrequency + uTime) * 0.5;
    
    // Compute normal approximately
    vec3 tangent = vec3(1.0, uFrequency * cos(position.x * uFrequency + uTime) * cos(position.z * uFrequency + uTime) * 0.5, 0.0);
    vec3 binormal = vec3(0.0, -uFrequency * sin(position.x * uFrequency + uTime) * sin(position.z * uFrequency + uTime) * 0.5, 1.0);
    vec3 computedNormal = normalize(cross(tangent, binormal));
    
    vNormal = normalMatrix * computedNormal;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
