import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

/**
 * The camera's lens, in one full-screen pass:
 *  - barrel distortion with radial chromatic aberration towards the corners
 *    (each colour channel bends by a slightly different amount)
 *  - motion blur while the camera moves: the frame is smeared along its
 *    screen-space velocity (pan) plus a radial component (zoom), driven
 *    from the camera rig. At rest this costs three taps per pixel.
 * (These used to be two passes; merged, the frame is read and written once.)
 */
const lensFrag = /* glsl */ `
uniform float distortion;
uniform float aberration;
uniform vec2 velocity;
uniform float zoom;

vec2 barrel(vec2 uv, float k) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  return 0.5 + c * (1.0 + k * r2) / (1.0 + k * 0.5);
}

vec3 lens(vec2 uv) {
  return vec3(
    texture2D(inputBuffer, barrel(uv, distortion + aberration)).r,
    texture2D(inputBuffer, barrel(uv, distortion)).g,
    texture2D(inputBuffer, barrel(uv, distortion - aberration)).b
  );
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 v = velocity + (uv - 0.5) * zoom;
  if (length(v) < 0.0004) {
    outputColor = vec4(lens(uv), inputColor.a);
    return;
  }
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    float t = float(i) / 9.0 - 0.5;
    acc += lens(uv + v * t);
  }
  outputColor = vec4(acc / 10.0, inputColor.a);
}
`;

export class CameraLensEffect extends Effect {
  constructor({ distortion = 0.07, aberration = 0.006 } = {}) {
    super("CameraLensEffect", lensFrag, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ["distortion", new Uniform(distortion)],
        ["aberration", new Uniform(aberration)],
        ["velocity", new Uniform(new Vector2())],
        ["zoom", new Uniform(0)],
      ]),
    });
  }
}
