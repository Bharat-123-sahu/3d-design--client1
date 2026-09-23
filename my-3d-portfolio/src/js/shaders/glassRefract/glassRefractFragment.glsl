varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uOpacity;

// Simple 2D noise for frosted glass
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel for edge highlight
    float fresnel = dot(viewDir, normal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    // Noise distortion
    float noise = random(vUv * 100.0) * 0.05;
    
    vec3 baseColor = vec3(0.05, 0.05, 0.08); // Dark background
    vec3 glassColor = vec3(0.9, 0.9, 1.0) * fresnel * 0.5;
    
    vec3 finalColor = baseColor + glassColor + vec3(noise);
    
    gl_FragColor = vec4(finalColor, uOpacity);
}
