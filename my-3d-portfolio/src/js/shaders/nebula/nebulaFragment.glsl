uniform float uTime;
uniform vec2 uMouse;
uniform float uWarp;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

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
    vec2 mouseOffset = (uMouse - 0.5) * 0.2;
    uv += mouseOffset;
    
    // Domain warping
    vec2 q = vec2(0.);
    q.x = fbm(uv + 0.00 * uTime);
    q.y = fbm(uv + vec2(1.0));
    
    vec2 r = vec2(0.);
    r.x = fbm(uv + 1.0*q + vec2(1.7,9.2)+ 0.15*uTime );
    r.y = fbm(uv + 1.0*q + vec2(8.3,2.8)+ 0.126*uTime);
    
    float f = fbm(uv + r * uWarp);
    
    vec3 color = mix(uColorA, uColorB, clamp((f*f)*4.0,0.0,1.0));
    color = mix(color, uColorC, clamp(length(q),0.0,1.0));
    color = mix(color, vec3(1.0), clamp(length(r.x),0.0,1.0) * 0.2);
    
    // Stars
    float starVal = random(uv * 100.0);
    if(starVal > 0.99) {
        float twinkle = 0.5 + 0.5 * sin(uTime * 5.0 + random(uv)*100.0);
        color += vec3(1.0) * twinkle * (starVal - 0.99) * 100.0;
    }
    
    // Vignette
    vec2 vUv2 = vUv - 0.5;
    float vignette = 1.0 - smoothstep(0.3, 0.8, length(vUv2));
    color *= vignette;
    
    gl_FragColor = vec4(color * f * 2.0, 1.0);
}
