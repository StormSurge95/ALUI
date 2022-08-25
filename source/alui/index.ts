import Express from "express"
import Http from "http"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { BankInfo, Character, CharacterData, CharacterType, EntitiesData, GData, NewMapData, WelcomeData } from "alclient"
import { CharacterUIData, ClientToServerEvents, InventoryData, MapData, ServerData, ServerToClientEvents, UIData } from "../definitions/server"
import axios from "axios"


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientFolder = Path.join(__dirname, "../client")
const app = Express()
const server = Http.createServer(app)
const bots = new Map<string, UIData>()
let bankCache: BankInfo = undefined

let io: SocketIO.Server<ClientToServerEvents, ServerToClientEvents>

export async function startServer(port = 8080) {

    const G = await getGData()

    app.use(Express.static(clientFolder))
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })

    io = new SocketIO.Server(server)
    io.on("connection", (connection) => {
        connection.emit("data", G)
        for (const [id, data] of bots) connection.emit("addBot", id, data)
        if (bankCache) connection.emit("bank", bankCache)
    })
}

export function addBot(id: string, socket: Socket, character: Character) {
    if (!bots.has(id)) {
        const uiData: UIData = {
            character: {
                ctype: character.ctype,
                cx: character.cx,
                going_x: character.going_x,
                going_y: character.going_y,
                hp: character.hp,
                id: character.id,
                level: character.level,
                max_hp: character.max_hp,
                max_mp: character.max_mp,
                moving: character.moving,
                mp: character.mp,
                rip: character.rip,
                s: character.s,
                skin: character.skin,
                speed: character.speed,
                x: character.x,
                xp: character.xp,
                y: character.y
            },
            inventory: {
                equipment: character.slots,
                gold: character.gold,
                items: character.items
            },
            map: {
                map: character.map,
                x: character.x,
                y: character.y
            },
            server: {
                region: character.serverData.region,
                ident: character.serverData.name
            }
        }
        io.emit("addBot", id, uiData)
        bots.set(id, uiData)
    }
    socket.onAny((eventName, args) => {
        switch (eventName) {
            case "entities": {
                const data = args as EntitiesData
                for (const player of data.players) {
                    if (player.id == id) {
                        const botData = bots.get(id)
                        // Create updated bot data
                        const charData: CharacterUIData = {
                            ctype: player.ctype as CharacterType,
                            cx: player.cx,
                            going_x: player.going_x,
                            going_y: player.going_y,
                            hp: player.hp,
                            id: player.id,
                            level: player.level,
                            max_hp: player.max_hp,
                            max_mp: player.max_mp,
                            moving: player.moving,
                            mp: player.mp,
                            rip: player.rip as boolean,
                            s: player.s,
                            skin: player.skin,
                            speed: player.speed,
                            x: player.x,
                            xp: player.xp,
                            y: player.y
                        }
                        // Update bot cache
                        botData.character = charData
                        // Update bot display
                        io.emit("player", id, charData)

                        // create updated map data
                        const mapData: MapData = {
                            map: botData.map.map,
                            x: player.x,
                            y: player.y
                        }
                        botData.map = mapData
                        io.emit("map", id, mapData)

                        const invData: InventoryData = {
                            equipment: player.slots,
                            gold: botData.inventory.gold,
                            items: botData.inventory.items
                        }
                        botData.inventory = invData
                        io.emit("inventory", id, invData)

                        botData.server = {
                            region: botData.server.region,
                            ident: botData.server.ident
                        }
                        io.emit("server", id, botData.server)

                        bots.set(id, botData)
                    } else {
                        //
                    }
                }
                break
            }
            case "player": {
                const data = args as CharacterData

                const botData = bots.get(id)

                // Update bot data
                const charData: CharacterUIData = {
                    ctype: data.ctype,
                    cx: data.cx,
                    going_x: data.going_x,
                    going_y: data.going_y,
                    hp: data.hp,
                    id: data.id,
                    level: data.level,
                    max_hp: data.max_hp,
                    max_mp: data.max_mp,
                    moving: data.moving,
                    mp: data.mp,
                    rip: data.rip,
                    s: data.s,
                    skin: data.skin,
                    speed: data.speed,
                    x: data.x,
                    xp: data.xp,
                    y: data.y
                }
                botData.character = charData
                io.emit("player", id, charData)

                const invData: InventoryData = {
                    equipment: data.slots,
                    gold: data.gold,
                    items: data.items
                }
                botData.inventory = invData
                io.emit("inventory", id, invData)

                const mapData: MapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                }
                botData.map = mapData
                io.emit("map", id, mapData)

                botData.server = {
                    region: botData.server.region,
                    ident: botData.server.ident
                }
                io.emit("server", id, botData.server)

                if (data.user) {
                    bankCache = data.user
                    io.emit("bank", data.user)
                }

                bots.set(id, botData)
                break
            }
            case "new_map": {
                const data = args as NewMapData
                const botData = bots.get(id)
                const mapData: MapData = {
                    map: data.name,
                    x: data.x,
                    y: data.y
                }
                botData.map = mapData
                io.emit("map", id, mapData)
                bots.set(id, botData)
                break
            }
            case "welcome": {
                const data = args as WelcomeData
                const botData = bots.get(id)
                const serverData: ServerData = {
                    region: data.region,
                    ident: data.name
                }
                botData.server = serverData
                io.emit("server", id, serverData)
                const mapData: MapData = {
                    map: data.map,
                    x: data.x,
                    y: data.y
                }
                botData.map = mapData
                io.emit("map", id, mapData)
                bots.set(id, botData)
                break
            }
            default: {
                break
            }
        }
    })

    socket.emit("send_updates", {})
}

async function getGData(): Promise<GData> {
    const response = await axios.get<string>("https://adventure.land/data.js")
    if (response.status == 200) {
        const matches = response.data.match(/var\s+G\s*=\s*(\{.+\});/)
        const rawG = matches[1]
        const G = JSON.parse(rawG) as GData
        return Promise.resolve(G)
    } else {
        return Promise.reject(`${response}\nError fetching https://adventure.land/data.js`)
    }
}