uniform float uTime;
uniform float uSize;
uniform float uFormation;

uniform vec2 uMouse;
uniform vec2 uMouseVelocity;

uniform float uInteractionStrength;
uniform float uVelocityStrength;

attribute vec3 aTarget;
attribute float aRandom;

varying float vAlpha;

void main() {

    /*
     * Start with scattered position
     */

    vec3 scattered =
        position;

    /*
     * Target character position
     */

    vec3 formed =
        aTarget;

    /*
     * Smooth formation
     */

    vec3 pos =
        mix(
            scattered,
            formed,
            uFormation
        );

    /*
     * Small organic movement
     */

    float wave =
        sin(
            uTime * 1.2 +
            aRandom * 20.0
        );

    pos.z +=
        wave * 0.015 *
        uFormation;

    /*
     * Mouse influence
     */

    vec2 mouse =
        uMouse;

    float mouseDistance =
        distance(
            pos.xy,
            mouse * 2.0
        );

    float mouseInfluence =
        1.0 -
        smoothstep(
            0.0,
            1.2,
            mouseDistance
        );

    /*
     * Mouse velocity
     */

    float velocity =
        length(
            uMouseVelocity
        );

    /*
     * Push particles away
     * from moving cursor
     */

    vec2 direction =
        normalize(
            pos.xy -
            mouse * 2.0
        );

    pos.xy +=
        direction *
        mouseInfluence *
        velocity *
        uVelocityStrength;

    /*
     * Slight cursor attraction
     */

    pos.x +=
        mouse.x *
        mouseInfluence *
        uInteractionStrength *
        uFormation;

    pos.y +=
        mouse.y *
        mouseInfluence *
        uInteractionStrength *
        uFormation;

    /*
     * Transform
     */

    vec4 mvPosition =
        modelViewMatrix *
        vec4(
            pos,
            1.0
        );

    gl_PointSize =
        uSize *
        100.0 /
        -mvPosition.z;

    gl_Position =
        projectionMatrix *
        mvPosition;

    vAlpha =
        0.5 +
        uFormation * 0.5;
}