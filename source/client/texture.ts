import { BaseTexture, Texture, Rectangle, WRAP_MODES } from "pixi.js"
import { AnimationName, GData, MapName, MonsterName, ProjectileName } from "alclient"
import { GeoMaps } from "../definitions/client"
import G from "./G.json"

const baseTexturesCache = new Map<string, BaseTexture>()
const animationTexturesCache = new Map<string, Texture[]>()
const cosmeticFaceTexturesCache = new Map<string, Texture[][]>()
const cosmeticHairTexturesCache = new Map<string, Texture[][]>()
const cosmeticHatTexturesCache = new Map<string, Texture[][]>()
const cosmeticHeadTexturesCache = new Map<string, Texture[][]>()
const cosmeticMakeupTexturesCache = new Map<string, Texture[][]>()
const mapTexturesCache = new Map<MapName, Map<number, Texture[]>>()
const skinColorTexturesCache = new Map<string, Texture[][]>()
const skinTexturesCache = new Map<string, Texture[][]>()
const directions = [0, 2, 3, 4]

const getBaseTexture = (id: string, file: string): BaseTexture => {
    let baseTexture = baseTexturesCache.get(id)
    if (baseTexture) return baseTexture

    baseTexture = BaseTexture.from(file)
    baseTexturesCache.set(id, baseTexture)
    return baseTexture
}

const getStaticTextures = (skin: string): Texture[][] => {
    const textures: Texture[][] = [[], [], [], []]
    const gSprites = (G as unknown as GData).sprites
    let found = false
    for (const spriteName in gSprites) {
        if (found) break
        const sprites = gSprites[spriteName]
        for (let row = 0; row < sprites.rows; row++) {
            if (found) break
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    // We found it!
                    const file = sprites.file.split(/[?#]/)[0]
                    const baseTexture = getBaseTexture(spriteName, `.${file}`)
                    try {
                        const width = (G as unknown as GData).images[file].width / sprites.columns
                        const height = (G as unknown as GData).images[file].height / sprites.rows / 4

                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i]
                            const x = (col * width)
                            const y = (row * 4 * height) + (direction * height)
                            const frame = new Rectangle(x, y, width, height)
                            const texture = new Texture(baseTexture, frame)
                            textures[i].push(texture)
                        }
                        found = true
                    } catch (e) {
                        console.error(e)
                    }
                    break
                }
            }
        }
    }
    return textures
}

export const getAnimationTextures = (animation: AnimationName): Texture[] => {
    let textures = animationTexturesCache.get(animation)
    if (textures) return textures

    const gAnimation = (G as unknown as GData).animations[animation]
    const file = gAnimation.file.split(/[?#]/)[0]
    const baseTexture = getBaseTexture(animation, `.${file}`)

    textures = []
    baseTexture.addListener("loaded", () => {
        const frame_width = baseTexture.width / gAnimation.frames
        const frame_height = baseTexture.height
        for (let i = 0; i < gAnimation.frames; i++) {
            const x = i * frame_width
            const frame = new Rectangle(x, 0, frame_width, frame_height)
            textures.push(new Texture(baseTexture, frame))
        }
    })
    animationTexturesCache.set(animation, textures)

    return textures
}

export const getCosmeticFaceTextures = (skin: string): Texture[][] => {
    let textures = cosmeticFaceTexturesCache.get(skin)
    if (textures) return textures

    textures = getStaticTextures(skin)
    cosmeticFaceTexturesCache.set(skin, textures)
    return textures
}

export const getCosmeticHairTextures = (skin: string): Texture[][] => {
    let textures = cosmeticHairTexturesCache.get(skin)
    if (textures) return textures

    textures = getStaticTextures(skin)
    cosmeticHairTexturesCache.set(skin, textures)
    return textures
}

export const getCosmeticHatTextures = (skin: string): Texture[][] => {
    let textures = cosmeticHatTexturesCache.get(skin)
    if (textures) return textures

    textures = getStaticTextures(skin)
    cosmeticHatTexturesCache.set(skin, textures)
    return textures
}

export const getCosmeticHeadTextures = (skin: string): Texture[][] => {
    let textures = cosmeticHeadTexturesCache.get(skin)
    if (textures) return textures

    textures = getStaticTextures(skin)
    cosmeticHeadTexturesCache.set(skin, textures)
    return textures
}

export const getCosmeticMakeupTextures = (skin: string): Texture[][] => {
    let textures = cosmeticMakeupTexturesCache.get(skin)
    if (textures) return textures

    textures = getStaticTextures(skin)
    cosmeticMakeupTexturesCache.set(skin, textures)
    return textures
}

export const getMapTextures = (map: MapName, index: number): Texture[] => {
    let mapTextures = mapTexturesCache.get(map)
    if (!mapTextures) {
        mapTextures = new Map<number, Texture[]>()
        mapTexturesCache.set(map, mapTextures)
    }
    let textures = mapTextures.get(index)
    if (textures) return textures

    // Make the texture
    const [tilesetName, x3, y3, width, height] = (G as unknown as GData).geometry[map as GeoMaps].tiles[index]
    const gTileset = (G as unknown as GData).tilesets[tilesetName]
    const baseTexture = getBaseTexture(tilesetName, `${gTileset.file}`)
    if (gTileset.frames) {
        textures = []
        for (let i = 0; i < gTileset.frames; i++) {
            const frame = new Rectangle(x3 + (i * gTileset.frame_width), y3, width, height ?? width)
            textures.push(new Texture(baseTexture, frame))
        }
        for (let i = gTileset.frames - 2; i > 0; i--) {
            textures.push(textures[i])
        }
        mapTextures.set(index, textures)
        return textures
    } else {
        const frame = new Rectangle(x3, y3, width, height ?? width)
        const texture = new Texture(baseTexture, frame)
        mapTextures.set(index, [texture])
        return [texture]
    }
}

export const getProjectileTextures = (projectile: ProjectileName): Texture[] => {
    const gProjectile = (G as unknown as GData).projectiles[projectile]
    return getAnimationTextures(gProjectile.animation)
}

export const getRayTexture = (projectile: ProjectileName): Texture => {
    const gProjectile = (G as unknown as GData).projectiles[projectile]
    const texture = getAnimationTextures(gProjectile.animation)[0]
    texture.baseTexture.wrapMode = WRAP_MODES.REPEAT
    return texture
}

export const getSkinColorTextures = (headSkin: string): Texture[][] => {
    let textures = skinColorTexturesCache.get(headSkin)
    if (textures) return textures

    const gSprites = (G as unknown as GData).sprites
    let found = false
    for (const spriteName in gSprites) {
        if (found) break
        const sprites = gSprites[spriteName]
        for (let row = 0; row < sprites.rows; row++) {
            if (found) break
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == headSkin) {
                    // We found it!
                    const size = sprites.size ?? "normal"
                    const options = (G as unknown as GData).cosmetics.head[headSkin] ?? ["sskin1a", "mskin1a", "lskin1a"]
                    if (size == "small") textures = getSkinTextures(options[0])
                    else if (size == "normal") textures = getSkinTextures(options[1])
                    else if (size == "large") textures = getSkinTextures(options[2])
                    found = true
                    break
                }
            }
        }
    }
    skinColorTexturesCache.set(headSkin, textures)
    return textures
}

