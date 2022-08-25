import { BaseTexture, Texture, Rectangle, WRAP_MODES } from "pixi.js"
import { AnimationName, GData, MapName, MonsterName, ProjectileName } from "alclient"
import { GeoMaps } from "../definitions/client"

export class TextureManager {
    private readonly baseTexturesCache = new Map<string, BaseTexture>()
    private readonly animationTexturesCache = new Map<string, Texture[]>()
    private readonly cosmeticFaceTexturesCache = new Map<string, Texture[][]>()
    private readonly cosmeticHairTexturesCache = new Map<string, Texture[][]>()
    private readonly cosmeticHatTexturesCache = new Map<string, Texture[][]>()
    private readonly cosmeticHeadTexturesCache = new Map<string, Texture[][]>()
    private readonly cosmeticMakeupTexturesCache = new Map<string, Texture[][]>()
    private readonly mapTexturesCache = new Map<MapName, Map<number, Texture[]>>()
    private readonly skinColorTexturesCache = new Map<string, Texture[][]>()
    private readonly skinTexturesCache = new Map<string, Texture[][]>()
    private G: GData
    private static instance: boolean
    private readonly directions = [0, 2, 3, 4]

    public constructor(g: GData) {
        if (TextureManager.instance) {
            throw new Error("An instance of TextureManager already exists!")
        }
        TextureManager.instance = true
        this.G = g
        return this
    }

    private readonly getBaseTexture = (id: string, file: string): BaseTexture => {
        let baseTexture = this.baseTexturesCache.get(id)
        if (baseTexture) return baseTexture

        baseTexture = BaseTexture.from(file)
        this.baseTexturesCache.set(id, baseTexture)
        return baseTexture
    }

    private readonly getStaticTextures = (skin: string): Texture[][] => {
        const textures: Texture[][] = [[], [], [], []]
        const gSprites = this.G.sprites
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
                        const baseTexture = this.getBaseTexture(spriteName, `.${file}`)
                        try {
                            const width = this.G.images[file].width / sprites.columns
                            const height = this.G.images[file].height / sprites.rows / 4

                            for (let i = 0; i < 4; i++) {
                                const direction = this.directions[i]
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

    public readonly getAnimationTextures = (animation: AnimationName): Texture[] => {
        let textures = this.animationTexturesCache.get(animation)
        if (textures) return textures

        const gAnimation = this.G.animations[animation]
        const file = gAnimation.file.split(/[?#]/)[0]
        const baseTexture = this.getBaseTexture(animation, `.${file}`)

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
        this.animationTexturesCache.set(animation, textures)

        return textures
    }

    public readonly getCosmeticFaceTextures = (skin: string): Texture[][] => {
        let textures = this.cosmeticFaceTexturesCache.get(skin)
        if (textures) return textures

        textures = this.getStaticTextures(skin)
        this.cosmeticFaceTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getCosmeticHairTextures = (skin: string): Texture[][] => {
        let textures = this.cosmeticHairTexturesCache.get(skin)
        if (textures) return textures

        textures = this.getStaticTextures(skin)
        this.cosmeticHairTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getCosmeticHatTextures = (skin: string): Texture[][] => {
        let textures = this.cosmeticHatTexturesCache.get(skin)
        if (textures) return textures

        textures = this.getStaticTextures(skin)
        this.cosmeticHatTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getCosmeticHeadTextures = (skin: string): Texture[][] => {
        let textures = this.cosmeticHeadTexturesCache.get(skin)
        if (textures) return textures

        textures = this.getStaticTextures(skin)
        this.cosmeticHeadTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getCosmeticMakeupTextures = (skin: string): Texture[][] => {
        let textures = this.cosmeticMakeupTexturesCache.get(skin)
        if (textures) return textures

        textures = this.getStaticTextures(skin)
        this.cosmeticMakeupTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getMapTextures = (map: MapName, index: number): Texture[] => {
        let mapTextures = this.mapTexturesCache.get(map)
        if (!mapTextures) {
            mapTextures = new Map<number, Texture[]>()
            this.mapTexturesCache.set(map, mapTextures)
        }
        let textures = mapTextures.get(index)
        if (textures) return textures

        // Make the texture
        const [tilesetName, x3, y3, width, height] = this.G.geometry[map as GeoMaps].tiles[index]
        const gTileset = this.G.tilesets[tilesetName]
        const baseTexture = this.getBaseTexture(tilesetName, `${gTileset.file}`)
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

    public readonly getProjectileTextures = (projectile: ProjectileName): Texture[] => {
        const gProjectile = this.G.projectiles[projectile]
        return this.getAnimationTextures(gProjectile.animation)
    }

    public readonly getRayTexture = (projectile: ProjectileName): Texture => {
        const gProjectile = this.G.projectiles[projectile]
        const texture = this.getAnimationTextures(gProjectile.animation)[0]
        texture.baseTexture.wrapMode = WRAP_MODES.REPEAT
        return texture
    }

    public readonly getSkinColorTextures = (headSkin: string): Texture[][] => {
        let textures = this.skinColorTexturesCache.get(headSkin)
        if (textures) return textures

        const gSprites = this.G.sprites
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
                        const options = this.G.cosmetics.head[headSkin] ?? ["sskin1a", "mskin1a", "lskin1a"]
                        if (size == "small") textures = this.getSkinTextures(options[0])
                        else if (size == "normal") textures = this.getSkinTextures(options[1])
                        else if (size == "large") textures = this.getSkinTextures(options[2])
                        found = true
                        break
                    }
                }
            }
        }
        this.skinColorTexturesCache.set(headSkin, textures)
        return textures
    }

    public readonly getSkinTextures = (skin: string): Texture[][] => {
        let textures = this.skinTexturesCache.get(skin)
        if (textures) return textures

        // Make the textures
        const gSprites = this.G.sprites
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
                        const baseTexture = this.getBaseTexture(spriteName, `.${file}`)
                        const dimensions = this.G.dimensions[skin as MonsterName] ?? []
                        try {
                            const width = this.G.images[file].width / sprites.columns / 3
                            const height = this.G.images[file].height / sprites.rows / 4

                            textures = [[], [], [], []]
                            for (let i = 0; i < 4; i++) {
                                const direction = this.directions[i]
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
        this.skinTexturesCache.set(skin, textures)
        return textures
    }

    public readonly getSkinType = (skin: string): string =>{
        // Make the textures
        const gSprites = this.G.sprites
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
}