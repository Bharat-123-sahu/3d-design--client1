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
  float shadow = texture2D(uAtlas, vUv + vec2(-0.006, 0.009) / uAtlasGrid).a;
  if (ink.a < 0.12 && shadow < 0.35) discard;
  float sheen = pow(max(0.0, 1.0 - abs(vLocalUv.x * 0.6 + vLocalUv.y - 0.95
    + 0.055 * sin(uClock * 0.7) * (1.0 - uReduced)) * 4.0), 9.0) * 0.065;
  vec3 color = ink.rgb * (vShade + sheen);
  color = mix(vec3(0.012, 0.01, 0.018), color, smoothstep(0.08, 0.7, ink.a));
  gl_FragColor = vec4(color * mix(1.0, 0.65, uFocus), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
