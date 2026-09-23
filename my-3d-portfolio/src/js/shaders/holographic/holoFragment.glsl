uniform float uTime;
uniform vec2 uMouse;
uniform float uFresnelPower;
uniform float uRainbowIntensity;
uniform vec3 uBaseColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float dotNV = dot(vNormal, viewDirection);
    float fresnel = pow(1.0 - max(dotNV, 0.0), uFresnelPower);
    
    // Iridescent effect
    float rainbowR = sin(dotNV * 10.0 + uTime) * 0.5 + 0.5;
    float rainbowG = sin(dotNV * 10.0 + uTime + 2.0) * 0.5 + 0.5;
    float rainbowB = sin(dotNV * 10.0 + uTime + 4.0) * 0.5 + 0.5;
    vec3 rainbow = vec3(rainbowR, rainbowG, rainbowB);
    
    // Scanlines
    float scanline = sin(vWorldPosition.y * 100.0 - uTime * 5.0) * 0.1 + 0.9;
    
    vec3 finalColor = mix(uBaseColor, rainbow, uRainbowIntensity * fresnel);
    finalColor += fresnel * 0.5; // Specular-ish highlights
    finalColor *= scanline;
    
    // Add subtle noise-based texture variation
    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 0.1;
    finalColor += noise;

    gl_FragColor = vec4(finalColor, fresnel * 0.8 + 0.2);
}
