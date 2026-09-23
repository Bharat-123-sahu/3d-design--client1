uniform sampler2D tDiffuse;
uniform float uProgress;
uniform float uTime;
uniform vec2 uDirection;

varying vec2 vUv;

// Simple 2D noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 uv = vUv;
    
    // Liquid distortion based on progress and time
    float n = noise(uv * 10.0 + uTime * 2.0);
    vec2 distortion = vec2(n, noise(uv * 10.0 - uTime * 2.0)) * 2.0 - 1.0;
    
    vec2 distortedUv = uv + distortion * uProgress * 0.1;
    
    vec4 texColor = texture2D(tDiffuse, distortedUv);
    
    // Fade out to black/background as progress goes to 1
    float alpha = 1.0 - smoothstep(0.0, 1.0, uProgress * 1.5 - uv.y * 0.5);
    
    gl_FragColor = vec4(texColor.rgb * alpha, texColor.a * alpha);
}
