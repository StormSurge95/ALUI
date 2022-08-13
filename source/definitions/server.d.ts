import { BankInfo, CharacterType, CXData, ItemData, MapName, SlotInfo, StatusInfo } from "alclient"

export type CharacterUIData = {
    ctype: CharacterType
    cx: CXData
    gold: number
    max_hp: number
    hp: number
    max_mp: number
    mp: number
    level: number
    xp: number
    max_xp: number
    s: StatusInfo
    rip: boolean
}

export type InventoryData = {
    equipment: SlotInfo
    items: ItemData[]
}

export type ServerToClientEvents = {
    "addBot": (id: string) => void
    "removeBot": (id: string) => void
    "character": (id: string, data: CharacterUIData) => void
    "inventory": (id: string, data: InventoryData) => void
    "bank": (data: BankInfo) => void
    "map": (id: string, map: MapName) => void
}

export type ClientToServerEvents = {
    "newBot": (id: string) => void
}