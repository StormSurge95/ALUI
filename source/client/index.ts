import * as SocketIO from "socket.io-client"
import { CharacterUIData, ClientToServerEvents, InventoryData, MapData, ServerToClientEvents, UIData } from "../definitions/server"
import "./index.css"
import { BankInfo, BankPackName, ConditionName, GData, ItemData, SlotInfo, SlotType, StatusInfo } from "alclient"
import { PRECISION, SCALE_MODES, settings } from "pixi.js"
import { TextureManager } from "./texture"
import { MapManager } from "./map"
import { SpriteManager } from "./sprite"
import { ProjectileManager } from "./projectile"

const invDisplayed = new Map<string, boolean>()
let bankCache: BankInfo
let currentPackNum = 0
let currentTotalPacks = 0
let tm: TextureManager
let mm: MapManager
let sm: SpriteManager
let pm: ProjectileManager
let G: GData = undefined

settings.ROUND_PIXELS = true
settings.SCALE_MODE = SCALE_MODES.NEAREST
settings.PRECISION_FRAGMENT = PRECISION.LOW

const socket: SocketIO.Socket<ServerToClientEvents, ClientToServerEvents> = SocketIO.io({
    autoConnect: true,
    reconnection: true,
    transports: ["websocket"]
})

const UIContainer = document.createElement("div")
UIContainer.setAttribute("class", "botUIContainer")
UIContainer.id = "botUIContainer"
const bankContainer = document.createElement("div")
bankContainer.setAttribute("class", "bankUIContainer")
bankContainer.id = "bankUIContainer"
document.body.appendChild(UIContainer)
document.body.appendChild(bankContainer)
if (!bankCache) bankContainer.textContent = "NO BANK DATA"
else displayBank(bankCache, bankContainer)

socket.on("data", (g: GData): void => {
    G = g
    if (tm === undefined) {
        tm = new TextureManager(g)
        mm = new MapManager(tm, g.geometry)
        sm = new SpriteManager(tm, g)
        pm = new ProjectileManager(tm, g)
    }
})

socket.on("removeBot", (id: string): void => {
    const bot = document.getElementById(`${id}_BotUI`)
    bot.parentNode.removeChild(bot)
})

socket.on("clear", (): void => {
    const cont = document.getElementById("botUIContainer")
    cont.childNodes.forEach(node => {
        node.parentNode.removeChild(node)
    })
})

