#include "./jellySurface.glsl"
attribute vec3 aCenter;
attribute vec3 aTangent;
attribute vec4 aMark; // atlas tile, birth time, footprint, surface layer
uniform float uClock;
uniform float uPreview;
varying vec2 vUv;
varying float vShade;
void main() {
  float age = max(0.0, (uClock - aMark.y) / 0.42);
  float t = min(age, 1.0) - 1.0;
  float settle = 1.0 + 2.1 * t*t*t + 1.1 * t*t;
  settle = mix(settle, 1.0, max(uReduced, uPreview));
  float lift = mix(0.18 * pow(1.0 - min(age, 1.0), 3.0) * (1.0 - uReduced), 0.13, uPreview);
  vec3 bitangent = cross(aCenter, aTangent);
  vec3 p = normalize(aCenter + (aTangent * position.x + bitangent * position.y) * aMark.z * settle);
  vec3 surface = jellySurface(p, 0.007 + aMark.w + lift);
  vec3 n = normalize(normalMatrix * jellyNormal(p));
  vShade = 0.72 + 0.28 * max(dot(n, normalize(vec3(-0.4, 0.7, 1.0))), 0.0);
  vUv = (vec2(mod(aMark.x, 8.0), 7.0 - floor(aMark.x / 8.0)) + uv) / vec2(8.0, 8.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surface, 1.0);
}
