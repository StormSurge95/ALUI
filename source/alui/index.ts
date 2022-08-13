import Express from "express"
import Http from "http"
import { fileURLToPath } from "url"
import Path, { dirname } from "path"
import * as SocketIO from "socket.io"
import { Socket } from "socket.io-client"
import { Character, CharacterData, GData, NewMapData } from "alclient"
import axios from "axios"
import fs from "fs"
import { CharacterUIData, ClientToServerEvents, InventoryData, ServerToClientEvents } from "../definitions/server"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const clientFolder = Path.join(__dirname, "../client")
const app = Express()
const server = Http.createServer(app)

let io: SocketIO.Server<ClientToServerEvents, ServerToClientEvents>
let G: GData
let version: number

export async function startServer(port = 8080) {
    G = await getGData()

    app.use(Express.static(clientFolder))
    server.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`)
    })

    io = new SocketIO.Server(server)
    io.on("connection", (connection) => {
        connection.on("newBot", (id: string) => {
            connection.join(id)
        })
    })
}

export function addBot(id: string, socket: Socket) {
    io.emit("addBot", id)
    socket.onAny((eventName, args) => {
        switch (eventName) {
            case "disconnect": {
                io.to(id).emit("removeBot", id)
                break
            }
            case "player": {
                const data = args as CharacterData

                // Update bot data
                const characterData: CharacterUIData = {
                    ctype: data.ctype,
                    cx: data.cx,
                    gold: data.gold,
                    max_hp: data.max_hp,
                    hp: data.hp,
                    max_mp: data.max_mp,
                    mp: data.mp,
                    level: data.level,
                    xp: data.xp,
                    max_xp: data.max_xp,
                    s: data.s,
                    rip: data.rip
                }
                io.emit("character", id, characterData)

                const invData: InventoryData = {
                    equipment: data.slots,
                    items: data.items
                }
                io.emit("inventory", id, invData)

                if (data.user) {
                    io.emit("bank", data.user)
                }
                break
            }
            case "new_map": {
                const data = args as NewMapData
                io.emit("map", id, data.name)
                break
            }
            default: {
                break
            }
        }
    })

    socket.emit("send_updates", {})
}

async function getVersion(): Promise<number> {
    const response = await axios.get("https://adventure.land/comm")
    if (response.status == 200) {
        const matches = (response.data as string).match(/var\s+VERSION\s*=\s*'(\d+)/)
        version = Number.parseInt(matches[1])

        return version
    } else {
        console.error(response)
        console.error("Error fetching https://adventure.land/comm")
    }
}

async function getGData(): Promise<GData> {
    if (G) return G
    if (!version) await getVersion()

    // filename for current-version data.js
    const gFile = `G_${version}.json`
    try {
        // if we have a current-version data.js cached, use it to save processing
        G = JSON.parse(fs.readFileSync(gFile, "utf-8")) as GData
        return G
    } catch (e) {
        // if we DON'T have a current-version data.js cached,
        // get the current data.js file
        console.debug("Updating 'G' data...")
        const response = await axios.get<string>("https://adventure.land/data.js")
        if (response.status == 200) {
            // Update G with the latest data
            const matches = response.data.match(/var\s+G\s*=\s*(\{.+\});/)
            const rawG = matches[1]
            G = JSON.parse(rawG) as GData

            // Optimize G for our application
            // G = optimizeG(G)

            console.debug("Updated 'G' data!")

            // Cache G for less processing on subsequent startups 
            fs.writeFileSync(gFile, JSON.stringify(G))
            return G
        } else {
            console.error(response)
            console.error("Error fetching https://adventure.land/data.js")
        }
    }
}