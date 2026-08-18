import fs from 'fs';

function runAudit() {
  const dbStr = fs.readFileSync('./backup_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const rewards = db.aqsa_game_rewards?.value || [];
  const requests = db.aqsa_game_prize_requests?.value || [];

  console.log("=== Active Rewards ===");
  rewards.forEach(r => console.log(`${r.name} (ID: ${r.id})`));

  const taym = db.aqsa_game_players?.value.find(p => p.name && p.name.includes('تيم عبده'));
  if (taym) {
    console.log("\n=== تيم عبده Requests ===");
    requests.filter(r => r.playerId === taym.id).forEach(r => {
      console.log(`- Prize: ${r.rewardSnapshot?.name || r.rewardName} (RewardID: ${r.rewardId})`);
      console.log(`  Status: ${r.status}`);
    });
  }
}

runAudit();
