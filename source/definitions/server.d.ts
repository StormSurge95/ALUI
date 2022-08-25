import { BankInfo, CharacterType, CXData, GData, ItemData, MapName, ProjectileName, ServerIdentifier, ServerRegion, SlotInfo, StatusInfo } from "alclient"

export type ItemInfo = {
    name: string
    level?: number
    quantity?: number
    stats?: {
        str?: number
        int?: number
        dex?: number
        vit?: number
        for?: number
        arm?: number
        res?: number
        dmg?: number
        aspd?: number
        range?: number
        spd?: number
        stat?: string
        eva?: number
        ap?: number
        rp?: number
        crit?: number
        ref?: number
        dmgret?: number
        lifesteal?: number
        manasteal?: number
        courage?: number
        pcourage?: number
        mcourage?: number
    }
}

export type MapData = {
    map: MapName
    x: number
    y: number
}

export type UIData = {
    character: CharacterUIData
    inventory: InventoryData
    map: MapData
    server: ServerData
}

export type ServerData = {
    region: ServerRegion
    ident: ServerIdentifier
}

export type CharacterUIData = {
    ctype: CharacterType
    cx: CXData
    hp: number
    id: string
    going_x: number
    going_y: number
    level: number
    max_hp: number
    max_mp: number
    moving: boolean
    mp: number
    rip: boolean
    s: StatusInfo
    skin: string
    speed: number
    target?: string
    x: number
    xp: number
    y: number
}

export type MonsterUIData = {
    aa?: number
    hp: number
    id: string
    going_x: number
    going_y: number
    max_hp: number
    moving: boolean
    s: StatusInfo
    size?: number
    skin: string
    speed: number
    target?: string
    x: number
    y: number
}

export type ProjectileUIData = {
    going_x: number
    going_y: number
    pid: string
    name: ProjectileName
    isRay: boolean
    x: number
    y: number
}

export type InventoryData = {
    equipment: SlotInfo
    gold: number
    items: ItemData[]
}

export type ServerToClientEvents = {
    "addBot": (id: string, data: UIData) => void
    "bank": (data: BankInfo) => void
    "character": (id: string, data: CharacterUIData) => void
    "clear": () => void
    "data": (g: GData) => void
    "inventory": (id: string, data: InventoryData) => void
    "map": (id: string, data: MapData) => void
    "monster": (monsterData: MonsterUIData) => void
    "player": (id: string, data: CharacterUIData) => void
    "projectile": (projectileData: ProjectileUIData) => void
    "removeBot": (id: string) => void
    "removeSprite": (entityID: string) => void
    "removeSprites": () => void
    "server": (id: string, data: ServerData) => void
}

export type ClientToServerEvents = {
    "newBot": (id: string) => void
}