import { AbstractRenderer, AnimatedSprite, Container, Renderer, RenderTexture, Sprite, Texture } from "pixi.js"
import { GData, MapName } from "alclient"
import { TextureManager } from "./texture"
import { GeoMaps, Layers } from "../definitions/client"

export class MapManager {
    private static instance: boolean
    private static textureManager: TextureManager
    private geos: GData["geometry"]

    public constructor(tm: TextureManager, geometries: GData["geometry"]) {
        if (MapManager.instance) {
            throw new Error("An instance of MapManager already exists!")
        }
        MapManager.instance = true
        MapManager.textureManager = tm
        this.geos = geometries
        return this
    }

    private createTile = (texture: Texture, x: number, y: number) => {
        const tile = new Sprite(texture)
        tile.x = x
        tile.y = y
        tile.width = texture.width
        tile.height = texture.height
        tile.interactive = false
        tile.interactiveChildren = false
        return tile
    }

    private createAnimatedTile = (textures: Texture[], x: number, y: number) => {
        const tile = new AnimatedSprite(textures)
        tile.x = x
        tile.y = y
        tile.width = textures[0].width
        tile.height = textures[0].height
        tile.animationSpeed = 1 / 30
        tile.interactive = false
        tile.interactiveChildren = false
        tile.play()
        return tile
    }

    public renderMap(renderer: Renderer | AbstractRenderer, layers: Layers, map: MapName): void {
        const geo = this.geos[map as GeoMaps]

        const defaultTextures = MapManager.textureManager.getMapTextures(map, geo.default)
        const backgroundTextures: RenderTexture[] = []
        const width = geo.max_x - geo.min_x
        const height = geo.max_y - geo.min_y
        backgroundTextures.push(RenderTexture.create({ height: height, width: width }))
        backgroundTextures.push(RenderTexture.create({ height: height, width: width }))
        backgroundTextures.push(RenderTexture.create({ height: height, width: width }))

        const fixX = -geo.min_x
        const fixY = -geo.min_y

        // Draw default layer
        if (geo.default) {
            if (defaultTextures.length == 1) {
                const texture = defaultTextures[0]
                const tile = this.createTile(texture, 0, 0)
                for (let i = 0; i < backgroundTextures.length; i++) {
                    for (let x = 0; x <= width; x += texture.width) {
                        for (let y = 0; y <= height; y += texture.height) {
                            tile.x = x
                            tile.y = y
                            renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        }
                    }
                }
            } else {
                for (let i = 0; i < backgroundTextures.length; i++) {
                    const texture = defaultTextures[i]
                    const tile = this.createTile(texture, 0, 0)
                    for (let x = 0; x <= width; x += texture.width) {
                        for (let y = 0; y <= height; y += texture.height) {
                            tile.x = x
                            tile.y = y
                            renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        }
                    }
                }
            }
        }

        // Draw placements
        if (geo.placements) {
            for (const [index, x1, y1, x2, y2] of geo.placements) {
                const textures = MapManager.textureManager.getMapTextures(map, index)
                if (textures.length == 1) {
                    const texture = textures[0]
                    if (x2 != undefined) {
                        const tile = this.createTile(texture, 0, 0)
                        for (let i = 0; i < backgroundTextures.length; i++) {
                            for (let x = x1 + fixX; x <= x2 + fixX; x += texture.width) {
                                for (let y = y1 + fixY; y <= y2 + fixY; y += texture.height) {
                                    tile.x = x
                                    tile.y = y
                                    renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                                }
                            }
                        }
                    } else {
                        const tile = this.createTile(texture, x1 + fixX, y1 + fixY)
                        for (let i = 0; i < backgroundTextures.length; i++) {
                            renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        }
                    }
                } else {
                    if (x2 != undefined) {
                        for (let i = 0; i < backgroundTextures.length; i++) {
                            const tile = this.createTile(textures[i], 0, 0)
                            for (let x = x1 + fixX; x <= x2 + fixX; x += textures[i].width) {
                                for (let y = y1 + fixY; y <= y2 + fixY; y += textures[i].height) {
                                    tile.x = x
                                    tile.y = y
                                    renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < backgroundTextures.length; i++) {
                            const tile = this.createTile(textures[i], x1 + fixX, y1 + fixY)
                            renderer.render(tile, { clear: false, renderTexture: backgroundTextures[i] })
                        }
                    }
                }
            }
        }
        layers.background.addChild(this.createAnimatedTile(backgroundTextures, geo.min_x, geo.min_y))

        // Draw groups
        if (geo.groups) {
            for (const group of geo.groups) {
                const groupTile = new Container()
                groupTile.interactive = false
                groupTile.interactiveChildren = false
                let minX = Number.MAX_SAFE_INTEGER
                let minY = Number.MAX_SAFE_INTEGER
                let maxY = Number.MIN_SAFE_INTEGER
                let isGroupAnimated = false
                for (const [index, x1, y1, x2, y2] of group) {
                    if (x1 < minX) minX = x1
                    if (y1 < minY) minY = y1
                    if (y2 > maxY) maxY = y2
                    const textures = MapManager.textureManager.getMapTextures(map, index)
                    if (textures.length == 1) {
                        const texture = textures[0]
                        if (x2 != undefined) {
                            for (let x = x1; x <= x2; x += texture.width) {
                                for (let y = y1; y <= y2; y += texture.height) {
                                    groupTile.addChild(this.createTile(texture, x, y))
                                }
                            }
                        } else {
                            groupTile.addChild(this.createTile(texture, x1, x2))
                        }
                    } else {
                        isGroupAnimated = true
                        if (x2 != undefined) {
                            for (let x = x1; x <= x2; x += textures[0].width) {
                                for (let y = y1; y <= y2; y += textures[0].height) {
                                    groupTile.addChild(this.createAnimatedTile(textures, x, y))
                                }
                            }
                        } else {
                            groupTile.addChild(this.createAnimatedTile(textures, x1, y1))
                        }
                    }
                }
                groupTile.cacheAsBitmap = !isGroupAnimated
                groupTile.x = minX
                groupTile.y = minY
                groupTile.zIndex = groupTile.y - (maxY - minY)
                for (const child of groupTile.children) {
                    child.x -= minX
                    child.y -= minY
                }
                layers.foreground.addChild(groupTile)
            }
        }
    }
}