import { GData } from "alclient"
import { AnimatedSprite, Graphics, Texture, Ticker } from "pixi.js"
import { Layers } from "../definitions/client"
import { CharacterUIData, MonsterUIData } from "../definitions/server"
import { TextureManager } from "./texture"

export type MonsterSpriteData = {
    data: MonsterUIData
    lastDirection: number
    focusedHover?: boolean
    hpBar: Graphics
    sprite: AnimatedSprite
    textures: Texture[][]
}

export type CharacterSpriteData = {
    data: CharacterUIData
    lastDirection: number
    focusedHover?: boolean
    sprite: AnimatedSprite
    textures: Texture[][]
    texturesChildren: {
        [T in number]: Texture[][]
    }
}

export class SpriteManager {
    private static instance: boolean
    private textureManager: TextureManager
    private focusedMon: string
    private monsters: Map<string, MonsterSpriteData>
    private characters: Map<string, CharacterSpriteData>
    private G: GData

    public constructor(tm: TextureManager, g: GData) {
        if (SpriteManager.instance) {
            throw new Error("An instance of SpriteManager already exists!")
        }
        SpriteManager.instance = true
        this.textureManager = tm
        this.monsters = new Map<string, MonsterSpriteData>()
        this.characters = new Map<string, CharacterSpriteData>()
        this.G = g
        Ticker.shared.add(() => {
            const monstersToDelete = []
            for (const [id, datum] of this.monsters) {
                // Slowly fade away on death
                if (datum.data.hp <= 0) {
                    // Stop animating
                    datum.sprite.gotoAndStop(1)

                    // Hide HP bar
                    datum.sprite.interactive = false
                    datum.hpBar.visible = false

                    // Reduce alpha until it's 0, then destroy the sprite object
                    datum.sprite.alpha = datum.sprite.alpha - Ticker.shared.elapsedMS / 500
                    if (datum.sprite.alpha <= 0) monstersToDelete.push(id)
                    continue
                }

                const movementAngle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
                if (datum.data.moving) {
                    const distanceTraveled = datum.data.speed * Ticker.shared.elapsedMS / 1000
                    const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
                    if (distanceTraveled > distanceToGoal) {
                        datum.data.moving = false
                        datum.data.x = datum.data.going_x
                        datum.data.y = datum.data.going_y
                    } else {
                        datum.data.x += (Math.cos(movementAngle) * distanceTraveled)
                        datum.data.y += (Math.sin(movementAngle) * distanceTraveled)
                    }
                }
                datum.sprite.x = datum.data.x - datum.sprite.width / 2
                datum.sprite.y = datum.data.y - datum.sprite.height

                // Change sprite texture based on direction
                let direction = datum.lastDirection
                if (datum.data.target && (this.characters.has(datum.data.target) || this.monsters.has(datum.data.target))) {
                    const target = this.characters.get(datum.data.target) || this.monsters.get(datum.data.target)
                    if (target) {
                        const targetAngle = Math.atan2(target.data.y - datum.data.y, target.data.x - datum.data.x)
                        direction = this.radsToDirection(targetAngle)
                    }
                } else if (datum.data.moving) {
                    direction = this.radsToDirection(movementAngle)
                }
                if (datum.lastDirection !== direction) {
                    datum.sprite.textures = datum.textures[direction]
                    datum.lastDirection = direction
                }

                // Animate on movement
                if (!datum.data.moving && !datum.data.aa && datum.sprite.playing) {
                    // The middle sprite is the one in the "stopped" position
                    datum.sprite.gotoAndStop(1)
                } else if ((datum.data.aa || datum.data.moving) && !datum.sprite.playing) {
                    // Set animation speed
                    datum.sprite.animationSpeed = datum.data.speed / 1000

                    // Start animation
                    datum.sprite.play()
                }

                // TODO: Add filters for status effects

                // Update HP Bar
                const hpBar = datum.hpBar
                hpBar.visible = (this.focusedMon == datum.data.id) || (datum.focusedHover ?? false)
                if (hpBar.visible) {
                    const spriteHalfWidth = datum.sprite.width / 2
                    hpBar.clear()
                        .beginFill(0x888888).lineStyle(0).drawRect(datum.sprite.x - (20 - spriteHalfWidth), datum.sprite.y - 12, 40, 10)
                        .beginFill(0x000000).lineStyle(0).drawRect(datum.sprite.x - (18 - spriteHalfWidth), datum.sprite.y - 10, 36, 6)
                        .beginFill(0xFF0000).lineStyle(0).drawRect(datum.sprite.x - (16 - spriteHalfWidth), datum.sprite.y - 8, 32 * (datum.data.hp / datum.data.max_hp), 2)
                }

                datum.sprite.zIndex = datum.data.y
            }
            for (const id of monstersToDelete) {
                const datum = this.monsters.get(id)
                if (datum) {
                    datum.hpBar.destroy({ baseTexture: false, children: true, texture: false })
                    datum.sprite.destroy({ baseTexture: false, children: true, texture: false })
                    this.monsters.delete(id)
                }
            }

            for (const [, datum] of this.characters) {
                // Movement computation
                const angle = Math.atan2(datum.data.going_y - datum.data.y, datum.data.going_x - datum.data.x)
                if (datum.data.moving) {
                    const distanceTraveled = datum.data.speed * Ticker.shared.elapsedMS / 1000
                    const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
                    if (distanceTraveled > distanceToGoal) {
                        datum.data.moving = false
                        datum.data.x = datum.data.going_x
                        datum.data.y = datum.data.going_y
                    } else {
                        datum.data.x += (Math.cos(angle) * distanceTraveled)
                        datum.data.y += (Math.sin(angle) * distanceTraveled)
                    }
                }
                datum.sprite.x = datum.data.x - datum.sprite.width / 2
                datum.sprite.y = datum.data.y = datum.sprite.height

                let direction = datum.lastDirection
                if (datum.data.target && (this.characters.has(datum.data.target) || this.monsters.has(datum.data.target))) {
                    // Change sprite texture based on target
                    const target = this.monsters.get(datum.data.target) || this.characters.get(datum.data.target)
                    if (target) {
                        const targetAngle = Math.atan2(target.data.y - datum.data.y, target.data.x - datum.data.x)
                        direction = this.radsToDirection(targetAngle)
                    }
                } else if (datum.data.moving) {
                    direction = this.radsToDirection(angle)
                }
                if (datum.lastDirection !== direction) {
                    datum.sprite.textures = datum.textures[direction]

                    for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                        const child = datum.sprite.children[i] as AnimatedSprite
                        child.textures = datum.texturesChildren[i][direction]
                    }

                    datum.lastDirection = direction
                }

                // Animate on movement
                if (!datum.data.moving && datum.sprite.playing) {
                    // The middle sprite is the one in the "stopped" position
                    datum.sprite.gotoAndStop(1)
                    for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                        const child = datum.sprite.children[i] as AnimatedSprite
                        child.gotoAndStop(child.totalFrames > 1 ? 1 : 0)
                    }
                } else if (datum.data.moving && !datum.sprite.playing) {
                    // Set animation speed
                    const speed = datum.data.speed / 1000
                    datum.sprite.animationSpeed = speed
                    for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                        const child = datum.sprite.children[i] as AnimatedSprite
                        child.animationSpeed = speed
                    }

                    // Start animation
                    datum.sprite.play()
                    for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                        const child = datum.sprite.children[i] as AnimatedSprite
                        child.play()
                    }
                }

