const Themeparks = require("themeparks");
const fs = require("fs");

// 新しい仕様: APIクライアントを作成
const destinationsApi = new Themeparks.DestinationsApi();
const entitiesApi = new Themeparks.EntitiesApi();

(async () => {
    try {
        console.log("Connecting to ThemeParks.wiki API...");

        // 1. 世界中のパーク一覧を取得
        const dests = await destinationsApi.getDestinations();

        // 2. "Tokyo Disneyland" を検索してIDを特定
        // ※ 検索に失敗しないよう、柔軟に探すロジックにしています
        const tdl = dests.destinations.find(d => d.slug === "tokyo-disneyland" || d.name.includes("Tokyo Disneyland"));

        if (!tdl) {
            console.error("Error: Tokyo Disneyland ID not found in API.");
            process.exit(1);
        }

        console.log(`Target Park Found: ${tdl.name} (ID: ${tdl.id})`);

        // 3. そのIDを使って、現在の運行状況（Live Data）を取得
        const liveDataResponse = await entitiesApi.getEntityLiveData(tdl.id);
        const liveData = liveDataResponse.liveData;

        // 4. データ整形（ブログ用にシンプルにする）
        const simpleData = liveData.map(ride => {
            // 待ち時間の抽出（スタンバイがない場合は0にする）
            const waitTime = (ride.queue && ride.queue.STANDBY) ? ride.queue.STANDBY.waitTime : 0;

            return {
                name: ride.name,
                waitTime: waitTime !== null ? waitTime : -1, // -1は休止やデータなし
                status: ride.status,
                updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            };
        });

        // 5. JSONファイル保存
        fs.writeFileSync("tdl_status.json", JSON.stringify(simpleData, null, 2));
        console.log(`Success: Saved ${simpleData.length} attractions to tdl_status.json`);

    } catch (error) {
        console.error("Critical Error:", error);
        process.exit(1);
    }
})();