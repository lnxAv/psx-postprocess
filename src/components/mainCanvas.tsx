'use client'

import React, { Suspense, useEffect, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Rebeca } from "./Rebeca-bones";
import { MathUtils, SRGBColorSpace, Vector2, ShaderChunk, Texture } from "three";
import { CameraShake, PerspectiveCamera, useTexture } from "@react-three/drei";
import {  EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { Dithering, DitheringPattern } from "./Effects/Dithering";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { CRTMonitor } from "./Effects/CRTMonitor";

function cover( texture: Texture, aspect: number ) {
    let imageAspect = texture.image.width / texture.image.height;
    texture.matrixAutoUpdate = false;
    if ( aspect < imageAspect ) {
        texture.matrix.setUvTransform( 0, 0, aspect / imageAspect, 1, 0, 0.5, 0.5 );
    } else {
        texture.matrix.setUvTransform( 0, 0, 1, imageAspect / aspect, 0, 0.5, 0.5 );
    }
}

const Background = ()=>{
    const {scene} = useThree()
    const bgTexture = useTexture('clouds-lim.png')
    useEffect(()=>{
        bgTexture.colorSpace = SRGBColorSpace
        cover( bgTexture, window.innerWidth / window.innerHeight );
        bgTexture.needsUpdate = true
        scene.background = bgTexture
        scene.environment = bgTexture
    },[])
    return null
}

type PSXCanvasProps = {
    resolution: [number, number]
}

function MainCanvas({resolution = [320, 240]}: PSXCanvasProps) {
    //~ MODIFY ENGINE VERTEX SHADER + TEXTURE MAPPING (by romanliutikov)
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

            vec2 resolution = vec2(${resolution[0]}, ${resolution[1]});
            vec4 pos = projectionMatrix * mvPosition;
            float i = (1.0 - 0.5) * min(pos.x, pos.y);
            pos.xyz /= pos.w;
            pos.xy = (floor(resolution * pos.xy) ) / resolution ;
            pos.xyz *= pos.w;

            gl_Position = pos;
        `;
    }, [])


    return(
    <Canvas className="w-screen min-h-screen" dpr={0.25} gl={{antialias: false}} style={{imageRendering: 'pixelated'}}>
        <Background/>
        <PerspectiveCamera makeDefault={true} position={[-0.05, 0, 1]} />
        <CameraShake intensity={1} maxPitch={0.1} maxYaw={0.1} maxRoll={0.1} />
        <EffectComposer>
            <ToneMapping mode={ToneMappingMode.NEUTRAL} />
            <Dithering pattern={DitheringPattern.BAYER_4} darkness={0.5} colorDepth={16} blendFunction={BlendFunction.SCREEN}/>
            <CRTMonitor vignetteOpacity={1.5}/>
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