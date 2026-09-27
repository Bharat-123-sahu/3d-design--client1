uniform sampler2D uAtlas;
uniform float uFocus;
uniform float uClock;
uniform float uReduced;
uniform float uAtlasGrid;
varying vec2 vUv;
varying float vShade;
varying vec2 vLocalUv;
void main() {
  vec4 ink = texture2D(uAtlas, vUv);
  if (ink.a < 0.04) discard;
  float sheen = pow(max(0.0, 1.0 - abs(vLocalUv.x * 0.6 + vLocalUv.y - 0.95
    + 0.055 * sin(uClock * 0.7) * (1.0 - uReduced)) * 4.0), 9.0) * 0.065;
  vec3 color = ink.rgb * (vShade + sheen);
  gl_FragColor = vec4(color * mix(1.0, 0.65, uFocus), ink.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
