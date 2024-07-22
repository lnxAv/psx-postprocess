'use client'

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Blending, BufferAttribute, BufferGeometry, Float32BufferAttribute, NormalBlending, Points, PointsMaterial, ShaderMaterial, Spherical, Texture, TextureLoader, Vector3 } from "three";

// Particle Group
type MaterialSingle = PointsMaterial | ShaderMaterial 

type ParticleSettings = {
    depthWrite?: boolean,
    blending?: Blending,
    transparent?: boolean,
}

type ParticleGroup = {
    id: string,
    count: number,
    duration?: number,
    onDispose?: () => void,
    mat?: MaterialSingle,
    settings?: ParticleSettings,
    attributes?: {
        [key: string]: BufferAttribute,
    }
}

type PartricleGroupMap = Map<string, {group: ParticleGroup, points: Points, timeout?: NodeJS.Timeout}>

type ParticleDispose = {
    id: string,
    onDispose?: () => void,
}

// Particle Emitter
interface PSXParticleEmitter {
    addParticleGroup(particleGroup: ParticleGroup): void
    disposeParticleGroup(disposer: ParticleDispose): void
}

/* Add the particles system to the scene */
export const PSXParticles = ()=>{
    const {scene} = useThree()
    const defaultMaterial = new PointsMaterial({size: 0.1, color: 0x00ff00})
    const particlesMap = useRef<PartricleGroupMap>(new Map([]))

    const setMaterial = (mat: MaterialSingle, settings?: ParticleSettings) => {
        if(mat.isMaterial){
            mat.blending = settings?.blending ?? NormalBlending
            mat.depthWrite = settings?.depthWrite ?? true
            mat.transparent = settings?.transparent ?? false
        }
        return mat
    }
    const setDuration = (group: ParticleGroup) => {
        const particlesMapLookup = particlesMap.current.get(group.id)
        if(particlesMapLookup?.group.duration){
            clearTimeout(particlesMapLookup.timeout)
            particlesMapLookup.timeout = setTimeout(() => {
                disposeParticlesGroup({
                    id: group.id,
                    onDispose: group.onDispose,
                })
            }, group.duration)
        }
    }

    /* Add a particle group to the scene
    * -If the particle group is already in the map, dispose it
    * -Set all the geometry attributes
    * -If has no material, use default
    * -Create the particle
    */
    const addParticleGroup = (group: ParticleGroup) => {
        const geometry = new BufferGeometry()
        let material: MaterialSingle
        const particlesMapLookup = particlesMap.current.get(group.id)
        if(particlesMapLookup){
            disposeParticlesGroup({
                id: particlesMapLookup.group.id,
                onDispose: particlesMapLookup.group.onDispose,
            })
        }
        for( const attributeName in group.attributes){
            geometry.setAttribute(attributeName, group.attributes[attributeName])
        }
        if(!group.mat){
            group.mat = defaultMaterial
        }
        material = setMaterial(group.mat, group.settings)
        const newParticlesGroup = new Points(geometry, material)
        scene.add(newParticlesGroup)
        particlesMap.current.set(group.id, {group, points: newParticlesGroup})
        setDuration(group)
    }

    /* Dispose a particle group
    * -Remove the particle group from the scene
    * -Dispose the geometry
    * -Dispose the material
    * -Clear the timeout
    * -Delete the particle group from the map
    */
    const disposeParticlesGroup = (disposer: ParticleDispose) => {
        const groupToDispose = particlesMap.current.get(disposer.id)
        if(groupToDispose){
            scene.remove(groupToDispose.points)
            groupToDispose.points.geometry.dispose()
            if (Array.isArray(groupToDispose.points.material)) {
                groupToDispose.points.material.forEach((material) => material.dispose());
            } else {
                groupToDispose.points.material.dispose();
            }
            clearTimeout(groupToDispose.timeout)
            particlesMap.current.delete(groupToDispose.group.id)
            disposer.onDispose?.()
        }
    }

    /*=== HANDLE ADD EVENTS ===*/
    const handleAddParticlesGroup = (e: Event) => {
        const event = e as CustomEvent<ParticleGroup>
        if (event.detail) {
            addParticleGroup(event.detail)
        }
    }
    /*=== HANDLE DISPOSE EVENTS ===*/
    const handleDisposeParticleGroups = (e: Event) => {
        const event = e as CustomEvent<ParticleDispose>
        if (event.detail) {
            disposeParticlesGroup(event.detail)
        }
    }
    
    useEffect(()=> {
        document.addEventListener('addParticleGroups', handleAddParticlesGroup)
        document.addEventListener('disposeParticleGroups', handleDisposeParticleGroups)
        return ()=>{
            document.removeEventListener('addParticleGroups', handleAddParticlesGroup)
            document.removeEventListener('disposeParticleGroups', handleDisposeParticleGroups)
        }
    },[])

    return null
}

/* Hook to create a particle emitter
* @description Access an emitter that uses the event system to add and dispose particles
* @returns An object with functions,
    - addParticle(name: string, position: Float32Array): void - Add a particle to the scene
    - disposeParticle(name: string, onDispose?: () => void): void - Dispose a particle from the scene
*/
export const usePSXParticlesEmitter = () => {
    const emitter = {
        addParticleGroup: (group: ParticleGroup) => {
        const event = new CustomEvent<ParticleGroup>('addParticleGroups', {detail: {...group}})
        document.dispatchEvent(event)
        },
        disposeParticleGroup: (disposer: ParticleDispose) => {
            const event = new CustomEvent<ParticleDispose>('disposeParticleGroups', {detail: {...disposer}})
            document.dispatchEvent(event)
        }
    } as PSXParticleEmitter
    return emitter
}


/*=== UTILS ===*/
/* get random positions in a cube */
export function getRandomParticlesPosition(count: number) {
    const positions = new Float32Array(count * 3)
    for(let i = 0; i < count; i++)
    {
        positions.set([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], i * 3)
    }
    return new Float32BufferAttribute(positions, 3)
}

/* get random positions in a sphere */
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

/* get random sizes */
export function getRandomParticlesSizes(count: number) {
    const sizes = new Float32Array(count)
    for(let i = 0; i < count; i++)
    {
        sizes.set([Math.random()], i)
    }
    return new Float32BufferAttribute(sizes, 1)
}

/* get random times multipliers */
export function getRandomTimesMultipliers(count: number) {
    const sizes = new Float32Array(count)
    for(let i = 0; i < count; i++)
    {
        sizes.set([ 1+Math.random()], i)
    }
    return new Float32BufferAttribute(sizes, 1)
}