import React, { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { Effect, EffectAttribute } from 'postprocessing'

const fragmentShader = /* glsl */`
  uniform vec4 uFogColor;
  uniform float uNearOffset;
  uniform float uFogDensity;

  float getFogFactor(float d)
  { ;
      float cameraNearOffset =  cameraNear - uNearOffset ;
      float cameraFarOffset = cameraFar;

      // Scale depth from [0, 1] to [cameraFar, cameraNear]
      float totalDepth = pow((cameraFarOffset) - (cameraNearOffset), (cameraNearOffset));
      float scaledDepth = totalDepth - (((d) * totalDepth));
      float shift = clamp((1. - scaledDepth), 0., 1.);
      shift /= totalDepth;
      return  shift * uFogDensity;
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor)  
  {
    float alpha = getFogFactor(depth);
    vec4 test = vec4(1.);
    outputColor = mix(inputColor, uFogColor, alpha);
  }
`

type DepthCueingProps = {
  fogColor?: [number, number, number, number],
  nearOffset?: number,
  fogDensity?: number,
}

let uFogColor: [number, number, number, number];
let uNearOffset: number;
let uFogDensity: number;

// Effect implementation
class DepthCueingImpl extends Effect {
  constructor({fogColor = [1,1,1,1], nearOffset = 0, fogDensity = 0.5}: DepthCueingProps) {
    super('DepthCueing', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform<any>>([
        ['uFogColor', new Uniform(fogColor)],
        ['uNearOffset', new Uniform(nearOffset)],
        ['uFogDensity', new Uniform(fogDensity)],
    ]),
    })
    uFogColor = fogColor
    uNearOffset = nearOffset
    uFogDensity = fogDensity
  }

  update() {
    // Updates here
    const fogColorUniform = this.uniforms.get('uFogColor');
    if (fogColorUniform) fogColorUniform.value = uFogColor;

    const nearOffsetUniform = this.uniforms.get('uNearOffset');
    if (nearOffsetUniform) nearOffsetUniform.value = uNearOffset;

    const fogDensityUniform = this.uniforms.get('uFogDensity');
    if (fogDensityUniform) fogDensityUniform.value = uFogDensity;
  }
}

// Effect component
export const DepthCueing = forwardRef(function DepthCueing
({ fogColor, nearOffset, fogDensity }: DepthCueingProps, ref) {
  const effect = useMemo(() => new DepthCueingImpl({fogColor, nearOffset, fogDensity}), [fogColor, nearOffset, fogDensity])
  return <primitive ref={ref} object={effect} dispose={null} />
})