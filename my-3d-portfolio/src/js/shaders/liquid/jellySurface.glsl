uniform float uTime;
uniform float uSpring;
uniform float uReduced;
uniform vec3 uImpact;

// Kept identical to LiquidBlob.surfacePoint: CPU picking and GPU patches agree.
vec3 jellySurface(vec3 p, float offset) {
  float dent = uSpring * (0.34 - pow(max(0.0, dot(p, uImpact)), 3.5) * 0.75);
  float breath = (1.0 - uReduced) * sin(p.x * 3.0 + p.y * 2.0 + uTime * 1.2) * 0.004;
  return p * (1.0 + dent + breath + offset) * vec3(1.0 + uSpring * 0.32, 1.0 - uSpring * 0.38, 1.0 + uSpring * 0.16);
}
vec3 jellyNormal(vec3 p) {
  vec3 t = normalize(cross(abs(p.y) > 0.95 ? vec3(1,0,0) : vec3(0,1,0), p));
  vec3 b = cross(p, t);
  vec3 origin = jellySurface(p, 0.0);
  return normalize(cross(jellySurface(normalize(p + t * 0.002), 0.0) - origin,
                         jellySurface(normalize(p + b * 0.002), 0.0) - origin));
}
