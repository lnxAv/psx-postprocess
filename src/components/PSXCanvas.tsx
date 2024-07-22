'use client'

import React, { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Rebeca } from "./Models/Rebeca-bones";
import { MathUtils, ShaderChunk} from "three";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { Dithering, DitheringPattern } from "./Shaders/PostProcessing/Dithering";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { CRTMonitor } from "./Shaders/PostProcessing/CRTMonitor";
import { DepthCueing } from "./Shaders/PostProcessing/DepthCueing";
import { BackgroundMovement, PSXBackground } from "./PSXBackground";
import { getRandomParticlesPositionSpherical, getRandomParticlesSizes, getRandomTimesMultipliers, PSXParticles, usePSXParticlesEmitter } from "./PSXParticles";
import { SparkleImpl } from "./Shaders/Sparkle";
import { Assets, AssetsLoader } from "./Utils/AssetsLoader";

type PSXCanvasProps = {
    resolution: [number, number],
    jitterStrength?: number
    dpr?: number
}

function PSXCanvas({resolution = [320, 240], jitterStrength = 0.8, dpr=0.25}: PSXCanvasProps) {
    const assets = useRef<Assets>(new Map([]))
    const emitter = usePSXParticlesEmitter()
    //~ MODIFY ENGINE VERTEX SHADER (by godot - Grau)
    useLayoutEffect(()=>{
        ShaderChunk.project_vertex = /* glsl */`
            vec4 mvPosition = vec4( transformed, 1.0 );
            // KEEP BATCHING (from three.js)
            #ifdef USE_BATCHING
                mvPosition = batchingMatrix * mvPosition;
            #endif
            // KEEP INSTANCING (from three.js)
            #ifdef USE_INSTANCING
                mvPosition = instanceMatrix * mvPosition;
            #endif
            mvPosition = modelViewMatrix * mvPosition;
            // snapping
            vec2 resolution = floor(vec2(${resolution[0]}, ${resolution[1]}) * (1. - ${jitterStrength}));
            vec4 pos = projectionMatrix * mvPosition;
            pos.xyz /= pos.w;
            pos.xy = floor(resolution * pos.xy) / resolution;
            pos.xyz *= pos.w;
            gl_Position = pos;
        `;
    }, [jitterStrength, resolution])

    const handleParticleClick = () => {
            emitter.addParticleGroup({
                id: 'demo',
                count: 100 ,
                duration: 2100,
                mat: new SparkleImpl({
                    size: 0.15,
                    pixelRatio: dpr,
                    duration: 2000,
                    texture: assets.current.get('starParticles')?.textures
                }),
                settings: {
                    depthWrite: false,
                    transparent: true,
                },
                attributes: {
                    position: getRandomParticlesPositionSpherical(100 , 0.5),
                    aSize:  getRandomParticlesSizes(100 ),
                    aTimeMultiplier: getRandomTimesMultipliers(100 ),
                }
            })
    }

    return(
    <Canvas onClick={handleParticleClick} className="w-auto max-h-screen overflow-hidden" dpr={dpr} gl={{antialias: false, depth: true}} style={{imageRendering: 'pixelated'}}>
        <AssetsLoader assetsLinks={{ starParticles: {texture: 'star.png', settings: {textureFlipY: false}}}} onLoad={(loadedAssets)=> { assets.current = loadedAssets }}/>
        <PSXBackground texturePath="n64_bg.jpg" movement={BackgroundMovement.CAMERA}/>
        <PSXParticles />
        <PerspectiveCamera makeDefault={true} position={[0, 0, 1]} far={20} near={0.1}/>
        <OrbitControls />
        <EffectComposer depthBuffer={true} resolutionScale={320/240}>
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            <Dithering pattern={DitheringPattern.BAYER_4} darkness={0.2} colorDepth={16} blendFunction={BlendFunction.SCREEN}/>
            <DepthCueing nearOffset={0.03} fogDensity={0.0} />
            <CRTMonitor vignetteOpacity={1.6} gammaCorrection={0.9} screenClampRange={1.2}/>
        </EffectComposer>
        <spotLight intensity={Math.PI * 1.5} position={[-1, -1, 1.5]} rotation={[1,-2,-1]} castShadow />
        <directionalLight intensity={0.2} position={[8, 20, 8]} castShadow />
        <Suspense fallback={null}>
            <mesh position={[0, -1.7,0]} rotation={[0,MathUtils.degToRad(10),0]}>
                <Rebeca />
            </mesh>
        </Suspense>
    </Canvas>
    )
}

export default PSXCanvas