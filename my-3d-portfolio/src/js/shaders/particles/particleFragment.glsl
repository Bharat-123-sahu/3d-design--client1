uniform vec3 uColor;

varying float vAlpha;

void main() {

    /*
     * Circular particle
     */

    vec2 uv =
        gl_PointCoord -
        vec2(0.5);

    float distanceFromCenter =
        length(uv);

    /*
     * Soft edge
     */

    float alpha =
        smoothstep(
            0.5,
            0.0,
            distanceFromCenter
        );

    gl_FragColor =
        vec4(
            uColor,
            alpha * vAlpha
        );
}