export const getSkinTextures = (skin: string): Texture[][] => {
    let textures = skinTexturesCache.get(skin)
    if (textures) return textures

    // Make the textures
    const gSprites = (G as unknown as GData).sprites
    let found = false
    for (const spriteName in gSprites) {
        if (found) break
        const sprites = gSprites[spriteName]
        for (let row = 0; row < sprites.rows; row++) {
            if (found) break
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    // We found it!
                    const file = sprites.file.split(/[?#]/)[0]
                    const baseTexture = getBaseTexture(spriteName, `.${file}`)
                    const dimensions = (G as unknown as GData).dimensions[skin as MonsterName] ?? []
                    try {
                        const width = (G as unknown as GData).images[file].width / sprites.columns / 3
                        const height = (G as unknown as GData).images[file].height / sprites.rows / 4

                        textures = [[], [], [], []]
                        for (let i = 0; i < 4; i++) {
                            const direction = directions[i]
                            for (let animationFrame = 0; animationFrame < 3; animationFrame++) {
                                const x = (col * 3 * width) + (animationFrame * width)
                                let dx = 0
                                let dw = 0
                                if (dimensions[2]) {
                                    dx += dimensions[2]
                                }
                                if (dimensions[0]) {
                                    const difference = (width - dimensions[0])
                                    dx += difference / 2
                                    dw -= difference
                                }
                                const y = (row * 4 * height) + (direction * height)
                                let dy = 0
                                let dh = 0
                                if (dimensions[1]) {
                                    const difference = (height - dimensions[1])
                                    dy += difference
                                    dh -= difference
                                }
                                const frame = new Rectangle(x + dx, y + dy, width + dw, height + dh)
                                const texture = new Texture(baseTexture, frame)
                                textures[i].push(texture)
                            }
                            textures[i].push(textures[i][1])
                        }
                        found = true
                    } catch (e) {
                        console.error(e)
                    }
                    break
                }
            }
        }
    }
    skinTexturesCache.set(skin, textures)
    return textures
}

export const getSkinType = (skin: string): string =>{
    // Make the textures
    const gSprites = (G as unknown as GData).sprites
    for (const spriteName in gSprites) {
        const sprites = gSprites[spriteName]
        for (let row = 0; row < sprites.rows; row++) {
            for (let col = 0; col < sprites.columns; col++) {
                if (sprites.matrix[row][col] == skin) {
                    // We found it!
                    return sprites.type ?? "full"
                }
            }
        }
    }
}