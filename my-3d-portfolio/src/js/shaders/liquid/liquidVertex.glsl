uniform float uMouseStrength;
uniform float uVelocityStrength;

uniform float uTime;
uniform float uDistortion;

uniform vec2 uMouse;
uniform vec2 uMouseVelocity;

varying vec3 vNormal;
varying vec3 vPosition;

float hash(vec3 p) {
    p = fract(
        p * 0.3183099 + 0.1
    );

    p *= 17.0;

    return fract(
        p.x *
        p.y *
        p.z *
        (p.x + p.y + p.z)
    );
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(
                hash(i),
                hash(
                    i + vec3(
                        1.0,
                        0.0,
                        0.0
                    )
                ),
                f.x
            ),
            mix(
                hash(
                    i + vec3(
                        0.0,
                        1.0,
                        0.0
                    )
                ),
                hash(
                    i + vec3(
                        1.0,
                        1.0,
                        0.0
                    )
                ),
                f.x
            ),
            f.y
        ),
        mix(
            mix(
                hash(
                    i + vec3(
                        0.0,
                        0.0,
                        1.0
                    )
                ),
                hash(
                    i + vec3(
                        1.0,
                        0.0,
                        1.0
                    )
                ),
                f.x
            ),
            mix(
                hash(
                    i + vec3(
                        0.0,
                        1.0,
                        1.0
                    )
                ),
                hash(
                    i + vec3(
                        1.0,
                        1.0,
                        1.0
                    )
                ),
                f.x
            ),
            f.y
        ),
        f.z
    );
}

void main() {

    vec3 pos = position;

    /*
     * Organic base deformation
     */
    float n = noise(
        normal * 2.2 +
        uTime * 0.35
    );

    float baseDisplacement =
        (n - 0.5) *
        uDistortion;

    /*
     * Mouse influence
     */
    vec2 mouseDirection =
        uMouse * 0.35;

    float mouseDistance =
        length(
            mouseDirection
        );

    float mouseInfluence =
        smoothstep(
            0.9,
            0.0,
            mouseDistance
        );

    /*
     * Mouse velocity
     */
    float velocity =
        length(
            uMouseVelocity
        );

    float velocityInfluence =
        clamp(
            velocity * 8.0,
            0.0,
            1.0
        );

    /*
     * Combine deformation
     */
  float totalDisplacement =
    baseDisplacement +
    mouseInfluence *
    uMouseStrength +
    velocityInfluence *
    uVelocityStrength;
    
    pos +=
        normal *
        totalDisplacement;

    /*
     * Slight directional stretch
     */
    pos.x +=
        uMouse.x *
        mouseInfluence *
        0.08;

    pos.y +=
        uMouse.y *
        mouseInfluence *
        0.08;

    vNormal =
        normalize(
            normalMatrix *
            normal
        );

    vPosition = pos;

    gl_Position =
        projectionMatrix *
        modelViewMatrix *
        vec4(
            pos,
            1.0
        );
}