socket.on("addBot", (id: string, data: UIData): void => {
    console.log(`adding bot: { id: ${id} }...`)
    // create bot UI window
    const botWindow = document.createElement("div")
    botWindow.id = `${id}_BotUI`
    botWindow.setAttribute("class", "botUI")

    // create id display
    const idRow = document.createElement("div")
    idRow.setAttribute("class", "botUIRow")
    const idDisplay = document.createElement("div")
    idDisplay.setAttribute("class", "textDisplay")
    idDisplay.textContent = `Name: ${id}`
    idRow.appendChild(idDisplay)
    botWindow.appendChild(idRow)

    // create class display
    const classRow = document.createElement("div")
    classRow.setAttribute("class", "botUIRow")
    const classDisplay = document.createElement("div")
    classDisplay.setAttribute("class", "textDisplay")
    classDisplay.textContent = `Class: ${data.character.ctype}`
    classRow.appendChild(classDisplay)
    classDisplay.id = `${id}_Class`
    botWindow.appendChild(classRow)

    // create level display
    const levelRow = document.createElement("div")
    levelRow.setAttribute("class", "botUIRow")
    const levelDisplay = document.createElement("div")
    levelDisplay.setAttribute("class", "textDisplay")
    levelDisplay.id = `${id}_Level`
    levelDisplay.textContent = `Level: ${data.character.level}`
    levelRow.appendChild(levelDisplay)
    botWindow.appendChild(levelRow)

    // create health display
    const healthRow = document.createElement("div")
    healthRow.setAttribute("class", "botUIRow")
    const healthBG = document.createElement("div")
    healthBG.setAttribute("class", "statbar")
    const healthBar = document.createElement("div")
    healthBar.setAttribute("class", "hpbar")
    healthBar.id = `${id}_HP`
    healthBar.style.width = ((data.character.hp / data.character.max_hp) * 100).toFixed(2) + "%"
    const healthText = document.createElement("div")
    healthText.id = `${id}_HP_Info`
    healthText.setAttribute("class", "barlabel")
    healthText.textContent = `${data.character.hp.toLocaleString("en-US")} / ${data.character.max_hp.toLocaleString("en-US")} (${healthBar.style.width})`
    healthRow.appendChild(healthBG)
    healthBG.appendChild(healthBar)
    healthBG.appendChild(healthText)
    botWindow.appendChild(healthRow)

    // create mana display
    const manaRow = document.createElement("div")
    manaRow.setAttribute("class", "botUIRow")
    const manaBG = document.createElement("div")
    manaBG.setAttribute("class", "statbar")
    const manaBar = document.createElement("div")
    manaBar.setAttribute("class", "mpbar")
    manaBar.id = `${id}_MP`
    manaBar.style.width = `${((data.character.mp / data.character.max_mp) * 100).toFixed(2)}%`
    const manaText = document.createElement("div")
    manaText.id = `${id}_MP_Info`
    manaText.setAttribute("class", "barlabel")
    manaText.textContent = `${data.character.mp.toLocaleString("en-US")} / ${data.character.max_mp.toLocaleString("en-US")} (${manaBar.style.width})`
    manaRow.appendChild(manaBG)
    manaBG.appendChild(manaBar)
    manaBG.appendChild(manaText)
    botWindow.appendChild(manaRow)

    // create exp display
    const expRow = document.createElement("div")
    expRow.setAttribute("class", "botUIRow")
    const expBG = document.createElement("div")
    expBG.setAttribute("class", "statbar")
    const expBar = document.createElement("div")
    expBar.setAttribute("class", "xpbar")
    expBar.id = `${id}_XP`
    const max_xp = G.levels[data.character.level]
    expBar.style.width = `${((data.character.xp / max_xp) * 100).toFixed(2)}%`
    const expText = document.createElement("div")
    expText.id = `${id}_XP_Info`
    expText.setAttribute("class", "barlabel")
    expText.textContent = `${data.character.xp.toLocaleString("en-US")} / ${max_xp.toLocaleString("en-US")} (${expBar.style.width})`
    expRow.appendChild(expBG)
    expBG.appendChild(expBar)
    expBG.appendChild(expText)
    botWindow.appendChild(expRow)

    // create gold display
    const goldRow = document.createElement("div")
    goldRow.setAttribute("class", "botUIRow")
    const goldDisplay = document.createElement("div")
    goldDisplay.setAttribute("class", "textDisplay")
    goldRow.appendChild(goldDisplay)
    const goldLabel = document.createElement("div")
    goldLabel.setAttribute("class", "textDisplayLabel")
    goldLabel.textContent = "Gold: "
    goldDisplay.appendChild(goldLabel)
    const goldValue = document.createElement("div")
    goldValue.setAttribute("class", "textDisplayValue gold")
    goldValue.id = `${id}_Gold`
    goldValue.textContent = data.inventory.gold.toLocaleString("en-US")
    goldDisplay.appendChild(goldValue)
    botWindow.appendChild(goldRow)

    // create map display
    const mapRow = document.createElement("div")
    mapRow.setAttribute("class", "botUIRow")
    const mapDisplay = document.createElement("div")
    mapDisplay.setAttribute("class", "textDisplay")
    mapDisplay.id = `${id}_Map`
    mapDisplay.textContent = `Map: { ${data.map.map}: ${data.map.x.toFixed(2)}, ${data.map.y.toFixed(2)} }`
    mapRow.appendChild(mapDisplay)
    botWindow.appendChild(mapRow)

    // create server display
    const serverRow = document.createElement("div")
    serverRow.setAttribute("class", "botUIRow")
    const serverDisplay = document.createElement("div")
    serverDisplay.setAttribute("class", "textDisplay")
    serverDisplay.id = `${id}_Server`
    serverDisplay.textContent = `Server: ${data.server.region} ${data.server.ident}`
    serverRow.appendChild(serverDisplay)
    botWindow.appendChild(serverRow)

    // create inventory button
    const invRow = document.createElement("div")
    invRow.setAttribute("class", "botUIRow")
    const invButton = document.createElement("div")
    invButton.id = `${id}_Inv`
    invButton.setAttribute("class", "button")
    const invText = document.createTextNode("Inventory")
    invButton.appendChild(invText)
    invRow.appendChild(invButton)
    botWindow.appendChild(invRow)
    invDisplayed.set(id, false)
    // on click, display inventory and equipment
    invButton.onclick = () => {
        invButtonClick(id, data.inventory)
    }

    // create status info button
    const statusRow = document.createElement("div")
    statusRow.setAttribute("class", "botUIRow")
    const statusButton = document.createElement("div")
    statusButton.id = `${id}_Status`
    statusButton.setAttribute("class", "collapsible")
    const statusText = document.createTextNode("Status Info")
    statusButton.appendChild(statusText)
    statusButton.onclick = () => {
        statusButton.classList.toggle("active")
        const content = document.getElementById(`${id}_statuscontent`)
        if (content.style.display === "inline-block") content.style.display = "none"
        else content.style.display = "inline-block"
    }
    statusRow.appendChild(statusButton)
    botWindow.appendChild(statusRow)

    // create status info
    const statusInfo = document.createElement("div")
    statusInfo.setAttribute("class", "collapsiblecontent")
    statusInfo.id = `${id}_statuscontent`
    statusRow.appendChild(statusInfo)
    displayConditions(data.character.s, statusInfo)

    // add Bot UI to UI Container
    UIContainer.appendChild(botWindow)
})

