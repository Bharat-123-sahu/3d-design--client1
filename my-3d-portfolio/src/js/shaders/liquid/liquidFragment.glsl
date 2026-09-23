uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {

    float light =
        dot(
            normalize(vNormal),
            normalize(
                vec3(
                    0.5,
                    0.8,
                    1.0
                )
            )
        );

    light =
        smoothstep(
            -0.2,
            1.0,
            light
        );

    // Create an iridescent rim lighting effect
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    
    // Core color mixing based on height and light
    float gradient = smoothstep(-0.5, 0.5, vPosition.y);
    vec3 baseColor = mix(uColorA, uColorB, gradient * 0.3);
    
    // Add vibrant highlights where light hits
    vec3 highlightColor = mix(baseColor, uColorB, pow(light, 2.0));
    
    // Combine with fresnel for Funtech liquid glass feel
    vec3 finalColor = mix(baseColor, highlightColor, light) + (uColorB * fresnel * 0.5);

    gl_FragColor = vec4(finalColor, 1.0);
}