import { GData } from "alclient"
import { Layers } from "../definitions/client"
import { TextureManager } from "./texture"
import { ProjectileUIData } from "../definitions/server"
import { AnimatedSprite, Point, SimpleRope, Ticker } from "pixi.js"

export type ProjectileSpriteData = {
    data: ProjectileUIData
    sprite: AnimatedSprite | SimpleRope
}

export class ProjectileManager {
    private static instance: boolean
    private textureManager: TextureManager
    private G: GData
    private projectiles: Map<string, ProjectileSpriteData>

    public constructor(tm: TextureManager, g: GData) {
        if (ProjectileManager.instance) {
            throw new Error("An instance of ProjectileManager already exists!")
        }
        ProjectileManager.instance = true
        this.textureManager = tm
        this.G = g
        this.projectiles = new Map<string, ProjectileSpriteData>()
        Ticker.shared.add(() => {
            const projectilesToDelete = []
            for (const [pid, datum] of this.projectiles) {
                if (datum.data.isRay) {
                    datum.sprite.alpha -= Ticker.shared.elapsedMS / 500
                    if (datum.sprite.alpha <= 0) projectilesToDelete.push(pid)
                } else {
                    const gProjectile = this.G.projectiles[datum.data.name]
                    const movementAngle = Math.atan2(datum.data.y - datum.data.going_y, datum.data.x - datum.data.going_x)
                    const distanceTraveled = gProjectile.speed * Ticker.shared.elapsedMS / 1000
                    const distanceToGoal = Math.hypot(datum.data.going_x - datum.data.x, datum.data.going_y - datum.data.y)
                    if (distanceTraveled > distanceToGoal) {
                        projectilesToDelete.push(pid)
                        continue
                    } else {
                        datum.data.x -= (Math.cos(movementAngle) * distanceTraveled)
                        datum.data.y -= (Math.sin(movementAngle) * distanceTraveled)
                    }
                    datum.sprite.rotation = movementAngle - (Math.PI / 2)
                    datum.sprite.x = datum.data.x
                    datum.sprite.y = datum.data.y
                    datum.sprite.zIndex = datum.data.y
                }
            }

            for (const pid of projectilesToDelete) {
                const datum = this.projectiles.get(pid)
                if (datum) {
                    datum.sprite.destroy({ baseTexture: false, children: true, texture: false })
                    this.projectiles.delete(pid)
                }
            }
        })
        return this
    }

    public renderProjectile = (layers: Layers, projectile: ProjectileUIData): AnimatedSprite | SimpleRope => {
        let sprite: AnimatedSprite | SimpleRope
        if (this.projectiles.has(projectile.pid)) {
            // Update the data
            const oldProjectile = this.projectiles.get(projectile.pid)
            for (const datum in projectile) oldProjectile.data[datum] = projectile[datum]
            sprite = oldProjectile.sprite
        } else {
            if (projectile.isRay) {
                sprite = this.renderRay(layers, projectile)
            } else {
                sprite = this.renderShot(layers, projectile)
            }
        }

        if (sprite instanceof AnimatedSprite) {
            const movementAngle = Math.atan2(projectile.y - projectile.going_y, projectile.x - projectile.going_x)

            // Update position
            sprite.anchor.set(0.5)
            sprite.rotation = movementAngle - (Math.PI / 2)
            sprite.x = projectile.x
            sprite.y = projectile.y
            sprite.zIndex = projectile.y
        }

        return sprite
    }

    private renderRay = (layers: Layers, ray: ProjectileUIData): SimpleRope => {
        const texture = this.textureManager.getRayTexture(ray.name)
        const sprite = new SimpleRope(texture, [
            new Point(ray.x, ray.y),
            new Point(ray.going_x, ray.going_y)
        ], 1)
        sprite.cullable = false
        sprite.interactive = false
        sprite.interactiveChildren = false
        sprite.zIndex = ray.y
        layers.foreground?.addChild(sprite)

        const datum: ProjectileSpriteData = {
            data: ray,
            sprite: sprite
        }
        this.projectiles.set(ray.pid, datum)

        return sprite
    }

    private renderShot = (layers: Layers, shot: ProjectileUIData): AnimatedSprite => {
        const textures = this.textureManager.getProjectileTextures(shot.name)
        const sprite = new AnimatedSprite(textures)
        sprite.interactive = false
        sprite.interactiveChildren = false
        layers.foreground?.addChild(sprite)

        const datum: ProjectileSpriteData = {
            data: shot,
            sprite: sprite
        }
        this.projectiles.set(shot.pid, datum)

        return sprite
    }
}