socket.on("player", (id: string, data: CharacterUIData): void => {
    const classEle = document.getElementById(`${id}_Class`)
    classEle.textContent = `Class: ${data.ctype}`

    const levelEle = document.getElementById(`${id}_Level`)
    levelEle.textContent = `Level: ${data.level}`

    const hpBarEle = document.getElementById(`${id}_HP`)
    hpBarEle.style.width = `${((data.hp / data.max_hp) * 100).toFixed(2)}%`

    const hpBarInfoEle = document.getElementById(`${id}_HP_Info`)
    hpBarInfoEle.textContent = `${data.hp.toLocaleString("en-US")} / ${data.max_hp.toLocaleString("en-US")} (${hpBarEle.style.width})`

    const mpBarEle = document.getElementById(`${id}_MP`)
    mpBarEle.style.width = `${((data.mp / data.max_mp) * 100).toFixed(2)}%`

    const mpBarInfoEle = document.getElementById(`${id}_MP_Info`)
    mpBarInfoEle.textContent = `${data.mp.toLocaleString("en-US")} / ${data.max_mp.toLocaleString("en-US")} (${mpBarEle.style.width})`

    const xpBarEle = document.getElementById(`${id}_XP`)
    const max_xp = G.levels[data.level]
    xpBarEle.style.width = `${((data.xp / max_xp) * 100).toFixed(2)}%`

    const xpBarInfoEle = document.getElementById(`${id}_XP_Info`)
    xpBarInfoEle.textContent = `${data.xp.toLocaleString("en-US")} / ${max_xp.toLocaleString("en-US")} (${xpBarEle.style.width})`

    const statusInfoEle = document.getElementById(`${id}_statuscontent`)
    while (statusInfoEle.childElementCount > 0) {
        statusInfoEle.removeChild(statusInfoEle.children[0])
    }
    displayConditions(data.s, statusInfoEle)
})

socket.on("map", (id: string, data: MapData): void => {
    const mapEle = document.getElementById(`${id}_Map`)
    mapEle.textContent = `Map: { ${data.map}: ${data.x.toFixed(2)}, ${data.y.toFixed(2)} }`
})

socket.on("inventory", (id: string, data: InventoryData): void => {
    const goldEle = document.getElementById(`${id}_Gold`)
    goldEle.textContent = data.gold.toLocaleString("en-US")

    if (invDisplayed.get(id)) {
        updateEquipment(data.equipment)
        updateInventory(data.items)
    } else {
        const invButton = document.getElementById(`${id}_Inv`)
        invButton.onclick = () => {
            invButtonClick(id, data)
        }
    }
})

socket.on("bank", (data: BankInfo): void => {
    bankCache = data
    currentTotalPacks = Object.keys(data).length - 1
    const cont = document.getElementById("bankUIContainer")
    displayBank(data, cont)
})

