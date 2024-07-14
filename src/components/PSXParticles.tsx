'use client'

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Blending, BufferAttribute, BufferGeometry, Float32BufferAttribute, NormalBlending, Points, PointsMaterial, ShaderMaterial, Spherical, Texture, TextureLoader, Vector3 } from "three";

// Particle Group
type ParticleSettings = {
    depthWrite?: boolean,
    blending?: Blending,
    transparent?: boolean,
}

type ParticleGroup = {
    id: string,
    count: number,
    material?: PointsMaterial | ShaderMaterial,
    settings?: ParticleSettings,
    attributes?: {
        [key: string]: BufferAttribute,
    }
}

// Particle Emitter
type PSXParticleEmitter = {
    addParticleGroup(particleGroup: ParticleGroup): void
}

/* Add the particles system to the scene */
export const PSXParticles = ()=>{
    const {scene} = useThree()
    const particlesGroups = useRef<Map<string, Points>>(new Map([]))
    const defaultMaterial = new PointsMaterial({size: 0.1, color: 0x00ff00})
    
    const addParticleGroup = (group: ParticleGroup) => {
        const geometry = new BufferGeometry()
        for( const attributeName in group.attributes){
            geometry.setAttribute(attributeName, group.attributes[attributeName])
        }
        if(!group.material){
            group.material = defaultMaterial
        }
        group.material.blending = group.settings?.blending ?? NormalBlending
        group.material.depthWrite = group.settings?.depthWrite ?? true
        group.material.transparent = group.settings?.transparent ?? false
        const newParticlesGroup = new Points(geometry, group.material)
        scene.add(newParticlesGroup)
        particlesGroups.current.set(group.id, newParticlesGroup)
    }

    const disposeParticlesGroup = (id: string, onDispose?: () => void) => {
        const groupToDispose = particlesGroups.current.get(id)
        if(groupToDispose){
            scene.remove(groupToDispose)
            groupToDispose.geometry.dispose()
            particlesGroups.current.delete(id)
            onDispose?.()
        }
    }
    // Handlers
    const handleAddParticlesGroup = (e: Event) => {
        const event = e as CustomEvent<ParticleGroup>
        if (event.detail) {
            addParticleGroup(event.detail)
        }
    }
    const handleDisposeParticleGroups = (e: Event) => {
        const event = e as CustomEvent<string>
        if (event.detail) {
            disposeParticlesGroup(event.detail)
        }
    }
    
    useEffect(()=> {
        document.addEventListener('addParticleGroups', handleAddParticlesGroup)
        document.addEventListener('disposeParticleGroups', handleDisposeParticleGroups)
        return ()=>{
            document.removeEventListener('addParticleGroups', handleAddParticlesGroup)
        }
    },[])

    return null
}

/* Create a particle emitter
* @returns An object with functions,
    - addParticle(name: string, position: Float32Array): void - Add a particle to the scene
*/
export const usePSXParticlesEmitter = () => {
    const emitter = {
        addParticleGroup: (group: ParticleGroup) => {
        const event = new CustomEvent<ParticleGroup>('addParticleGroups', {detail: {...group}})
        document.dispatchEvent(event)
    }
    } as PSXParticleEmitter
    return emitter
}


/* UTILS */
export function getRandomParticlesPosition(count: number) {
    const positions = new Float32Array(count * 3)
    for(let i = 0; i < count; i++)
    {
        positions.set([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], i * 3)
    }
    return new Float32BufferAttribute(positions, 3)
}

export function getRandomParticlesPositionSpherical(count: number, radius: number , radiusRange: number = 0.5) {
    const positions = new Float32Array(count * 3)
    const vec3 = new Vector3()
    for(let i = 0; i < count; i++)
    {
        const spherical = new Spherical(
            radius * (radiusRange + Math.random() * (1 - radiusRange)), // radius
            Math.random() * Math.PI, // phi
            Math.random() * Math.PI * 2, // theta
        )
        vec3.setFromSpherical(spherical)
        positions.set([vec3.x, vec3.y, vec3.z], i * 3)
    }
    return new Float32BufferAttribute(positions, 3)
}

export function getRandomParticlesSizes(count: number) {
    const sizes = new Float32Array(count)
    for(let i = 0; i < count; i++)
    {
        sizes.set([Math.random()], i)
    }
    return new Float32BufferAttribute(sizes, 1)
}