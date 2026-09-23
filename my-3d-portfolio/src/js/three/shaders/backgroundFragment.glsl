uniform float uTime;
uniform vec2 uMouse;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
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
    
    // Smooth mouse interaction
    float distToMouse = length(uv - uMouse);
    float mouseGlow = smoothstep(0.5, 0.0, distToMouse) * 0.15;
    
    vec2 p = uv * 3.0;
    float q = fbm(p - uTime * 0.1);
    float r = fbm(p + q + uTime * 0.2);
    
    float f = fbm(p + r);
    
    vec3 color1 = vec3(0.02, 0.0, 0.1); // Deep navy/near-black
    vec3 color2 = vec3(0.1, 0.0, 0.15); // Dark purple
    vec3 color3 = vec3(0.0, 0.05, 0.15); // Dark cyan/blue
    
    vec3 bg = mix(color1, color2, clamp(f*2.0, 0.0, 1.0));
    bg = mix(bg, color3, clamp(r, 0.0, 1.0));
    
    // Subtle twinkling stars
    float star = random(uv * 150.0);
    if(star > 0.995) {
        float twinkle = 0.5 + 0.5 * sin(uTime * 3.0 + random(uv) * 100.0);
        bg += vec3(0.8) * twinkle * (star - 0.995) * 200.0;
    }
    
    bg += mouseGlow * vec3(0.2, 0.4, 0.8);
    
    // Overall darkening for background
    bg *= 0.7;
    
    gl_FragColor = vec4(bg, 1.0);
}