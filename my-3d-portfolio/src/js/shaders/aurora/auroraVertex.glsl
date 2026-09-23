// Aurora Borealis wave effect — vertex shader
varying vec2 vUv;
varying vec3 vPosition;
varying float vElevation;
uniform float uTime;

// Simple value noise
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
  vec3 pos = position;

  // Rippling wave displacement
  float wave1 = smoothNoise(vec2(pos.x * 0.4 + uTime * 0.3, pos.y * 0.4));
  float wave2 = smoothNoise(vec2(pos.x * 0.7 - uTime * 0.2, pos.y * 0.6 + uTime * 0.1));
  float wave3 = smoothNoise(vec2(pos.x * 1.2 + uTime * 0.15, uTime * 0.4));
  
  float elevation = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * 0.6;
  pos.z += elevation;
  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
