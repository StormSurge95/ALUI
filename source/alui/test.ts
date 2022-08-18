import AL from "alclient"
import { addBot, startServer } from "./index.js"

async function run() {
    await Promise.all([AL.Game.loginJSONFile("./credentials.json"), AL.Game.getGData(false, false)])
    startServer(8080)

    console.log("starting merchant...")
    const merchant = await AL.Game.startMerchant("StormSurge", "US", "III")
    addBot(merchant.id, merchant.socket, merchant)

    console.log("starting warrior...")
    const warrior = await AL.Game.startWarrior("WarriorSurge", "US", "III")
    addBot(warrior.id, warrior.socket, warrior)

    console.log("starting priest...")
    const priest = await AL.Game.startPriest("PriestSurge", "US", "III")
    addBot(priest.id, priest.socket, priest)

    console.log("starting mage...")
    const mage = await AL.Game.startMage("MageSurge", "US", "III")
    addBot(mage.id, mage.socket, mage)

    console.log("all characters loaded and added to server")
}

run()