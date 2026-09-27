#include "./jellySurface.glsl"
attribute vec3 aRest;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
void main() {
  vec3 surface = jellySurface(normalize(aRest), 0.0);
  vec4 view = modelViewMatrix * vec4(surface, 1.0);
  vNormal = normalize(normalMatrix * jellyNormal(normalize(aRest)));
  vView = -view.xyz;
  vLocal = surface;
  gl_Position = projectionMatrix * view;
}
