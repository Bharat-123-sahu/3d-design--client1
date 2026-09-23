void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    
    // Soft glowing circle
    float alpha = smoothstep(0.5, 0.1, d);
    
    // Bright cyan/white core fading to transparent
    vec3 coreColor = vec3(1.0, 1.0, 1.0);
    vec3 edgeColor = vec3(0.0, 1.0, 1.0);
    vec3 finalColor = mix(edgeColor, coreColor, smoothstep(0.3, 0.0, d));
    
    gl_FragColor = vec4(finalColor, alpha);
}
