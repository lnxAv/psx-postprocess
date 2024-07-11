'use client'

import React, { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Rebeca } from "./Rebeca-bones";
import {  MathUtils, ShaderChunk} from "three";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { Dithering, DitheringPattern } from "./Effects/Dithering";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { CRTMonitor } from "./Effects/CRTMonitor";
import { DepthCueing } from "./Effects/DepthCueing";
import { BackgroundMovement, PSXBackground } from "./PSXBackground";

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
    }, [jitterStrength, resolution])

    return(
    <Canvas className="w-auto max-h-screen overflow-hidden" dpr={0.25} gl={{antialias: false, depth: true, logarithmicDepthBuffer: true}} style={{imageRendering: 'pixelated'}}>
        <PSXBackground texturePath="n64_bg.jpg" movement={BackgroundMovement.CAMERA}/>
        <PerspectiveCamera makeDefault={true} position={[0, 0, 1]} far={20} near={0.1}/>
        <OrbitControls />
        <EffectComposer depthBuffer={true} resolutionScale={320/240}>
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            <Dithering pattern={DitheringPattern.BAYER_4} darkness={0.2} colorDepth={16} blendFunction={BlendFunction.SCREEN}/>
            <DepthCueing nearOffset={0.04} fogDensity={0.1}/>
            <CRTMonitor vignetteOpacity={1.6} gammaCorrection={0.9} screenClampRange={1.2}/>
        </EffectComposer>
            <group>
                <spotLight intensity={Math.PI * 1.5} position={[-1, -1, 1.5]} rotation={[1,-2,-1]} castShadow />
                <directionalLight intensity={0.2} position={[8, 20, 8]} castShadow />
                <Suspense fallback={null}>
                    <mesh position={[0, -1.7,0]} rotation={[0,MathUtils.degToRad(10),0]}>
                        <Rebeca />
                    </mesh>
                </Suspense>
            </group>
    </Canvas>
    )
}

export default MainCanvas