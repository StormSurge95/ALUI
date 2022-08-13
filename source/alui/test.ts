import AL from "alclient"
import { addBot, startServer } from "./index.js"

async function run() {
    await AL.Game.loginJSONFile("./credentials.json")
    await startServer(8080)

    const merchant = await AL.Game.startMerchant("StormSurge", "US", "III")
    addBot(merchant.id, merchant.socket)
}

run()