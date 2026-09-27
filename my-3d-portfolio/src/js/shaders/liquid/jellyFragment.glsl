uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uGlow;
uniform vec3 uBase;
uniform float uTime;
uniform float uLight;
uniform float uFocus;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;

// Camera-relative studio environment evaluated along the reflected eye ray.
// No additional scene, cubemap camera, or per-frame environment capture.
float panel(vec3 ray, vec3 direction, vec2 size, float softness) {
  vec3 forward = normalize(direction);
  vec3 right = normalize(cross(vec3(0,1,0), forward));
  vec3 up = cross(forward, right);
  float front = dot(ray, forward);
  vec2 uv = vec2(dot(ray, right), dot(ray, up)) / max(0.01, front);
  vec2 d = abs(uv) - size;
  return (1.0 - smoothstep(-softness, softness, max(d.x, d.y))) * smoothstep(0.0, 0.2, front);
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 eye = normalize(vView);
  float facing = max(dot(n, eye), 0.0);
  float fresnel = 0.055 + 0.945 * pow(1.0 - facing, 4.2);
  float rim = pow(1.0 - facing, 3.4);
  vec3 ray = reflect(-eye, n);
  ray.x += sin(uTime * 0.13) * 0.025;
  ray = normalize(ray);
  float key = panel(ray, vec3(-0.65, 0.9, 0.8), vec2(0.25, 0.65), 0.075);
  float strip = panel(ray, vec3(1.1, 0.22, 0.25), vec2(0.075, 0.9), 0.06);
  float ceiling = panel(ray, vec3(-0.15, 1.5, -0.25), vec2(0.95, 0.1), 0.16);
  float lower = panel(ray, vec3(-0.6, -0.9, 0.05), vec2(0.35, 0.08), 0.17);
  vec3 environment = vec3(0.8, 0.88, 1.0) * key * 2.8
    + uColorA * strip * 4.2 + uColorB * ceiling * 2.8 + uGlow * lower * 1.4;
  vec3 bent = refract(-eye, n, 0.75);
  float liquid = pow(0.5 + 0.5 * sin(bent.y * 7.0 + vLocal.x * 3.0 + uTime * 0.14), 3.0);
  vec3 tint = mix(uColorA, uColorB, smoothstep(-0.8, 0.9, vLocal.y));
  vec3 color = uBase * (0.6 + facing * 0.55);
  color += tint * (0.006 + liquid * 0.017) * facing;
  color += environment * (0.26 + fresnel * 0.74) * uLight;
  color += mix(uColorA, uGlow, smoothstep(-0.6, 0.8, n.y)) * rim * 0.72;
  color *= mix(1.0, 0.58, uFocus);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
