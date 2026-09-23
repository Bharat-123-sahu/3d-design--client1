varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    // Iridescent colors (cyan -> rose -> lime)
    vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color2 = vec3(1.0, 0.0, 0.5); // Rose
    vec3 color3 = vec3(0.5, 1.0, 0.0); // Lime
    
    float mix1 = sin(normal.x * 2.0 + uTime) * 0.5 + 0.5;
    float mix2 = cos(normal.y * 2.0 - uTime) * 0.5 + 0.5;
    
    vec3 baseColor = mix(color1, color2, mix1);
    baseColor = mix(baseColor, color3, mix2);
    
    // Edge glow
    vec3 finalColor = baseColor + vec3(1.0) * fresnel * 0.8;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