function displayConditions(data: StatusInfo, ele: HTMLElement): void {
    const statCont = document.createElement("div")
    statCont.setAttribute("class", "statContainer")
    ele.appendChild(statCont)
    if ("typing" in data) {
        delete data.typing
    }
    const conditions = Object.keys(data)
    const numConditions = conditions.length
    let row: HTMLElement
    for (let i = 0; i < numConditions; i++) {
        if (i % 6 == 0) {
            row = document.createElement("div")
            statCont.appendChild(row)
        }
        const slot = document.createElement("div")
        slot.setAttribute("class", "itemslot")
        row.appendChild(slot)
        const border = document.createElement("div")
        border.setAttribute("class", "itemborder")
        slot.appendChild(border)
        const frame = document.createElement("div")
        frame.setAttribute("class", "itemframe")
        border.appendChild(frame)
        const cond = conditions[i] as ConditionName
        const img = document.createElement("img")
        const pos = getConditionPos(cond)
        const src = getImgSrc(pos[0])
        img.src = src
        const imgData = G.images[src.replace("./", "/")]
        const width = imgData.width * 2
        const height = imgData.height * 2
        const offLeft = -(pos[1] * 40)
        const offTop = -(pos[2] * 40)
        img.style.width = `${width}px`
        img.style.height = `${height}px`
        img.style.marginTop = `${offTop}px`
        img.style.marginLeft = `${offLeft}px`
        frame.appendChild(img)
        const tooltip = document.createElement("div")
        tooltip.setAttribute("class", "iteminfo")
        frame.appendChild(tooltip)
        const namerow = document.createElement("div")
        namerow.setAttribute("class", "smalltextdisplay")
        try {
            namerow.textContent = G.conditions[cond].name
        } catch {
            namerow.textContent = cond as string
        }
        tooltip.appendChild(namerow)
        const conData = data[cond]
        if ("f" in conData) {
            const fromRow = document.createElement("div")
            fromRow.setAttribute("class", "smalltextdisplay")
            fromRow.textContent = `From: ${conData.f}`
            tooltip.appendChild(fromRow)
        }
        if ("strong" in conData) {
            const strongRow = document.createElement("div")
            strongRow.setAttribute("class", "smalltextdisplay")
            strongRow.textContent = `Strong: ${conData.strong}`
            tooltip.appendChild(strongRow)
        }
        if ("id" in conData && "c" in conData) {
            const targetRow = document.createElement("div")
            targetRow.setAttribute("class", "smalltextdisplay")
            targetRow.textContent = `Target: ${conData.id}`
            tooltip.appendChild(targetRow)
            const countRow = document.createElement("div")
            countRow.setAttribute("class", "smalltextdisplay")
            countRow.textContent = `Count: ${conData.c}`
            tooltip.appendChild(countRow)
        }
        if ("ms" in conData) {
            const msRow = document.createElement("div")
            msRow.setAttribute("class", "smalltextdisplay")
            msRow.textContent = `MS: ${conData.ms}`
            tooltip.appendChild(msRow)
        }
    }
}

function getConditionPos(cond: ConditionName): [string, number, number] {
    try {
        const data = G.conditions[cond]
        const skin = (data.skin == "condition_positive") ? "condition_good" : ((data.skin == "condition_negative") ? "condition_bad" : data.skin)
        return G.positions[skin] as [string, number, number]
    } catch {
        console.log(`ConditionName: ${cond}`)
        return G.positions["placeholder"] as [string, number, number]
    }
}

function invButtonClick(id: string, data: InventoryData): void {
    invDisplayed.set(id, true)
    const modal = document.createElement("div")
    modal.setAttribute("class", "modal")
    modal.onclick = () => {
        invDisplayed.set(id, false)
        modal.parentElement.removeChild(modal)
    }
    const emodal = document.createElement("div")
    emodal.setAttribute("class", "emodal")
    modal.appendChild(emodal)
    displayEquipment(data.equipment, emodal)
    const imodal = document.createElement("div")
    imodal.setAttribute("class", "imodal")
    modal.appendChild(imodal)
    displayInventory(data.items, imodal)
    document.body.appendChild(modal)
}

