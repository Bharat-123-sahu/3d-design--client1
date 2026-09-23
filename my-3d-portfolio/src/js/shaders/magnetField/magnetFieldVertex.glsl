uniform float uTime;
attribute float speed;
varying float vSpeed;

void main() {
    vSpeed = speed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Size based on distance
    gl_PointSize = (20.0 / -mvPosition.z) * min(speed * 200.0 + 0.5, 2.0);
    gl_Position = projectionMatrix * mvPosition;
}
