uniform float uTime;
uniform vec2 uMouse;
uniform float uCellCount;
uniform float uEdgeWidth;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec2 vUv;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
    vec2 uv = vUv * uCellCount;
    
    vec2 i_uv = floor(uv);
    vec2 f_uv = fract(uv);
    
    float m_dist = 10.0;
    vec2 m_point;
    vec2 m_id;
    
    // First pass to find closest point
    for (int y= -1; y <= 1; y++) {
        for (int x= -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x),float(y));
            vec2 point = random2(i_uv + neighbor);
            
            // Animate
            point = 0.5 + 0.5*sin(uTime + 6.2831*point);
            
            vec2 diff = neighbor + point - f_uv;
            float dist = length(diff);
            
            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
                m_id = i_uv + neighbor;
            }
        }
    }
    
    // Mouse point
    vec2 mouseUv = uMouse * uCellCount;
    float distToMouse = length(mouseUv - uv);
    if(distToMouse < m_dist && distToMouse < 2.0) {
        m_dist = distToMouse;
        m_id = vec2(1000.0); // special ID for mouse
    }

    // Color based on cell ID
    float randId = fract(sin(dot(m_id, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 cellColor;
    if(randId < 0.33) cellColor = uColorA;
    else if(randId < 0.66) cellColor = uColorB;
    else cellColor = uColorC;
    
    if(m_id == vec2(1000.0)) cellColor = vec3(1.0); // White for mouse cell
    
    // Edge detection (simple version based on distance)
    float edge = smoothstep(0.0, uEdgeWidth, m_dist);
    float glow = 1.0 - smoothstep(0.0, uEdgeWidth * 2.0, m_dist);
    
    // Add subtle gradient to interior
    cellColor *= (0.5 + 0.5 * m_dist);
    
    vec3 finalColor = mix(vec3(1.0), cellColor, edge);
    finalColor += cellColor * glow * 2.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