function getImgSrc(file: string): string {
    if (file == "") {
        return "./images/tiles/items/pack_20vt8.png"
    } else if (file == "skills") {
        return "./images/tiles/items/skills_20v6.png"
    } else {
        return `./images/tiles/items/${file}.png`
    }
}

function displayEmptySlot(type: SlotType, row: HTMLElement): void {
    const slot = document.createElement("div")
    slot.setAttribute("class", "emptyslot")
    row.appendChild(slot)
    const border = document.createElement("div")
    border.setAttribute("class", "equipborder")
    slot.appendChild(border)
    const frame = document.createElement("div")
    frame.setAttribute("class", "itemframe")
    border.appendChild(frame)
    const img = document.createElement("img")
    img.src = "./images/tiles/items/pack_20vt8.png"
    switch (type) {
        case "amulet":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -480px; opacity: 0.4;")
            break
        case "belt":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -120px; margin-left: -160px; opacity: 0.4;")
            break
        case "cape":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -240px; margin-left: -160px; opacity: 0.4;")
            break
        case "chest":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -40px; margin-left: -240px; opacity: 0.4;")
            break
        case "earring1":
        case "earring2":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -680px; margin-left: -200px; opacity: 0.4;")
            break
        case "elixir":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1080px; margin-left: -0px; opacity: 0.4;")
            break
        case "gloves":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -80px; margin-left: -400px; opacity: 0.4;")
            break
        case "helmet":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -0px; opacity: 0.5;")
            break
        case "mainhand":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -200px; opacity: 0.36;")
            break
        case "offhand":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -240px; opacity: 0.4;")
            break
        case "orb":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1000px; margin-left: -80px; opacity: 0.4;")
            break
        case "pants":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -80px; opacity: 0.5;")
            break
        case "ring1":
        case "ring2":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -520px; opacity: 0.4;")
            break
        case "shoes":
            img.setAttribute("style", "width: 640px; height: 2560px; margin-top: -1240px; margin-left: -120px; opacity: 0.5;")
            break
    }
    frame.appendChild(img)
}

function displayEquipmentSlot(equip: ItemData, row: HTMLElement): void {
    const slot = document.createElement("div")
    slot.setAttribute("class", "itemslot")
    row.appendChild(slot)
    const border = document.createElement("div")
    border.setAttribute("class", "equipborder")
    slot.appendChild(border)
    const frame = document.createElement("div")
    frame.setAttribute("class", "itemframe")
    border.appendChild(frame)
    displayItem(equip, frame, true)
}

