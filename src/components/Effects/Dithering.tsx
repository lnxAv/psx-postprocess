import React, { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { BlendFunction, Effect } from 'postprocessing'

const fragmentShader = /* glsl */`
  #define MAX_COLOR_DEPTH 256
  uniform float uDarkness;
  uniform int uColorDepth;
  uniform int uPattern;

	const float bayer_2x2[4] = float[](
		0.0, 3./4.,
    2./4., 1./4.
  );

	const float bayer_4x4[16] = float[](
		0.00, 0.50, 0.10, 0.65,
		0.75, 0.25, 0.90, 0.35, 
		0.20, 0.70, 0.05, 0.50, 
		0.95, 0.40, 0.80, 0.30
  );

  const float bayer_8x8[64] = float[](
		00./64., 32./64., 08./64., 40./64., 02./64., 34./64., 10./64., 42./64.,
		48./64., 16./64., 56./64., 24./64., 50./64., 18./64., 58./64., 26./64.,
		12./64., 44./64., 04./64., 36./64., 14./64., 46./64., 06./64., 38./64.,
		60./64., 28./64., 52./64., 20./64., 62./64., 30./64., 54./64., 22./64.,
    03./64., 35./64., 11./64., 43./64., 01./64., 33./64., 09./64., 41./64.,
    51./64., 19./64., 59./64., 27./64., 49./64., 17./64., 57./64., 25./64.,
    15./64., 47./64., 07./64., 39./64., 13./64., 45./64., 05./64., 37./64.,
    63./64., 31./64., 55./64., 23./64., 61./64., 29./64., 53./64., 21./64.
  );

  const float cluster_8x8[64] = float[](
    24./64., 10./64., 12./64., 26./64., 35./64., 47./64., 49./64., 37./64.,
    08./64., 00./64., 02./64., 14./64., 45./64., 59./64., 61./64., 51./64.,
    22./64., 06./64., 04./64., 16./64., 43./64., 57./64., 63./64., 53./64.,
    30./64., 20./64., 18./64., 28./64., 33./64., 41./64., 55./64., 39./64.,
    34./64., 46./64., 48./64., 36./64., 25./64., 11./64., 13./64., 27./64.,
    44./64., 58./64., 60./64., 50./64., 09./64., 01./64., 03./64., 15./64.,
    42./64., 56./64., 62./64., 52./64., 23./64., 07./64., 05./64., 17./64.,
    32./64., 40./64., 54./64., 38./64., 31./64., 21./64., 19./64., 29./64.
  );

  float dithering_pattern(vec2 uv, float[4] pattern) {
    float ditherScale = 2.;
    vec2 slit = mod(uv, ditherScale);
    int i = int(slit.y) + int(slit.x) * int(ditherScale);
    return pattern[int(i)];
  }

  float dithering_pattern(vec2 uv, float[16] pattern) {
    float ditherScale = 4.;
    vec2 slit = mod(uv, ditherScale);
    int i = int(slit.y) + int(slit.x) * int(ditherScale);
    return pattern[int(i)];
  }

  float dithering_pattern(vec2 uv, float[64] pattern) {
    float ditherScale = 8.;
    vec2 slit = mod((uv), ditherScale);
    int i = int(slit.y) + int(slit.x) * int(ditherScale);
    return pattern[int(i)];
  }

  float reduce_color(float raw, float dither, int colorDepth) {
    int clampedDepth = clamp(colorDepth, 1, MAX_COLOR_DEPTH);
    float div = 1. / float(clampedDepth);
    float val = 0.0;
    int i = 0;
    while (i <= clampedDepth)
    {
      if (raw > div * (float(i + 1))) {
        i = i + 1;
        continue;
      }
      if (raw * float(clampedDepth) - float(i) <= dither * 0.999)
      {
        val = div * float(i);
      } 
      else
      {
        val = div * float(i + 1);
      }
      i = i+1;
      return val;
    }
    return val;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
  {
      float dithering_value;
      switch (uPattern) {
        case 0:
          dithering_value = dithering_pattern(gl_FragCoord.xy, bayer_2x2);
          break;
        case 1:
          dithering_value = dithering_pattern(gl_FragCoord.xy, bayer_4x4);
          break;
        case 2:
          dithering_value = dithering_pattern(gl_FragCoord.xy, bayer_8x8);
          break;
        case 3:
          dithering_value = dithering_pattern(gl_FragCoord.xy, cluster_8x8);
          break;
        default:
          dithering_value = dithering_pattern(gl_FragCoord.xy, bayer_4x4);
          break;
      }

      vec3 ditheredColor = vec3(
        reduce_color(inputColor.r, (dithering_value - uDarkness) * dithering_value + uDarkness, uColorDepth-1),
        reduce_color(inputColor.g, (dithering_value - uDarkness) * dithering_value + uDarkness, uColorDepth-1),
        reduce_color(inputColor.b, (dithering_value - uDarkness) * dithering_value + uDarkness, uColorDepth-1)
      );
      outputColor = vec4(ditheredColor, 1.);
  }
`

export enum DitheringPattern {
  BAYER_2,
  BAYER_4, // default
  BAYER_8,
  CLUSTER_8
}

type DitheringProps = {
  pattern: DitheringPattern,
  darkness: number,
  colorDepth: number,
  blendFunction: BlendFunction,
}

let uPattern: DitheringPattern;
let uDarkness: number;
let uColorDepth: number;

// Effect implementation
class DitheringImpl extends Effect {
  constructor({ pattern, darkness, colorDepth, blendFunction }: DitheringProps) {
    super('Dithering', fragmentShader, {
      blendFunction,
      uniforms: new Map([
        ['uPattern', new Uniform(pattern)],
        ['uDarkness', new Uniform(darkness)],
        ['uColorDepth', new Uniform(colorDepth)],
    ])
    })
    uPattern = pattern
    uDarkness = darkness
    uColorDepth = colorDepth
  }

  update() {
    // Updates here
    const patternUniform = this.uniforms.get('uPattern');
    if (patternUniform) patternUniform.value = uPattern;

    const darknessUniform = this.uniforms.get('uDarkness');
    if (darknessUniform) darknessUniform.value = uDarkness;

    const colorDepthUniform = this.uniforms.get('uColorDepth');
    if (colorDepthUniform) colorDepthUniform.value = uColorDepth;
}
}
// Effect component
export const Dithering = forwardRef(function Dithering
({ pattern = DitheringPattern.BAYER_4, darkness = 0.5, colorDepth = 16, blendFunction = BlendFunction.NORMAL }: DitheringProps, ref: any) {
  const effect = useMemo(() => new DitheringImpl({ pattern, darkness, colorDepth, blendFunction }), [colorDepth, darkness, blendFunction, pattern]);
  return <primitive ref={ref} object={effect} dispose={null} depthWrite={false} />;
});