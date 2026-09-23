uniform float uTime;
attribute float aOffset;
attribute float aSize;

varying float vOpacity;

void main() {
    vec3 pos = position;
    
    // Float upwards and drift
    pos.y += mod(uTime * 0.5 + aOffset, 10.0);
    pos.x += sin(uTime * 1.0 + aOffset) * 0.5;
    pos.z += cos(uTime * 0.8 + aOffset) * 0.5;
    
    // Wrap around
    if (pos.y > 5.0) pos.y -= 10.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation
    gl_PointSize = aSize * (30.0 / -mvPosition.z);
    
    // Opacity based on height
    vOpacity = smoothstep(-5.0, -4.0, pos.y) * smoothstep(5.0, 4.0, pos.y);
    
    gl_Position = projectionMatrix * mvPosition;
}