function displayEquipment(slots: SlotInfo, ele: HTMLElement): void {
    const equipContain = document.createElement("div")
    equipContain.setAttribute("class", "equipContainer")
    equipContain.id = "equipmentContainer"
    ele.appendChild(equipContain)
    const row1 = document.createElement("div")
    equipContain.appendChild(row1)
    const earring1 = slots.earring1
    if (!earring1) {
        displayEmptySlot("earring1", row1)
    } else {
        displayEquipmentSlot(earring1, row1)
    }
    const helmet = slots.helmet
    if (!helmet) {
        displayEmptySlot("helmet", row1)
    } else {
        displayEquipmentSlot(helmet, row1)
    }
    const earring2 = slots.earring2
    if (!earring2) {
        displayEmptySlot("earring2", row1)
    } else {
        displayEquipmentSlot(earring2, row1)
    }
    const amulet = slots.amulet
    if (!amulet) {
        displayEmptySlot("amulet", row1)
    } else {
        displayEquipmentSlot(amulet, row1)
    }
    const row2 = document.createElement("div")
    equipContain.appendChild(row2)
    const weapon = slots.mainhand
    if (!weapon) {
        displayEmptySlot("mainhand", row2)
    } else {
        displayEquipmentSlot(weapon, row2)
    }
    const armor = slots.chest
    if (!armor) {
        displayEmptySlot("chest", row2)
    } else {
        displayEquipmentSlot(armor, row2)
    }
    const shield = slots.offhand
    if (!shield) {
        displayEmptySlot("offhand", row2)
    } else {
        displayEquipmentSlot(shield, row2)
    }
    const cape = slots.cape
    if (!cape) {
        displayEmptySlot("cape", row2)
    } else {
        displayEquipmentSlot(cape, row2)
    }
    const row3 = document.createElement("div")
    equipContain.appendChild(row3)
    const ring1 = slots.ring1
    if (!ring1) {
        displayEmptySlot("ring1", row3)
    } else {
        displayEquipmentSlot(ring1, row3)
    }
    const pants = slots.pants
    if (!pants) {
        displayEmptySlot("pants", row3)
    } else {
        displayEquipmentSlot(pants, row3)
    }
    const ring2 = slots.ring2
    if (!ring2) {
        displayEmptySlot("ring2", row3)
    } else {
        displayEquipmentSlot(ring2, row3)
    }
    const orb = slots.orb
    if (!orb) {
        displayEmptySlot("orb", row3)
    } else {
        displayEquipmentSlot(orb, row3)
    }
    const row4 = document.createElement("div")
    equipContain.appendChild(row4)
    const belt = slots.belt
    if (!belt) {
        displayEmptySlot("belt", row4)
    } else {
        displayEquipmentSlot(belt, row4)
    }
    const shoes = slots.shoes
    if (!shoes) {
        displayEmptySlot("shoes", row4)
    } else {
        displayEquipmentSlot(shoes, row4)
    }
    const gloves = slots.gloves
    if (!gloves) {
        displayEmptySlot("gloves", row4)
    } else {
        displayEquipmentSlot(gloves, row4)
    }
    const elixir = slots.elixir
    if (!elixir) {
        displayEmptySlot("elixir", row4)
    } else {
        displayEquipmentSlot(elixir, row4)
    }
}

function displayItem(item: ItemData, ele: HTMLElement, equip = false): void {
    const itemSkin = G.items[item.name].skin
    const itemPos = G.positions[itemSkin] as [string, number, number]
    const itemFile = getImgSrc(itemPos[0])
    const img = document.createElement("img")
    img.setAttribute("src", itemFile)
    const imgData = G.images[itemFile.replace("./", "/")]
    const width = imgData.width * 2
    const height = imgData.height * 2
    const itemLeft = -(itemPos[1] * 40)
    const itemTop = -(itemPos[2] * 40)
    img.style.width = `${width}px`
    img.style.height = `${height}px`
    img.style.marginTop = `${itemTop}px`
    img.style.marginLeft = `${itemLeft}px`
    ele.style.cursor = "help"
    ele.appendChild(img)
    if (item.q && item.q > 1) {
        const iq = document.createElement("div")
        let iqStyle = "border: 2px solid gray; background: black; padding: 1px 2px 1px 3px; position: absolute; right: -2px; bottom: -2px; text-align: center; line-height: 16px; font-size: 24px; height: 16px;"
        if (item.name.includes("hp")) iqStyle += " color: #F37A87;"
        else if (item.name.includes("mp")) iqStyle += " color: #66B3F6;"
        iq.setAttribute("style", iqStyle)
        iq.textContent = item.q.toString(10)
        ele.appendChild(iq)
    }
    if (item.level && item.level > 0) {
        const il = document.createElement("div")
        il.setAttribute("class", "itemlevel")
        if (equip) {
            il.style.left = "0px"
            il.style.bottom = "0px"
        } else {
            il.style.left = "-2px"
            il.style.bottom = "-2px"
        }
        il.textContent = item.level.toString(10)
        ele.appendChild(il)
    }
    const tooltip = document.createElement("div")
    tooltip.setAttribute("class", "iteminfo")
    ele.appendChild(tooltip)
    const namerow = document.createElement("div")
    namerow.setAttribute("class", "smalltextdisplay")
    namerow.textContent = getName(item)
    tooltip.appendChild(namerow)
}

function getName(item: ItemData): string {
    const name = G.items[item.name].name
    let fixedName = name
    if (item.p) {
        const pstr = item.p[0].toUpperCase() + item.p.substring(1)
        fixedName = pstr + " " + fixedName
    }
    if (item.level && item.level > 0) {
        fixedName = fixedName + " +" + item.level.toString(10)
    }
    return fixedName
}

