uniform float uTime;

void main() {
    vec3 pos = position;
    // Subtle float animation
    pos.y += sin(pos.x * 2.0 + uTime * 0.5) * 0.15;
    pos.x += cos(pos.y * 2.0 + uTime * 0.5) * 0.15;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    // Size based on distance to camera
    gl_PointSize = (30.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
