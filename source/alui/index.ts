import Express from "express"
import Http from "http"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { BankInfo, Character, CharacterData, CharacterType, EntitiesData, NewMapData, WelcomeData } from "alclient"
import { CharacterUIData, ClientToServerEvents, InventoryData, MapData, ServerData, ServerToClientEvents, UIData } from "../definitions/server"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientFolder = Path.join(__dirname, "../client")
const app = Express()
const server = Http.createServer(app)
const bots = new Map<string, UIData>()
let bankCache: BankInfo = undefined

let io: SocketIO.Server<ClientToServerEvents, ServerToClientEvents>

export function startServer(port = 8080) {

    app.use(Express.static(clientFolder))
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })

    io = new SocketIO.Server(server)
    io.on("connection", (connection) => {
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
                hp: character.hp,
                level: character.level,
                max_hp: character.max_hp,
                max_mp: character.max_mp,
                mp: character.mp,
                rip: character.rip,
                s: character.s,
                xp: character.xp,
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
            case "disconnect": {
                io.emit("removeBot", id)
                break
            }
            case "entities": {
                const data = args as EntitiesData
                for (const player of data.players) {
                    if (player.id == id) {
                        const botData = bots.get(id)
                        // Create updated bot data
                        const charData: CharacterUIData = {
                            ctype: player.ctype as CharacterType,
                            cx: player.cx,
                            hp: player.hp,
                            level: player.level,
                            max_hp: player.max_hp,
                            max_mp: player.max_mp,
                            mp: player.mp,
                            rip: player.rip as boolean,
                            s: player.s,
                            xp: player.xp,
                        }
                        // Update bot cache
                        botData.character = charData
                        // Update bot display
                        io.emit("character", id, charData)

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
                    hp: data.hp,
                    level: data.level,
                    max_hp: data.max_hp,
                    max_mp: data.max_mp,
                    mp: data.mp,
                    rip: data.rip,
                    s: data.s,
                    xp: data.xp,
                }
                botData.character = charData
                io.emit("character", id, charData)

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