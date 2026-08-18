import fs from 'fs';

function runAudit() {
  const dbStr = fs.readFileSync('./backup_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const players = db.aqsa_game_players?.value || [];
  const requests = db.aqsa_game_prize_requests?.value || [];

  const taym = players.find(p => p.name && p.name.includes('تيم عبده'));
  const totanji = players.find(p => p.name && p.name.includes('التوتنجي'));

  console.log("=== تيم عبده Requests ===");
  if (taym) {
    const taymReqs = requests.filter(r => r.playerId === taym.id);
    taymReqs.forEach(r => {
      console.log(`- Prize: ${r.rewardSnapshot?.name || r.rewardName || r.rewardId}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Created: ${r.createdAt}`);
      console.log(`  Updated: ${r.updatedAt}`);
      if (r.deliveredAt) console.log(`  Delivered: ${r.deliveredAt}`);
      console.log('---------------------------');
    });
  }

  console.log("\n=== عبدالرحمن التوتنجي Requests ===");
  if (totanji) {
    const totanjiReqs = requests.filter(r => r.playerId === totanji.id);
    totanjiReqs.forEach(r => {
      console.log(`- Prize: ${r.rewardSnapshot?.name || r.rewardName || r.rewardId}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Created: ${r.createdAt}`);
      console.log(`  Updated: ${r.updatedAt}`);
      if (r.deliveredAt) console.log(`  Delivered: ${r.deliveredAt}`);
      console.log('---------------------------');
    });
  }

  // Find all rejected requests across the system and see if they share exact updatedAt times
  const rejected = requests.filter(r => r.status === 'rejected');
  const timeMap = {};
  rejected.forEach(r => {
    const t = r.updatedAt;
    if (!timeMap[t]) timeMap[t] = [];
    timeMap[t].push(r);
  });

  console.log("\n=== Bulk Rejections Analysis ===");
  Object.keys(timeMap).forEach(t => {
    if (timeMap[t].length > 1) {
      console.log(`Time: ${t} -> ${timeMap[t].length} requests rejected simultaneously`);
    }
  });

}

runAudit();
