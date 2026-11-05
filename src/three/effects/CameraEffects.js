import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

/**
 * Camera motion blur: smears the frame along the camera's screen-space
 * velocity (pan) plus a radial component (zoom). Driven from the camera rig.
 */
const motionBlurFrag = /* glsl */ `
uniform vec2 velocity;
uniform float zoom;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 v = velocity + (uv - 0.5) * zoom;
  if (length(v) < 0.0004) {
    outputColor = inputColor;
    return;
  }
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 12; i++) {
    float t = float(i) / 11.0 - 0.5;
    acc += texture2D(inputBuffer, uv + v * t);
  }
  outputColor = acc / 12.0;
}
`;

export class MotionBlurEffect extends Effect {
  constructor() {
    super("MotionBlurEffect", motionBlurFrag, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ["velocity", new Uniform(new Vector2())],
        ["zoom", new Uniform(0)],
      ]),
    });
  }
}

/**
 * Cheap lens: barrel distortion with radial chromatic aberration towards the
 * corners (each colour channel bends by a slightly different amount).
 */
const lensFrag = /* glsl */ `
uniform float distortion;
uniform float aberration;

vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return 0.5 + c * (1.0 + k * r2) / (1.0 + k * 0.5);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float r = texture2D(inputBuffer, barrel(uv, distortion + aberration)).r;
  vec4 g = texture2D(inputBuffer, barrel(uv, distortion));
  float b = texture2D(inputBuffer, barrel(uv, distortion - aberration)).b;
  outputColor = vec4(r, g.g, b, g.a);
}
`;

export class LensEffect extends Effect {
  constructor({ distortion = 0.08, aberration = 0.025 } = {}) {
    super("LensEffect", lensFrag, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ["distortion", new Uniform(distortion)],
        ["aberration", new Uniform(aberration)],
      ]),
    });
  }
}
