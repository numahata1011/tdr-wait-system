const Themeparks = require("themeparks");
const fs = require("fs");

const DisneyTokyo = new Themeparks.Parks.TokyoDisneyResortTokyoDisneyland();

(async () => {
    try {
        console.log("Fetching data...");
        const waitTimes = await DisneyTokyo.GetWaitTimes();

        const simpleData = waitTimes.map(ride => ({
            name: ride.name,
            waitTime: ride.waitTime !== null ? ride.waitTime : -1,
            status: ride.status,
            updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        }));

        fs.writeFileSync("tdl_status.json", JSON.stringify(simpleData, null, 2));
        console.log("Success: Data saved.");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
})();