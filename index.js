const fs = require('fs');

(async () => {
    try {
        console.log("1. Fetching destinations...");
        const destRes = await fetch('https://api.themeparks.wiki/v1/destinations');
        const destData = await destRes.json();

        // "Tokyo" を名前に含むリゾートを検索（大文字小文字を区別しない）
        const resort = destData.destinations.find(d => d.name.toLowerCase().includes('tokyo'));

        if (!resort) {
            throw new Error("Resort 'Tokyo' not found in API.");
        }
        console.log(`   Found: ${resort.name} (ID: ${resort.id})`);

        console.log("2. Fetching parks in resort...");
        const childrenRes = await fetch(`https://api.themeparks.wiki/v1/entity/${resort.id}/children`);
        const childrenData = await childrenRes.json();

        // 「Disneyland」と「DisneySea」をキーワードで抽出
        const targetParks = childrenData.children.filter(c =>
            c.name.toLowerCase().includes('disneyland') || c.name.toLowerCase().includes('disneysea')
        );

        if (targetParks.length === 0) {
            throw new Error("No parks (TDL/TDS) found in this resort.");
        }

        let allAttractions = [];

        for (const park of targetParks) {
            console.log(`3. Fetching live data for: ${park.name}...`);
            const liveRes = await fetch(`https://api.themeparks.wiki/v1/entity/${park.id}/live`);
            const liveData = await liveRes.json();

            const parkType = park.name.toLowerCase().includes('disneyland') ? 'TDL' : 'TDS';

            const attractions = liveData.liveData.map(ride => {
                const waitTime = (ride.queue && ride.queue.STANDBY) ? ride.queue.STANDBY.waitTime : 0;
                return {
                    park: parkType,
                    name: ride.name,
                    waitTime: waitTime !== null ? waitTime : -1,
                    status: ride.status,
                    updateTime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
                };
            });
            allAttractions = allAttractions.concat(attractions);
        }

        fs.writeFileSync("tdl_status.json", JSON.stringify(allAttractions, null, 2));
        console.log(`Success: Saved ${allAttractions.length} attractions.`);

    } catch (e) {
        console.error("Critical Error:", e.message);
        process.exit(1);
    }
})();