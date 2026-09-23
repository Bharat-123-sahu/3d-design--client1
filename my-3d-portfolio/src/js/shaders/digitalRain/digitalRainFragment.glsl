uniform float uTime;
uniform vec2 uMouse;
uniform float uSpeed;
uniform float uDensity;
uniform vec3 uColor;
uniform float uGlow;
uniform vec2 uResolution;

varying vec2 vUv;

float random(float x) {
    return fract(sin(x) * 43758.5453123);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = vUv;
    
    // Mouse repel
    float distToMouse = length(uv - uMouse);
    if(distToMouse < 0.1) {
        uv += normalize(uv - uMouse) * (0.1 - distToMouse) * 0.5;
    }

    vec3 color = vec3(0.0);
    
    for(float i = 0.0; i < 3.0; i++) {
        float layerScale = 1.0 + i * 0.5;
        vec2 gridUv = uv * uDensity * layerScale;
        float columnId = floor(gridUv.x);
        
        float speed = (0.5 + random(columnId + i * 10.0) * 1.5) * uSpeed;
        float offset = random(columnId * 13.0 + i) * 100.0;
        
        float time = uTime * speed + offset;
        float head = fract(-gridUv.y + time);
        
        float tail = smoothstep(1.0, 0.0, head); // Trail
        float brightHead = smoothstep(0.0, 0.05, head) * smoothstep(0.1, 0.05, head); // Bright spot
        
        // Character grid
        vec2 cellUv = fract(gridUv);
        float charBlock = smoothstep(0.1, 0.3, cellUv.x) * smoothstep(0.9, 0.7, cellUv.x) *
                          smoothstep(0.1, 0.3, cellUv.y) * smoothstep(0.9, 0.7, cellUv.y);
                          
        float cellRand = random(floor(gridUv) + floor(time * 10.0));
        float charIntensity = charBlock * (0.5 + cellRand * 0.5);
        
        float intensity = tail * charIntensity + brightHead * charBlock;
        float opacityLayer = 1.0 - (i * 0.2);
        
        color += uColor * intensity * opacityLayer;
        color += vec3(brightHead) * uGlow * opacityLayer;
    }
    
    gl_FragColor = vec4(color, length(color) * 0.8);
}
