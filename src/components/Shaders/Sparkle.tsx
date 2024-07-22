import { animate } from 'motion'
import React, { forwardRef, useMemo } from 'react'
import { AdditiveBlending, Color, ShaderMaterial, Texture, Uniform, Vector2} from 'three'

type SparkleProps = {
    pixelRatio?: number,
    texture?: Texture,
    color?: Color,
    size?: number,
    duration?: number,
}

//? GLSL
const fragmentShader = /* glsl */`
uniform sampler2D uTexture;
uniform vec3 uColor;
void main()
{
    float textureAlpha = texture2D(uTexture, gl_PointCoord).r;
    gl_FragColor = vec4(uColor, textureAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`
const vertexShader = /* glsl */`
uniform float uSize;
uniform vec2 uResolution;
uniform float uPixelRatio;
uniform float uProgress;
attribute float aSize;
attribute float aTimeMultiplier;

// Remap a value from one range to another
float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax)
{
    return clamp(destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin), destinationMin, destinationMax);
}

float ramp(float value, float power, float end){
  return end - pow(end - value, power);
}

void main()
{
    float progress = aTimeMultiplier * uProgress;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 position = projectionMatrix * viewPosition;
    vec2 resolution = uResolution * uPixelRatio;
    float size = ((uSize * aSize) * (resolution.y)) * (1. / -viewPosition.z);

    // Explosion
    float explosionProgress = remap(uProgress, 0., 0.15, 0., 1.);
    explosionProgress = ramp(explosionProgress, 3., 1.);
    position.xy *= explosionProgress;
    // Falling
    float fallingProgress = remap(uProgress, 0.1, 1.0, 0., 1.);
    fallingProgress = ramp(fallingProgress, 2., 1.);
    position.y -= fallingProgress * 0.5;
    // Scaling
    float scalingStarProgress = remap(uProgress, 0., 0.1, 0., 1.);
    float scalingEndProgress = remap(progress, 0.2, 1.0, 0., 1.);
    scalingStarProgress = ramp(scalingStarProgress, 2., 1.);
    scalingEndProgress = ramp(scalingEndProgress, 2., 1.);
    size *= scalingStarProgress - scalingEndProgress;
    // Twinkling
    float twinklingProgress = remap(progress, 0.2, 0.8, 0., 1.);
    twinklingProgress = ramp(twinklingProgress, 2., 1.);
    float twinklingSize = sin(progress  * 30.) * 0.5 + 0.5;
    twinklingSize = 1. - twinklingSize * twinklingProgress;
    size *= twinklingSize;
    // Setup
    gl_Position = position;
    gl_PointSize = size;

    if( gl_PointSize < 1.)
    {
      gl_Position = vec4(9999.);
    }
}
`

//? CLASS
let uSize: number;
let uResolution: Vector2;
let uPixelRatio: number;
let uTexture: Texture;
let uColor: Color;
let uProgress: number;

const handleResize = (_this: SparkleImpl) => {
  uResolution.set(window.innerWidth, window.innerHeight)
  _this.uniforms.uResolution.value = uResolution
}

export class SparkleImpl extends ShaderMaterial {
  constructor({size = 0.1, pixelRatio = 1, color = new Color('#00FF00'), texture, duration = 1}: SparkleProps) {  
    super({
      fragmentShader,
      vertexShader,
      uniforms: {
        uSize: new Uniform(size),
        uResolution: new Uniform(new Vector2(window.innerWidth, window.innerHeight)),
        uPixelRatio: new Uniform(pixelRatio),
        uTexture: new Uniform(texture),
        uColor: new Uniform(color),
        uProgress: new Uniform(0),
      },
      transparent: true,
      depthTest: true,
      blending: AdditiveBlending,
    })
    uSize = this.uniforms.uSize.value
    uResolution = this.uniforms.uResolution.value
    uPixelRatio = this.uniforms.uPixelRatio.value
    uTexture = this.uniforms.uTexture.value
    uColor = this.uniforms.uColor.value
    uProgress = this.uniforms.uProgress.value
    animate((progress) => {
      this.uniforms.uProgress.value = progress
    },  { duration: duration/1000, easing: 'linear' })
    window.addEventListener('resize', ()=>handleResize(this))
  }

  dispose(){
    // On unmount
    window.removeEventListener('resize', ()=>handleResize(this))
  }

  update() {
    // Updates here
    this.uniforms.uSize.value = uSize;
    this.uniforms.uResolution.value = uResolution;
    this.uniforms.uPixelRatio.value = uPixelRatio;
    this.uniforms.uTexture.value = uTexture;
    this.uniforms.uColor.value = uColor;
    this.uniforms.uProgress.value = uProgress;
  }
}

//? COMPONENT
export const Sparkle = forwardRef(function Sparkle
({size = 0.1, pixelRatio = 1, texture, color = new Color('#00FF00')}: SparkleProps, ref) {
    const shader = useMemo(() => new SparkleImpl({size, pixelRatio, texture, color}), [color, pixelRatio, size, texture])
    return <primitive ref={ref} object={shader} dispose={null} />
})