                // TODO: Add filters

                datum.sprite.zIndex = datum.data.y
            }
        })
        return this
    }

    private radsToDirection = (angle: number): number => {
        if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
            return 1 // East
        } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
            return 0 // North
        } else if (angle > 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
            return 3 // West
        } else {
            return 2 // South
        }
    }

    public removeSprite = (id: string) => {
        const character = this.characters.get(id)
        if (character) {
            character.sprite.destroy({ baseTexture: false, children: true, texture: false })
            this.characters.delete(id)
        }

        const monster = this.monsters.get(id)
        if (monster) monster.data.hp = -1
    }

    public removeAllSprites = () => {
        for (const [, character] of this.characters) {
            character.sprite.destroy({ baseTexture: false, children: true, texture: false })
        }
        this.characters.clear()
        for (const [, monster] of this.monsters) {
            monster.hpBar.destroy({ baseTexture: false, children: true, texture: false })
            monster.sprite.destroy({ baseTexture: false, children: true, texture: false })
        }
        this.monsters.clear()
    }

    public renderCharacter = (layers: Layers, character: CharacterUIData, initialDirection = 0): AnimatedSprite => {
        let sprite: AnimatedSprite
        if (this.characters.has(character.id)) {
            const oldCharacter = this.characters.get(character.id)
            for (const datum in character) oldCharacter.data[datum] = character[datum]
            sprite = oldCharacter.sprite
        } else {
            const type = this.textureManager.getSkinType(character.skin)

            // Defaults
            if (!character.cx) character.cx = {}

            // Skin color is based off the head
            let textures: Texture[][]
            if (type == "full") {
                textures = this.textureManager.getSkinTextures(character.skin)
            } else {
                if (!character.cx.head) character.cx.head = "makeup117"
                textures = this.textureManager.getSkinColorTextures(character.cx.head)
            }
            sprite = new AnimatedSprite(textures[initialDirection])
            sprite.interactive = true
            sprite.interactiveChildren = false
            sprite.sortableChildren = true

            const datum: CharacterSpriteData = {
                data: character,
                lastDirection: initialDirection,
                sprite: sprite,
                textures: textures,
                texturesChildren: {}
            }
            this.characters.set(character.id, datum)

            // Add base skin
            if (type !== "full") {
                const hasCovers = this.G.cosmetics.prop[character.skin]?.includes("covers") ?? false
                const noHair = this.G.cosmetics.prop[character.skin]?.includes("no_hair") ?? false

                // Add skin here, unless it's covers, in which case it will be added at the end
                if (!hasCovers) {
                    const baseTextures = this.textureManager.getSkinTextures(character.skin)
                    const baseSkin = new AnimatedSprite(baseTextures[initialDirection])
                    if (sprite.width !== baseSkin.width) baseSkin.x += (sprite.width - baseSkin.width)
                    baseSkin.zIndex = -1
                    sprite.addChild(baseSkin)
                    datum.texturesChildren[sprite.children.length - 1] = baseTextures
                }

                // Add head
                if (character.cx.head) {
                    const headTextures = this.textureManager.getCosmeticHeadTextures(character.cx.head)
                    const head = new AnimatedSprite(headTextures[initialDirection])
                    if (sprite.width !== head.width) head.x += (sprite.width - head.width)
                    head.zIndex = 0
                    sprite.addChild(head)
                    datum.texturesChildren[sprite.children.length - 1] = headTextures
                }

                // Add face
                if (character.cx.face) {
                    const faceTextures = this.textureManager.getCosmeticFaceTextures(character.cx.face)
                    const face = new AnimatedSprite(faceTextures[initialDirection])
                    if (sprite.width !== face.width) face.x += (sprite.width - face.width)
                    face.zIndex = 1
                    sprite.addChild(face)
                    datum.texturesChildren[sprite.children.length - 1] = faceTextures
                }

                // Add makeup
                if (character.cx.makeup) {
                    const makeupTextures = this.textureManager.getCosmeticMakeupTextures(character.cx.makeup)
                    const makeup = new AnimatedSprite(makeupTextures[initialDirection])
                    if (sprite.width !== makeup.width) makeup.x += (sprite.width - makeup.width)
                    makeup.zIndex = 2
                    sprite.addChild(makeup)
                    datum.texturesChildren[sprite.children.length - 1] = makeupTextures
                }

                // Add hair
                if (character.cx.hair && !noHair) {
                    const hairTextures = this.textureManager.getCosmeticHairTextures(character.cx.hair)
                    const hair = new AnimatedSprite(hairTextures[initialDirection])
                    if (sprite.width !== hair.width) hair.x += (sprite.width - hair.width)
                    hair.zIndex = 3
                    sprite.addChild(hair)
                    datum.texturesChildren[sprite.children.length - 1] = hairTextures
                }

                // Add hat
                if (character.cx.hat) {
                    const hatTextures = this.textureManager.getCosmeticHatTextures(character.cx.hat)
                    const hat = new AnimatedSprite(hatTextures[initialDirection])
                    if (sprite.width !== hat.width) hat.x += (sprite.width - hat.width)
                    hat.zIndex = 4
                    sprite.addChild(hat)
                    datum.texturesChildren[sprite.children.length - 1] = hatTextures
                }

                // Add covers
                if (hasCovers) {
                    const coversTextures = this.textureManager.getSkinTextures(character.skin)
                    const covers = new AnimatedSprite(coversTextures[initialDirection])
                    if (sprite.width !== covers.width) covers.x += (sprite.width - covers.width)
                    covers.zIndex = 5
                    sprite.addChild(covers)
                    datum.texturesChildren[sprite.children.length - 1] = coversTextures
                }
            }
            layers.foreground?.addChild(sprite)

            if (character.moving) {
                // Set animation speed
                const speed = character.speed / 1000
                sprite.animationSpeed = speed
                for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                    const child = sprite.children[i] as AnimatedSprite
                    child.animationSpeed = speed
                }

                // Start on a random frame
                const randomFrame = Math.floor(Math.random() * (sprite.totalFrames + 1))
                sprite.gotoAndPlay(randomFrame)
                for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                    const child = sprite.children[i] as AnimatedSprite
                    child.gotoAndPlay(child.totalFrames > 1 ? randomFrame : 0)
                }
            } else {
                sprite.gotoAndStop(1)
                for (let i = datum.sprite.children.length - 1; i >= 0; i--) {
                    const child = sprite.children[i] as AnimatedSprite
                    child.gotoAndStop(child.totalFrames > 1 ? 1 : 0)
                }
            }
        }

        // Update position
        sprite.x = character.x - sprite.width / 2
        sprite.y = character.y - sprite.height
        sprite.zIndex = character.y

        return sprite
    }

    public renderMonster = (layers: Layers, monster: MonsterUIData, initialDirection = 0): AnimatedSprite => {
        let sprite: AnimatedSprite
        if (this.monsters.has(monster.id)) {
            // Update the data
            const oldMonster = this.monsters.get(monster.id)
            for (const datum in monster) oldMonster.data[datum] = monster[datum]
            sprite = oldMonster.sprite
        } else {
            const textures = this.textureManager.getSkinTextures(monster.skin)
            sprite = new AnimatedSprite(textures[initialDirection])
            sprite.interactive = true
            sprite.interactiveChildren = false
            layers.foreground?.addChild(sprite)

            // Add hp bar (will be updated in animate loop)
            const hpBar = new Graphics()
            hpBar.visible = false
            sprite.on("click", () => {
                if (this.focusedMon != monster.id) {
                    this.focusedMon = monster.id
                } else {
                    this.focusedMon = null
                }
            })
            sprite.on("mouseover", () => { datum.focusedHover = true })
            sprite.on("mouseout", () => { datum.focusedHover = false })
            layers.hpBars.addChild(hpBar)

            const datum: MonsterSpriteData = {
                data: monster,
                hpBar: hpBar,
                lastDirection: initialDirection,
                sprite: sprite,
                textures: textures
            }
            this.monsters.set(monster.id, datum)

            if (monster.moving) {
                // Set animation speed
                sprite.animationSpeed = monster.speed / 1000

                // Start on a random frame
                sprite.gotoAndPlay(Math.floor(Math.random() * (sprite.totalFrames + 1)))
            } else {
                sprite.gotoAndStop(1)
            }
        }

        // Update position
        if (monster.size && monster.size !== 1) sprite.scale.set(monster.size)
        if (monster.x !== undefined) sprite.x = monster.x - sprite.width / 2
        if (monster.y !== undefined) {
            sprite.y = monster.y - sprite.height
            sprite.zIndex = monster.y
        }

        return sprite
    }
}