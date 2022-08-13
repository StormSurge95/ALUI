import * as SocketIO from "socket.io-client"
import { ClientToServerEvents, ServerToClientEvents } from "../definitions/server"
import "./index.css"

const socket: SocketIO.Socket<ServerToClientEvents, ClientToServerEvents> = SocketIO.io({
    reconnection: true,
    autoConnect: true,
    transports: ["websocket"]
})

const UIContainer = document.createElement("div")
UIContainer.setAttribute("class", "botUIContainer")
document.body.appendChild(UIContainer)

socket.on("addBot", (id: string) => {
    // create bot UI window
    const botWindow = document.createElement("div")
    botWindow.id = `${id}_BotUI`
    botWindow.setAttribute("class", "botUI")

    // create id display for bot
    const idRow = document.createElement("div")
    const idLabel = document.createElement("div")
    idLabel.textContent = "Name: "
    idRow.appendChild(idLabel)
    const idValue = document.createElement("div")
    idValue.textContent = id
    idRow.appendChild(idValue)
    botWindow.appendChild(idRow)

    // create class display for bot
    const classRow = document.createElement("div")
    classRow.id = `${id}_Class`
    botWindow.appendChild(classRow)

    // create level display for bot
    const levelRow = document.createElement("div")
    const levelLabel = document.createElement("div")
    levelLabel.textContent = "Level: "
    levelRow.appendChild(levelLabel)
    const levelValue = document.createElement("div")
    levelValue.id = `${id}_Level`
    levelRow.appendChild(levelValue)
    botWindow.appendChild(levelRow)

    // create health display for bot
    const healthRow = document.createElement("div")
    const healthBar = document.createElement("div")
    healthBar.id = `${id}_HP`
    healthRow.appendChild(healthBar)
    botWindow.appendChild(healthRow)

    // create mana display for bot
    const manaRow = document.createElement("div")
    const manaBar = document.createElement("div")
    manaBar.id = `${id}_MP`
    manaRow.appendChild(manaBar)
    botWindow.appendChild(manaRow)

    // create exp display for bot
    const expRow = document.createElement("div")
    const expBar = document.createElement("div")
    expBar.id = `${id}_XP`
    expRow.appendChild(expBar)
    botWindow.appendChild(expRow)

    // create gold display for bot
    const goldRow = document.createElement("div")
    const goldLabel = document.createElement("div")
    goldLabel.textContent = "Gold: "
    goldRow.appendChild(goldLabel)
    const goldValue = document.createElement("div")
    goldValue.id = `${id}_Gold`
    goldRow.appendChild(goldValue)
    botWindow.appendChild(goldRow)

    // create map display for bot
    const mapRow = document.createElement("div")
    const mapLabel = document.createElement("div")
    mapLabel.textContent = "Map: "
    mapRow.appendChild(mapLabel)
    const mapValue = document.createElement("div")
    mapValue.id = `${id}_Map`
    mapRow.appendChild(mapValue)
    botWindow.appendChild(mapRow)

    // create inventory button
    const invButton = document.createElement("div")
    invButton.id = `${id}_Inventory`
    invButton.setAttribute("class", "button")
    const invText = document.createTextNode("Inventory")
    invButton.appendChild(invText)
    botWindow.appendChild(invButton)

    // create status info button
    const statButton = document.createElement("div")
    statButton.id = `${id}_Status`
    statButton.setAttribute("class", "button")
    const statText = document.createTextNode("Status Info")
    statButton.appendChild(statText)
    botWindow.appendChild(statButton)

    // add Bot UI to UI Container
    UIContainer.appendChild(botWindow)
})