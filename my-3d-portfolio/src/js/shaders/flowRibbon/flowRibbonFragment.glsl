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
    // Very soft, premium colors (tech/digital marketing vibe)
    vec3 color1 = vec3(0.1, 0.4, 0.8); // Deep soft blue
    vec3 color2 = vec3(0.2, 0.8, 0.9); // Cyan
    vec3 color3 = vec3(0.5, 0.2, 0.8); // Soft purple
    
    float mix1 = sin(normal.x * 3.0 + uTime) * 0.5 + 0.5;
    float mix2 = cos(normal.y * 3.0 - uTime) * 0.5 + 0.5;
    // Smooth mixing based on normals and time
    float mix1 = smoothstep(-1.0, 1.0, sin(normal.x * 2.0 + uTime * 0.5));
    float mix2 = smoothstep(-1.0, 1.0, cos(normal.y * 2.0 - uTime * 0.8));
    
    vec3 baseColor = mix(color1, color2, mix1);
    baseColor = mix(baseColor, color3, mix2);
    
    // Reduce overall intensity
    baseColor *= 0.6;
    // Elegant soft dimming
    baseColor *= 0.7;
    
    // Add shine but much softer
    baseColor += vec3(0.3) * pow(fresnel, 5.0);
    // Extremely subtle fresnel rim light, NOT blinding
    float rim = pow(fresnel, 3.0) * 0.3;
    baseColor += vec3(rim);
    
    gl_FragColor = vec4(baseColor, 1.0);
    gl_FragColor = vec4(baseColor, 0.9); // slightly transparent
}
