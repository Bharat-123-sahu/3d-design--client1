uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

void main() {
    // Speed lines effect
    float dash = fract(vUv.y * 20.0 - uTime * 2.0);
    // Smooth streaks
    float glow = smoothstep(0.4, 0.6, dash) * smoothstep(0.6, 0.4, dash);
    
    // Fade out towards the edges (start and end of cylinder)
    float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    
    // Add vertical lines variation for random streaks
    float noise = fract(sin(dot(vec2(vUv.x * 100.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float streakIntensity = smoothstep(0.8, 1.0, noise);
    
    glow *= streakIntensity * edgeFade;
    
    vec3 baseColor = vec3(0.0, 0.0, 0.0);
    vec3 streakColor = vec3(0.4, 0.8, 1.0);
    vec3 finalColor = mix(baseColor, streakColor, glow * 2.0);
    
    gl_FragColor = vec4(finalColor, glow * 1.5 * uOpacity);
}
