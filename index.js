const Themeparks = require("themeparks");
const fs = require("fs");

// デバッグ: ライブラリが認識しているパーク名の一覧を表示（ログで確認用）
// console.log("Available Parks:", Object.keys(Themeparks.Parks));

// 【修正箇所】正しいクラス名は "TokyoDisneyResortMagicKingdom" です
const DisneyTokyo = new Themeparks.Parks.TokyoDisneyResortMagicKingdom();

(async () => {
    try {
        console.log("Fetching data for Tokyo Disneyland...");

        // 待ち時間取得
        const waitTimes = await DisneyTokyo.GetWaitTimes();

        // データ整形
        const simpleData = waitTimes.map(ride => ({
            name: ride.name,
            waitTime: ride.waitTime !== null ? ride.waitTime : -1,
            status: ride.status,
            updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        }));

        // JSON保存
        fs.writeFileSync("tdl_status.json", JSON.stringify(simpleData, null, 2));
        console.log("Success: Data saved to tdl_status.json");

    } catch (error) {
        console.error("Error:", error);
        // エラー時にパーク一覧を出力してヒントにする
        if (Themeparks.Parks) {
            console.error("Did you mean one of these?:", Object.keys(Themeparks.Parks).filter(k => k.includes("Tokyo")));
        }
        process.exit(1);
    }
})();