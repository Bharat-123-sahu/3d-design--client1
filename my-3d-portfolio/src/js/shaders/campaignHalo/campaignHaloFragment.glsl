uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;

varying vec2 vUv;
varying float vWave;

float circle(vec2 uv, float radius, float width) {
  float d = abs(length(uv) - radius);
  return 1.0 - smoothstep(0.0, width, d);
}

void main() {
  vec2 uv = vUv - 0.5;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);

  float rings = 0.0;
  rings += circle(uv, 0.16 + sin(uTime * 0.7) * 0.015, 0.014);
  rings += circle(uv, 0.28 + cos(uTime * 0.5) * 0.018, 0.012);
  rings += circle(uv, 0.39 + sin(uTime * 0.4) * 0.012, 0.01);

  float sweep = smoothstep(0.94, 1.0, sin(angle * 6.0 + uTime * 2.4));
  float data = smoothstep(0.65, 1.0, sin(angle * 18.0 - radius * 25.0 + uTime * 3.0));
  float glow = smoothstep(0.55, 0.0, radius) * 0.42;

  vec3 color = mix(uColorA, uColorB, radius * 1.8);
  color = mix(color, uColorC, sweep * 0.75 + data * 0.25);

  float alpha = (rings * 0.74 + sweep * 0.22 + data * rings * 0.32 + glow + abs(vWave) * 0.18) * uOpacity;
  gl_FragColor = vec4(color, alpha);
}
