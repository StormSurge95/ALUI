import { GData } from "alclient"
import { Layers } from "../definitions/client"
import { getProjectileTextures, getRayTexture } from "./texture"
import { ProjectileUIData } from "../definitions/server"
import { AnimatedSprite, Point, SimpleRope, Ticker } from "pixi.js"
import G from "./G.json"

export type ProjectileSpriteData = {
    data: ProjectileUIData
    sprite: AnimatedSprite | SimpleRope
}

const projectiles = new Map<string, ProjectileSpriteData>()

Ticker.shared.add(() => {
    const projectilesToDelete = []
    for (const [pid, datum] of projectiles) {
        if (datum.data.isRay) {
            datum.sprite.alpha -= Ticker.shared.elapsedMS / 500
            if (datum.sprite.alpha <= 0) projectilesToDelete.push(pid)
        } else {
            const gProjectile = (G as unknown as GData).projectiles[datum.data.name]
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
        const datum = projectiles.get(pid)
        if (datum) {
            datum.sprite.destroy({ baseTexture: false, children: true, texture: false })
            projectiles.delete(pid)
        }
    }
})

export const renderProjectile = (layers: Layers, projectile: ProjectileUIData): AnimatedSprite | SimpleRope => {
    let sprite: AnimatedSprite | SimpleRope
    if (projectiles.has(projectile.pid)) {
        // Update the data
        const oldProjectile = projectiles.get(projectile.pid)
        for (const datum in projectile) oldProjectile.data[datum] = projectile[datum]
        sprite = oldProjectile.sprite
    } else {
        if (projectile.isRay) {
            sprite = renderRay(layers, projectile)
        } else {
            sprite = renderShot(layers, projectile)
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

const renderRay = (layers: Layers, ray: ProjectileUIData): SimpleRope => {
    const texture = getRayTexture(ray.name)
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
    projectiles.set(ray.pid, datum)

    return sprite
}

const renderShot = (layers: Layers, shot: ProjectileUIData): AnimatedSprite => {
    const textures = getProjectileTextures(shot.name)
    const sprite = new AnimatedSprite(textures)
    sprite.interactive = false
    sprite.interactiveChildren = false
    layers.foreground?.addChild(sprite)

    const datum: ProjectileSpriteData = {
        data: shot,
        sprite: sprite
    }
    projectiles.set(shot.pid, datum)

    return sprite
}