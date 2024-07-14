import React, { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, BufferGeometryLoader, Texture, TextureLoader } from "three";

type Asset = {
    textures?: Texture,
    geometries?: BufferGeometry,
}

export type Assets = Map<string, Asset>

type AssetsLinks = {
    [key: string]: {
        texture?: string,
        geometry?: string,
        settings?: {
            textureFlipY?: boolean,
        }
    }
}

type AssetsLoaderProps = {
    assetsLinks: AssetsLinks,
    onLoad: (assets: Assets) => void,
}
/* Add the particles system to the scene */
export const AssetsLoader = ({assetsLinks, onLoad}: AssetsLoaderProps) => {
    const assets = useMemo(() => new Map<string, Asset>([]), [])

    useEffect(() => {
        const textureLoader = new TextureLoader()
        const geometryLoader = new BufferGeometryLoader()
        for (const [key, value] of Object.entries(assetsLinks)) {
            let texture: Texture | undefined = undefined
            let geometry: BufferGeometry | undefined = undefined
            if (value.texture) {
                texture = textureLoader.load(value.texture)
                texture.flipY = value.settings?.textureFlipY ?? true
            }
            if (value.geometry) {
                geometryLoader.load(value.geometry, (data) => {
                    geometry = data
                })
            }
            assets.set(key, {
                textures: texture,
                geometries: geometry,
            })
        }
        onLoad(assets)
    }, [assets, assetsLinks, onLoad])

    return null
}