function displayInventory(items: ItemData[], ele: HTMLElement): void {
    const invContain = document.createElement("div")
    invContain.setAttribute("class", "invContainer")
    invContain.id = "inventoryContainer"
    ele.appendChild(invContain)
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("div")
        invContain.appendChild(row)
        for (let j = 0; j < 7; j++) {
            const itemNum = (i * 7) + j
            const slot = document.createElement("div")
            slot.setAttribute("class", "itemslot")
            row.appendChild(slot)
            const border = document.createElement("div")
            border.setAttribute("class", "itemborder")
            slot.appendChild(border)
            const frame = document.createElement("div")
            frame.setAttribute("class", "itemframe")
            frame.id = `frame_${itemNum}`
            border.appendChild(frame)
            const item = items[itemNum]
            if (!item) continue
            displayItem(item, frame)
        }
    }
}

function updateEquipment(data: SlotInfo): void {
    const cont = document.getElementById("equipmentContainer")
    const parent = cont.parentElement
    parent.removeChild(cont)
    displayEquipment(data, parent)
}

function updateInventory(data: ItemData[]): void {
    const cont = document.getElementById("inventoryContainer")
    const parent = cont.parentElement
    parent.removeChild(cont)
    displayInventory(data, parent)
}

function displayBank(data: BankInfo, ele: HTMLElement): void {
    ele.textContent = ""
    while (ele.childElementCount > 0) {
        ele.removeChild(ele.children[0])
    }
    const leftArrow = document.createElement("div")
    leftArrow.setAttribute("class", "packleft")
    const leftImg = document.createElement("img")
    leftImg.src = "./images/arrowleft.png"
    leftImg.style.padding = "4px"
    leftArrow.appendChild(leftImg)
    leftArrow.onclick = () => {
        currentPackNum--
        if (currentPackNum < 0) {
            currentPackNum = currentTotalPacks - 1
        }
        displayBank(data, ele)
    }
    ele.appendChild(leftArrow)
    const bankUI = document.createElement("div")
    bankUI.setAttribute("class", "bankui")
    ele.appendChild(bankUI)
    const rightArrow = document.createElement("div")
    rightArrow.setAttribute("class", "packright")
    const rightImg = document.createElement("img")
    rightImg.src = "./images/arrowright.png"
    rightImg.style.padding = "4px"
    rightArrow.appendChild(rightImg)
    rightArrow.onclick = () => {
        currentPackNum++
        if (currentPackNum >= currentTotalPacks) {
            currentPackNum = 0
        }
        displayBank(data, ele)
    }
    ele.appendChild(rightArrow)
    const goldcell = document.createElement("div")
    goldcell.setAttribute("class", "p4px")
    bankUI.appendChild(goldcell)
    const goldDisplay = document.createElement("div")
    goldDisplay.setAttribute("class", "textDisplay")
    goldcell.appendChild(goldDisplay)
    const goldLabel = document.createElement("div")
    goldLabel.setAttribute("class", "textDisplayLabel")
    goldLabel.textContent = "Gold: "
    goldDisplay.appendChild(goldLabel)
    const goldValue = document.createElement("div")
    goldValue.setAttribute("class", "textDisplayValue gold")
    goldValue.textContent = data.gold.toLocaleString("en-US")
    goldDisplay.appendChild(goldValue)
    const div = document.createElement("div")
    div.setAttribute("class", "border")
    bankUI.appendChild(div)
    const packdisplay = document.createElement("div")
    packdisplay.setAttribute("class", "pack")
    bankUI.appendChild(packdisplay)
    const pack = `items${currentPackNum}` as BankPackName
    displayBankPack(data[pack], packdisplay)
}

function displayBankPack(data: ItemData[], ele: HTMLElement): void {
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("div")
        ele.appendChild(row)
        for (let j = 0; j < 7; j++) {
            const num = (i * 7) + j
            const slot = document.createElement("div")
            slot.setAttribute("class", "itemslot")
            row.appendChild(slot)
            const border = document.createElement("div")
            border.setAttribute("class", "itemborder")
            slot.appendChild(border)
            const frame = document.createElement("div")
            frame.setAttribute("class", "itemframe")
            border.appendChild(frame)
            const item = data[num]
            if (!item) continue
            displayItem(item, frame)
        }
    }
}