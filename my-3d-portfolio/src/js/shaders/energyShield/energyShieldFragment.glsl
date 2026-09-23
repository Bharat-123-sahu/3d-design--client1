uniform float uTime;
uniform vec2 uMouse;
uniform float uHexScale;
uniform vec3 uRippleOrigin;
uniform float uRippleTime;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

// Hexagon grid function
float hexDistance(vec2 p) {
    p = abs(p);
    float c = dot(p, normalize(vec2(1.0, 1.732)));
    return max(c, p.x);
}

vec4 hexGrid(vec2 uv) {
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    vec2 id = uv - gv;
    return vec4(gv.x, gv.y, id.x, id.y);
}

void main() {
    vec2 uv = vUv * uHexScale;
    vec4 hGrid = hexGrid(uv);
    vec2 hexUv = hGrid.xy;
    vec2 hexId = hGrid.zw;
    
    float hexDist = hexDistance(hexUv);
    
    // Hex edges
    float edge = smoothstep(0.4, 0.45, hexDist) * smoothstep(0.5, 0.45, hexDist);
    
    // Fresnel
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.0);
    
    // Ripple effect
    float distToOrigin = length(vWorldPosition - uRippleOrigin);
    float rippleWave = sin(distToOrigin * 10.0 - uTime * 5.0) * 0.5 + 0.5;
    float rippleIntensity = smoothstep(0.0, 2.0, distToOrigin) * smoothstep(5.0, 3.0, distToOrigin) * rippleWave;
    
    // Pulse animation based on hex ID
    float pulse = sin(hexId.x * 0.5 + hexId.y * 0.5 + uTime) * 0.5 + 0.5;
    
    float glow = edge * (0.5 + pulse * 0.5 + fresnel) + rippleIntensity;
    
    vec3 finalColor = uColor * glow;
    float alpha = glow * uOpacity;
    
    gl_FragColor = vec4(finalColor, alpha);
}
