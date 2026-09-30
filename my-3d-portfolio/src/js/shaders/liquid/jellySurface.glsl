uniform float uTime;
uniform float uSpring;
uniform float uReduced;
uniform vec3 uImpact;

// Kept identical to LiquidBlob.surfacePoint: CPU picking and GPU patches agree.
vec3 jellySurface(vec3 p, float offset) {
  float dp = clamp(dot(p, uImpact), -1.0, 1.0);
  float dent = uSpring * (0.52 - pow(max(0.0, dp), 2.8) * 1.25);
  float dist = acos(dp);
  float ripple = sin(dist * 6.5 - uTime * 15.0) * exp(-dist * 1.6) * uSpring * 0.16;
  float breath = (1.0 - uReduced) * sin(p.x * 3.0 + p.y * 2.0 + uTime * 1.2) * 0.005;
  float radius = 1.0 + dent + ripple + breath + offset;
  return p * radius * vec3(1.0 + uSpring * 0.45, 1.0 - uSpring * 0.52, 1.0 + uSpring * 0.28);
}
vec3 jellyNormal(vec3 p) {
  vec3 t = normalize(cross(abs(p.y) > 0.95 ? vec3(1,0,0) : vec3(0,1,0), p));
  vec3 b = cross(p, t);
  vec3 origin = jellySurface(p, 0.0);
  return normalize(cross(jellySurface(normalize(p + t * 0.002), 0.0) - origin,
                         jellySurface(normalize(p + b * 0.002), 0.0) - origin));
}
