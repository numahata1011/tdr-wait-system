// 【修正点】ライブラリ全体を一度 "Themeparks" として読み込む（これが互換性の正解）
import Themeparks from 'themeparks';
import fs from 'fs';

// 中身を取り出す
const Parks = Themeparks.Parks;

// 万が一のための安全装置
if (!Parks) {
    console.error("Error: Parks not found. Dump:", Themeparks);
    process.exit(1);
}

// インスタンス作成
const DisneyTokyo = new Parks.TokyoDisneyResortTokyoDisneyland();

(async () => {
    try {
        console.log("Fetching data...");

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
        process.exit(1);
    }
})();