varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uFrequency;

void main() {
    vUv = uv;
    
    vec3 newPosition = position;
    
    // Calculate angle around the Y axis
    float angle = atan(position.z, position.x);
    
    // Create a beautiful wavy ribbon effect by displacing Y based on the angle
    float wave = sin(angle * 3.0 + uTime * 1.2) * 0.6;
    float secondaryWave = cos(angle * 5.0 - uTime * 1.5) * 0.2;
    
    newPosition.y += wave + secondaryWave;
    
    // Slight expansion/contraction along the normal
    newPosition += normal * (sin(angle * 4.0 + uTime) * 0.05);
    
    // Pass transformed normal
    vNormal = normalMatrix * normal;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
