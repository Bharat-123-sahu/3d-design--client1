uniform sampler2D uAtlas;
uniform float uFocus;
varying vec2 vUv;
varying float vShade;
void main() {
  vec4 ink = texture2D(uAtlas, vUv);
  if (ink.a < 0.35) discard;
  gl_FragColor = vec4(ink.rgb * vShade * mix(1.0, 0.65, uFocus), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
