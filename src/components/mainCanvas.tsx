'use client'

import React, { Suspense, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Rebeca } from "./Rebeca-bones";
import { MathUtils, RepeatWrapping, SRGBColorSpace, ShaderChunk, Texture } from "three";
import { CameraShake, PerspectiveCamera, useTexture } from "@react-three/drei";
import { EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { Dithering, DitheringPattern } from "./Effects/Dithering";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { CRTMonitor } from "./Effects/CRTMonitor";
import { DepthCueing } from "./Effects/DepthCueing";

const Background = ({texturePath, fov = [180, 90]} : {texturePath: string, fov?: [number, number]})=>{
    const {scene} = useThree()
    const bgTexture = useTexture(texturePath)

    useFrame((r)=>{
        const x = Math.atan(r.camera.position.z / r.camera.position.x)
        const y = Math.asin(r.camera.position.y / r.camera.position.z)
        let bgX = -x * (-1 * Math.PI ) % ( bgTexture.repeat.x ^ 2)
        let bgY =  Math.min(1-bgTexture.repeat.y, Math.max(0, (1/ 2* (y * (-1 * Math.PI ))) + bgTexture.repeat.y /2 ))
        if(!isNaN(bgX)){
            bgTexture.offset.x = bgX
            bgTexture.needsUpdate = true
        }
        if(!isNaN(bgY)){
            bgTexture.offset.y = bgY
            bgTexture.needsUpdate = true
        }
    })

    useEffect(()=>{
        bgTexture.colorSpace = SRGBColorSpace
        bgTexture.wrapS = RepeatWrapping
        bgTexture.wrapT =  RepeatWrapping
        bgTexture.repeat.x = ((window.innerWidth / window.innerHeight) ) * (fov[0] * 1.0 / 360.0);
        bgTexture.repeat.y = ((window.innerWidth / window.innerHeight) ) * (fov[1] * (1.0 / 180.0));
        bgTexture.needsUpdate = true
        scene.background = bgTexture
        scene.environment = bgTexture
    },[])
    return null
}

type PSXCanvasProps = {
    resolution: [number, number],
    jitterStrength?: number
}

function MainCanvas({resolution = [320, 240], jitterStrength = 0.75}: PSXCanvasProps) {
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
    }, [])


    return(
    <Canvas className="w-auto max-h-screen overflow-hidden" dpr={0.25} gl={{antialias: false, depth: true, logarithmicDepthBuffer: true}} style={{imageRendering: 'pixelated'}}>
        <Background texturePath="n64_bg.jpg"/>
        <PerspectiveCamera makeDefault={true} position={[0, 0, 1]} far={20} near={0.1}/>
        <CameraShake intensity={1} maxPitch={0.1} maxYaw={0.1} maxRoll={0.1}/>
        <EffectComposer depthBuffer={true} resolutionScale={320/240}>
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            <Dithering pattern={DitheringPattern.BAYER_4} darkness={0.2} colorDepth={16} blendFunction={BlendFunction.SCREEN}/>
            <DepthCueing nearOffset={0.04} fogDensity={0.1}/>
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

export default MainCanvas