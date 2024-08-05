'use client'

import { CameraControls } from "@react-three/drei";
import React, { useEffect, useRef } from "react";
import { PerspectiveCamera } from "three";
import { distance } from "three/examples/jsm/nodes/Nodes.js";
import { degToRad } from "three/src/math/MathUtils.js";

function FirstLookControls() {
    const cameraControls = useRef<CameraControls | null>(null)
    useEffect(()=>{
        cameraControls.current?.setLookAt(0, 0, 0.01, 0,0,0)
        cameraControls.current?.rotate(degToRad(-86), 0)
    }, [])
    return(
        <CameraControls ref={cameraControls}
            minDistance={0} 
            maxDistance={-0.3}
            azimuthAngle={-0.3}
            polarAngle={-0.3}
            truckSpeed={10}
            
        />
    )
}

export default FirstLookControls