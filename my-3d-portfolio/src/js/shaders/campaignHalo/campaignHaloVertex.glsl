uniform float uTime;
uniform float uPulse;

varying vec2 vUv;
varying float vWave;

void main() {
  vUv = uv;

  vec3 transformed = position;
  float ring = length(position.xy);
  float wave = sin(ring * 7.0 - uTime * 2.2) * 0.18;
  float ripple = sin((position.x + position.y) * 3.2 + uTime * 1.4) * 0.08;
  transformed.z += (wave + ripple) * uPulse;

  vWave = wave + ripple;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
