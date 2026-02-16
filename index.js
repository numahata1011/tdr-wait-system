const fs = require('fs');

(async () => {
    try {
        console.log("1. Fetching global destinations...");
        // 世界のリゾート一覧を取得
        const destRes = await fetch('https://api.themeparks.wiki/v1/destinations');
        const destData = await destRes.json();

        // "Tokyo Disney Resort" を特定
        const resort = destData.destinations.find(d => d.slug === 'tokyo-disney-resort');

        if (!resort) {
            throw new Error("Tokyo Disney Resort not found.");
        }
        console.log(`   Found Resort: ${resort.name} (ID: ${resort.id})`);

        console.log("2. Fetching resort children (Parks)...");
        // リゾート内のパーク一覧を取得
        const childrenRes = await fetch(`https://api.themeparks.wiki/v1/entity/${resort.id}/children`);
        const childrenData = await childrenRes.json();

        // ランドとシーを抽出
        const targetParks = childrenData.children.filter(c =>
            c.slug === 'tokyo-disneyland' || c.slug === 'tokyo-disneysea'
        );

        console.log(`   Found ${targetParks.length} parks: ${targetParks.map(p => p.name).join(', ')}`);

        let allAttractions = [];

        // 3. 各パークのデータを取得
        for (const park of targetParks) {
            console.log(`   Fetching live data for: ${park.name}...`);
            const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${park.id}/live`);
            const liveData = await liveRes.json();

            // どちらのパークか判別するタグを作成 (TDL or TDS)
            const parkType = park.slug === 'tokyo-disneyland' ? 'TDL' : 'TDS';

            const attractions = liveData.liveData.map(ride => {
                // 待ち時間（nullなら-1、スタンバイがない場合は0）
                const waitTime = (ride.queue && ride.queue.STANDBY) ? ride.queue.STANDBY.waitTime : 0;

                return {
                    park: parkType, // ここでランドかシーか区別できるようにする
                    name: ride.name,
                    waitTime: waitTime !== null ? waitTime : -1,
                    status: ride.status,
                    updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                };
            });

            // 配列を結合
            allAttractions = allAttractions.concat(attractions);
        }

        // 4. まとめて保存
        fs.writeFileSync("tdl_status.json", JSON.stringify(allAttractions, null, 2));
        console.log(`Success: Saved total ${allAttractions.length} attractions (TDL & TDS).`);

    } catch (e) {
        console.error("Critical Error:", e.message);
        process.exit(1);
    }
})();