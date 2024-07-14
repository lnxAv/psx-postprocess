import React, { forwardRef, useMemo } from 'react'
import { AdditiveBlending, Color, ShaderMaterial, Texture, Uniform, Vector2} from 'three'

type SparkleProps = {
    pixelRatio?: number,
    texture?: Texture,
    color?: Color,
    size?: number,
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
attribute float aSize;
void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    float size = uSize * aSize;
    uResolution * uPixelRatio;
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = size * (uResolution.y);
    gl_PointSize *= 1. / -viewPosition.z;
}
`

//? CLASS
let uSize: number;
let uResolution: Vector2;
let uPixelRatio: number;
let uTexture: Texture;
let uColor: Color;

const handleResize = (o: SparkleImpl) => {
  uResolution.set(window.innerWidth, window.innerHeight)
  o.uniforms.uResolution.value = uResolution
}

export class SparkleImpl extends ShaderMaterial {
  constructor({size = 0.1, pixelRatio = 1, color = new Color('#00FF00'), texture}: SparkleProps) {
    super({
      fragmentShader,
      vertexShader,
      uniforms: {
        uSize: new Uniform(size),
        uResolution: new Uniform(new Vector2(window.innerWidth, window.innerHeight)),
        uPixelRatio: new Uniform(pixelRatio),
        uTexture: new Uniform(texture),
        uColor: new Uniform(color),
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
  }
}

//? COMPONENT
export const Sparkle = forwardRef(function Sparkle
({size = 0.1, pixelRatio = 1, texture, color = new Color('#00FF00')}: SparkleProps, ref) {
    const shader = useMemo(() => new SparkleImpl({size, pixelRatio, texture, color}), [color, pixelRatio, size, texture])
    return <primitive ref={ref} object={shader} dispose={null} />
})