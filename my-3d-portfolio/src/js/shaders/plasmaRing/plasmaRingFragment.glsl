varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;
uniform float uFrequency;
uniform vec3 uColor1;
uniform vec3 uColor2;

// Simple 2D noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    // Center UVs
    vec2 centeredUv = vUv - 0.5;
    
    // Concentric rings
    float d = length(centeredUv);
    float rings = sin(d * uFrequency - uTime * 2.0);
    
    // Noise
    float n = random(vUv * 10.0) * 0.1;
    
    // Plasma mixing
    float mixVal = smoothstep(-1.0, 1.0, rings + n);
    vec3 color = mix(uColor1, uColor2, mixVal);
    
    // Add hot pink based on normal
    float rim = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
    color += vec3(1.0, 0.0, 0.5) * (1.0 - rim) * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}
