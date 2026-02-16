const fs = require('fs');

(async () => {
    try {
        console.log("1. Fetching global destinations...");
        // ライブラリを使わず、直接APIを叩く
        const destRes = await fetch('https://api.themeparks.wiki/v1/destinations');
        const destData = await destRes.json();

        // "Tokyo" を含むリゾート（目的地）を探す
        const resort = destData.destinations.find(d => d.name.includes('Tokyo Disney') || d.slug.includes('tokyo'));

        if (!resort) {
            // 見つからない場合は、何が見えているか全てログに出して終了（デバッグ用）
            throw new Error("Resort not found. Available: " + destData.destinations.map(d => d.name).join(", "));
        }
        console.log(`   Found Resort: ${resort.name} (ID: ${resort.id})`);

        console.log("2. Fetching resort children (Parks)...");
        // リゾートIDを使って、その中にあるパーク一覧を取得
        const childrenRes = await fetch(`https://api.themeparks.wiki/v1/entity/${resort.id}/children`);
        const childrenData = await childrenRes.json();

        // "Disneyland" を含むパークを特定
        const park = childrenData.children.find(c => c.name.includes('Disneyland') || c.name.includes('Magic Kingdom'));

        if (!park) {
            throw new Error("Resort found, but Park not found. Children: " + childrenData.children.map(c => c.name).join(", "));
        }
        console.log(`   Found Park: ${park.name} (ID: ${park.id})`);

        console.log("3. Fetching wait times...");
        // パークIDを使って、リアルタイムデータを取得
        const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${park.id}/live`);
        const liveData = await liveRes.json();

        // データの整形
        const simpleData = liveData.liveData.map(ride => {
            // 待ち時間（存在しない場合は0）
            const waitTime = (ride.queue && ride.queue.STANDBY) ? ride.queue.STANDBY.waitTime : 0;
            return {
                name: ride.name,
                waitTime: waitTime !== null ? waitTime : -1,
                status: ride.status,
                updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
            };
        });

        // 保存
        fs.writeFileSync("tdl_status.json", JSON.stringify(simpleData, null, 2));
        console.log(`Success: Saved ${simpleData.length} attractions.`);

    } catch (e) {
        console.error("Critical Error:", e.message);
        process.exit(1);
    }
})();