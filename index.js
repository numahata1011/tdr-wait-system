const fs = require('fs');

(async () => {
    try {
        const destRes = await fetch('https://api.themeparks.wiki/v1/destinations');
        const destData = await destRes.json();
        const resort = destData.destinations.find(d => d.name.toLowerCase().includes('tokyo'));
        if (!resort) throw new Error("Resort 'Tokyo' not found.");

        const childrenRes = await fetch(`https://api.themeparks.wiki/v1/entity/${resort.id}/children`);
        const childrenData = await childrenRes.json();
        const targetParks = childrenData.children.filter(c =>
            c.name.toLowerCase().includes('disneyland') || c.name.toLowerCase().includes('disneysea')
        );

        // --- 論理修正1：実行ごとに一意のIDと、全データ共通の時刻を生成 ---
        const runId = process.env.GITHUB_RUN_ID || "manual-" + Date.now();
        const d = new Date();
        const jstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000));
        const timestamp = jstDate.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '/');

        let allAttractions = [];
        for (const park of targetParks) {
            const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${park.id}/live`);
            const liveData = await liveRes.json();
            const parkType = park.name.toLowerCase().includes('disneyland') ? 'TDL' : 'TDS';

            const attractions = liveData.liveData.map(ride => ({
                park: parkType,
                name: ride.name,
                waitTime: (ride.queue && ride.queue.STANDBY) ? (ride.queue.STANDBY.waitTime || 0) : -1,
                status: ride.status,
                updateTime: timestamp, // 全データ共通
                run_id: runId          // 判定用の絶対的なキー
            }));
            allAttractions = allAttractions.concat(attractions);
        }

        fs.writeFileSync("tdr_status.json", JSON.stringify(allAttractions, null, 2));
        console.log(`Success: RunID ${runId}`);
    } catch (e) {
        process.exit(1);
    }
})();