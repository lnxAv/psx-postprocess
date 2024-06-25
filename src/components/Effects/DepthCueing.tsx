import React, { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { Effect } from 'postprocessing'

const fragmentShader = /* glsl */`
  #define MAX_COLOR_DEPTH 256
  uniform float uDarkness;
  uniform int uColorDepth;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
  {
      outputColor = vec4(uv, 1., 1.);
  }
`

type DepthCueingProps = {
  param: number
}

let uParam

// Effect implementation
class DepthCueingImpl extends Effect {
  constructor(props: DepthCueingProps) {
    super('DepthCueing', fragmentShader, {
      uniforms: new Map([
        ['uParam', new Uniform(props.param)],
    ]),
    })
    uParam = props.param
  }

  update() {
    // Updates here
  }
}

// Effect component
export const DepthCueing = forwardRef(function DepthCueing
({ param }: DepthCueingProps, ref) {
  const effect = useMemo(() => new DepthCueingImpl({param}), [param])
  return <primitive ref={ref} object={effect} dispose={null} />
})