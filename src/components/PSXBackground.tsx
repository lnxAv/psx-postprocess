'use client'

import React, { useCallback, useEffect, useRef } from "react";
import {  useFrame, useThree } from "@react-three/fiber";
import { Camera, RepeatWrapping, SRGBColorSpace, Vector3} from "three";
import { useTexture } from "@react-three/drei";

export enum BackgroundMovement {
    NONE,
    MOUSE,
    CAMERA,
}

type PSXBackgroundProps = {
    texturePath: string,
    movement?: BackgroundMovement,
    fov?: [number, number],
}

export const PSXBackground = ({texturePath, movement = BackgroundMovement.NONE, fov = [180, 90]} : PSXBackgroundProps)=>{
    // based on https://godotshaders.com/shader/n64-style-skybox/
    const {scene} = useThree()
    const tempVec = useRef(new Vector3())
    const bgTexture = useTexture(texturePath)
    const mousePos = useRef([0,0])

    useFrame(({camera}, d)=>{
        const [x, y] = movementInfluence(camera)
        let bgX = -x * -(1 / Math.PI) 
        let bgY =  (y * 0.5) * -(1 / (Math.PI / 2 ) ) + 0.5
        // keep centered
        bgY *= bgTexture.repeat.y > 1.0 ? 0.0 : 1.0 - bgTexture.repeat.y;
        bgTexture.offset.x = bgX 
        bgTexture.needsUpdate = true
        if(!isNaN(bgY)){
            bgTexture.offset.y = bgY
            bgTexture.needsUpdate = true
        }
    })
    
    const updateBg = useCallback(() => {
        bgTexture.repeat.x =  (fov[0] * 1.0 / 360.0);
        bgTexture.repeat.y = (fov[1] * (1.0 / 180.0));
        bgTexture.needsUpdate = true
    }, [bgTexture, fov])

    const movementInfluence = (camera: Camera) =>{
        let x = 0
        let y = 0
        switch(movement){
            case BackgroundMovement.MOUSE:
                x = Math.atan( mousePos.current[0] )
                y = Math.asin( mousePos.current[1] )
                return [x,y]
            case BackgroundMovement.CAMERA:
                let {x: cameraX, y: cameraY} = camera.getWorldDirection(tempVec.current)
                x = cameraX
                y =  -cameraY
                return [x,y]
            default:
                return [x,y]
        }
    }

    useEffect(()=>{
        bgTexture.colorSpace = SRGBColorSpace
        bgTexture.wrapS = RepeatWrapping
        bgTexture.wrapT =  RepeatWrapping
        updateBg()
        scene.background = bgTexture
        scene.environment = bgTexture
    },[bgTexture, scene, updateBg])

    useEffect(()=> {
        if(movement === BackgroundMovement.MOUSE){
            addEventListener('mousemove', (e)=>{
                mousePos.current = [
                    ( e.clientX / window.innerWidth ) * 2 - 1,
                    ( e.clientY / window.innerHeight ) * 2 - 1
                ]
            })
        }
        else {
            removeEventListener('mousemove', ()=>{})
        }
        return ()=>{
            removeEventListener('mousemove', ()=>{})
        }
    },[movement])

    return null
}