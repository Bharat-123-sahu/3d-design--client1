varying float vOpacity;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    // Soft glowing circle
    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    
    if (alpha < 0.01) discard;
    
    // Warm spark color
    vec3 color = vec3(1.0, 0.8, 0.4);
    
    gl_FragColor = vec4(color, alpha);
}
