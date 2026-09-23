uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec2 vUv;
varying vec3 vPosition;

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise based on Morgan McGuire @morgan3d
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    vec2 u = f*f*(3.0-2.0*f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm(in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    
    // Shift position based on mouse
    uv += (uMouse - 0.5) * 0.1;

    float t = uTime * 0.5;
    
    // Create aurora curtain shape
    float wave1 = sin(uv.x * 5.0 + t) * 0.1;
    float wave2 = sin(uv.x * 10.0 - t * 1.5) * 0.05;
    float wave3 = sin(uv.x * 3.0 + t * 0.8) * 0.2;
    
    float distortion = fbm(uv * 3.0 + vec2(t * 0.2, -t * 0.5));
    
    float curtain = uv.y + wave1 + wave2 + wave3 + distortion * 0.3;
    
    // Base shape
    float intensity = smoothstep(0.4, 0.5, curtain) * smoothstep(0.8, 0.5, curtain);
    
    // Color mixing
    vec3 color = mix(uColorA, uColorB, uv.y);
    color = mix(color, uColorC, distortion);
    
    // Soft glow
    float glow = pow(intensity, 1.5) * 2.0;
    vec3 finalColor = color * glow;
    
    // Fade at edges
    float edgeFade = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
    
    gl_FragColor = vec4(finalColor, glow * edgeFade);
}
