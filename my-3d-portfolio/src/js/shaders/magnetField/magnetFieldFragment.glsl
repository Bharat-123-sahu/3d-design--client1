varying float vSpeed;
uniform float uOpacity;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if(d > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.0, d);
    
    vec3 fastColor = vec3(1.0, 0.1, 0.5); // Rose
    vec3 slowColor = vec3(0.0, 1.0, 1.0); // Cyan
    
    // Mix based on speed
    vec3 color = mix(slowColor, fastColor, min(vSpeed * 100.0, 1.0));
    
    gl_FragColor = vec4(color, alpha * uOpacity);
}
