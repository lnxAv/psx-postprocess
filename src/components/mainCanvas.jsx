'use client'

import React, { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Rebeca } from "./Rebeca-bones";
import { MathUtils, SRGBColorSpace } from "three";
import { useTexture } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'


function cover( texture, aspect ) {
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

function MainCanvas() {
    return(
    <Canvas className="w-screen min-h-screen" camera={{ position: [0.2, -0.2, 0.85], }}>
        <Background/>
      <EffectComposer>
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
        <spotLight intensity={Math.PI} position={[-1, -1, 1.5]} rotation={[1,-2,-1]} castShadow />
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