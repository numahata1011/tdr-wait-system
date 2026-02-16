const Themeparks = require("themeparks");
const fs = require("fs");

// 【修正ポイント】ライブラリの構造が変わっても動くように、Parksの場所を自動判別する
let Parks;
if (Themeparks.Parks) {
    Parks = Themeparks.Parks;
} else if (Themeparks.default && Themeparks.default.Parks) {
    Parks = Themeparks.default.Parks;
} else {
    // 万が一どちらでもない場合は、中身をログに出して強制終了（デバッグ用）
    console.error("Library loading failed. Structure:", JSON.stringify(Themeparks, null, 2));
    process.exit(1);
}

// インスタンス作成
const DisneyTokyo = new Parks.TokyoDisneyResortTokyoDisneyland();

(async () => {
    try {
        console.log("Fetching data...");

        // 待ち時間取得
        const waitTimes = await DisneyTokyo.GetWaitTimes();

        // 必要なデータのみ抽出
        const simpleData = waitTimes.map(ride => ({
            name: ride.name,
            waitTime: ride.waitTime !== null ? ride.waitTime : -1, // 休止中は-1
            status: ride.status,
            updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
        }));

        // JSONファイル保存
        fs.writeFileSync("tdl_status.json", JSON.stringify(simpleData, null, 2));
        console.log("Success: Data saved to tdl_status.json");

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
})();