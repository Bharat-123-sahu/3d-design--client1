varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // View dependent color
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    
    vec3 color1 = vec3(1.0, 0.0, 0.5); // Pink
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
    
    float mix1 = sin(normal.x * 3.0 + uTime) * 0.5 + 0.5;
    float mix2 = cos(normal.y * 3.0 - uTime) * 0.5 + 0.5;
    
    vec3 baseColor = mix(color1, color2, mix1);
    baseColor = mix(baseColor, color3, mix2);
    
    // Add shine
    baseColor += vec3(1.0) * pow(fresnel, 4.0);
    
    gl_FragColor = vec4(baseColor, 1.0);
}
