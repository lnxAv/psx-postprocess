import React, { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { Effect, EffectAttribute } from 'postprocessing'

const fragmentShader = /* glsl */`
  uniform vec4 uFogColor;
  uniform float uNearOffset;
  uniform float uFarOffset;

  float getFogFactor(float d)
  {
      const float FogDissipation = 1.;
      float cameraNearOffset =  cameraNear - 0.03 ;
      float cameraFarOffset = cameraFar;

      // Scale depth from [0, 1] to [cameraFar, cameraNear
      float totalDepth = pow((cameraFarOffset) - (cameraNearOffset), (cameraNearOffset));
      float scaledDepth = totalDepth - (((d) * totalDepth));
      float shift = clamp((1. - scaledDepth), 0., 1.);
      shift /= totalDepth;
      return  shift * FogDissipation;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor)  
  {

    float alpha = getFogFactor(depth);
    vec4 fogColor = vec4(1.);
    outputColor = mix(inputColor, fogColor, alpha);
    // outputColor = vec4(alpha);
  }
`

type DepthCueingProps = {
  fogColor: [number, number, number, number]
}

let uFogColor: [number, number, number, number];

// Effect implementation
class DepthCueingImpl extends Effect {
  constructor({fogColor}: DepthCueingProps) {
    super('DepthCueing', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map([
        ['uFogColor', new Uniform(fogColor)],
    ]),
    })
    uFogColor = fogColor
  }

  update() {
    // Updates here
    const fogColorUniform = this.uniforms.get('uFogColor');
    if (fogColorUniform) fogColorUniform.value = uFogColor;
  }
}

// Effect component
export const DepthCueing = forwardRef(function DepthCueing
({ fogColor }: DepthCueingProps, ref) {
  const effect = useMemo(() => new DepthCueingImpl({fogColor}), [fogColor])
  return <primitive ref={ref} object={effect} dispose={null} />
})