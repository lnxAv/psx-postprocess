import React, { forwardRef, useMemo } from 'react'
import {  Uniform } from 'three'
import { Effect, EffectAttribute } from 'postprocessing'


/*
 * CRT Monitor Effect
 * FROM BABYLONJS TO THREE.JS
 * BY LnxAv (https://github.com/LnxAv)
 * @Param {curvature} defines the curvature of the monitor in the x and y axis
 * @Param {color} defines the color of the background of the monitor
 * @Param {scanlineOpacity} defines the opacity of the scanlines
 * @Param {scanlineResolution} defines the amount of scanlines in the x and y axis
 * @Param {scanlineSpeed} defines the speed of the scanlines
 * @Param {vignetteOpacity} defines the opacity of the vignette
 * @Param {ghostingIntensity} defines the intensity of the ghosting on a x and y axis
 * @Param {screenClampRange} defines the range of the screen clamp
 * 
*/

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec2 uCurvature;
  uniform vec4 uColor;
  uniform float uScanlineSpeed;
  uniform float uScanlineOpacity;
  uniform vec2 uScanlineResolution;
  uniform float uVignetteOpacity;
  uniform vec2 uGhostingIntensity;
  uniform float uScreenClampRange;
  uniform float uGamaCorrection;
  
  //? FUNCTIONS FROM https://babylonjs.medium.com/
  vec2 curveRemap(vec2 uv)
  {
    uv = uv * 2.0 -1.0;
    vec2 offset = abs(uv.yx) / vec2(uCurvature.x, uCurvature.y);
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
  }
  vec4 scanLineIntensity(float uv, float resolution, float opacity)
  {
    float intensity = sin(uv * resolution * PI * 2.0);
    intensity = ((0.5 * intensity) + 0.5) * 0.9 + 0.1;
    return vec4(vec3(pow(intensity, opacity)), 1.0);
  }
  vec4 vignetteIntensity(vec2 uv, vec2 resolution, float opacity)
  {
    float intensity = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    return vec4(vec3(clamp(pow((resolution.x / 4.0) * intensity, opacity), 0.0, 1.0)), 1.0);
  }
  //? END FUNCTIONS

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor)
  {
    vec2 remappedUV = curveRemap(vec2(uv));

    vec4 baseColor = inputColor;

    // vignette
    baseColor *= vignetteIntensity(remappedUV, uScanlineResolution, uVignetteOpacity);

    // scan lines
    baseColor *= scanLineIntensity(remappedUV.x + (uTime * uScanlineSpeed) , uScanlineResolution.x, uScanlineOpacity);
    baseColor *= scanLineIntensity(remappedUV.y + (uTime * uScanlineSpeed) , uScanlineResolution.y, uScanlineOpacity);

    // gama correction
    baseColor *= vec4(vec3(uScanlineOpacity + uGamaCorrection), 1.0);

    if (remappedUV.x < 0.0 || remappedUV.y < 0.0 || remappedUV.x > 1.0 || remappedUV.y > 1.0){
        outputColor = uColor;
    } else {
        outputColor = baseColor;
    };
  }
`

type CRTMonitorProps = {
  curvature?: [number, number]
  color?: [number, number, number, number]
  scanlineOpacity?: number
  scanlineResolution?: [number, number],
  scanlineSpeed?: number
  vignetteOpacity?: number
  ghostingIntensity?: [number, number],
  screenClampRange?: number,
  gammaCorrection?: number,
}

let uCurvature: [number, number];
let uColor: [number, number, number, number];
let uScanlineOpacity: number;
let uScanlineResolution: [number, number];
let uScanlineSpeed: number;
let uVignetteOpacity: number;
let uGhostingIntensity: [number, number];
let uScreenClampRange: number;
let uGamaCorrection: number;

// Effect implementation
class CRTMonitorImpl extends Effect {
  constructor({ curvature = [5.5 , 5.5], color = [0, 0, 0, 0], scanlineOpacity = 0.1, scanlineResolution = [1024, 2080], vignetteOpacity = 0.5, scanlineSpeed = 0.001, ghostingIntensity = [1, 1], screenClampRange = 1., gammaCorrection = 0.8 } : CRTMonitorProps) {
    super('CRTMonitor', fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform<any>>([
        ['uCurvature', new Uniform(curvature)],
        ['uColor', new Uniform(color)],
        ['uScanlineOpacity', new Uniform(scanlineOpacity)],
        ['uScanlineResolution', new Uniform(scanlineResolution)],
        ['uScanlineSpeed', new Uniform(scanlineSpeed)],
        ['uVignetteOpacity', new Uniform(vignetteOpacity)],
        ['uGhostingIntensity', new Uniform(ghostingIntensity)],
        ['uScreenClampRange', new Uniform(screenClampRange)],
        ['uGamaCorrection', new Uniform(gammaCorrection)],
        ['uTime', new Uniform(0)],
    ]),
    })
    uCurvature = curvature
    uColor = color
    uScanlineOpacity = scanlineOpacity
    uScanlineResolution = scanlineResolution
    uVignetteOpacity = vignetteOpacity
    uScanlineSpeed = scanlineSpeed
    uGhostingIntensity = ghostingIntensity
    uScreenClampRange = screenClampRange
    uGamaCorrection = gammaCorrection
  }

  update( render: any, input: any, delta: number ) {
    // Updates here
    const curvatureUniform = this.uniforms.get('uCurvature');
    if (curvatureUniform) curvatureUniform.value = uCurvature;

    const colorUniform = this.uniforms.get('uColor');
    if (colorUniform) colorUniform.value = uColor;

    const scanlineOpacityUniform = this.uniforms.get('uScanlineOpacity');
    if (scanlineOpacityUniform) scanlineOpacityUniform.value = uScanlineOpacity;

    const scanlineResolutionUniform = this.uniforms.get('uScanlineResolution');
    if (scanlineResolutionUniform) scanlineResolutionUniform.value = uScanlineResolution;

    const vignetteOpacityUniform = this.uniforms.get('uVignetteOpacity');
    if (vignetteOpacityUniform) vignetteOpacityUniform.value = uVignetteOpacity;

    const scanlineSpeedUniform = this.uniforms.get('uScanlineSpeed');
    if (scanlineSpeedUniform) scanlineSpeedUniform.value = uScanlineSpeed;

    const timeUniform = this.uniforms.get('uTime');
    if (timeUniform) timeUniform.value += delta;

    const ghostingIntensityUniform = this.uniforms.get('uGhostingIntensity');
    if (ghostingIntensityUniform) ghostingIntensityUniform.value = uGhostingIntensity;

    const screenClampRangeUniform = this.uniforms.get('uScreenClampRange');
    if (screenClampRangeUniform) screenClampRangeUniform.value = uScreenClampRange;

    const gammaCorrectionUniform = this.uniforms.get('uGamaCorrection');
    if (gammaCorrectionUniform) gammaCorrectionUniform.value = uGamaCorrection;
  }
}

// Effect component
export const CRTMonitor = forwardRef(function CRTMonitor
({ curvature, color, scanlineOpacity, scanlineResolution, vignetteOpacity, ghostingIntensity, screenClampRange, gammaCorrection }: CRTMonitorProps, ref) {
  const effect = useMemo(() => new CRTMonitorImpl({curvature, color, scanlineOpacity, scanlineResolution, vignetteOpacity, ghostingIntensity, screenClampRange, gammaCorrection,}), [curvature, color, scanlineOpacity, scanlineResolution, vignetteOpacity, ghostingIntensity, screenClampRange, gammaCorrection])
  return <primitive ref={ref} object={effect} dispose={null} />
})