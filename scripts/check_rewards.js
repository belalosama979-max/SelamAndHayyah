import fs from 'fs';

function checkRewards() {
  const dbStr = fs.readFileSync('./backup_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const rewards = db.aqsa_game_rewards?.value || [];
  const reqs = db.aqsa_game_prize_requests?.value || [];

  console.log("=== Active Rewards ===");
  rewards.forEach(r => console.log(r.name));

  const uniqueRequestedRewards = new Set();
  reqs.forEach(r => {
    if (r.rewardId) uniqueRequestedRewards.add(r.rewardSnapshot?.name || r.rewardName || r.rewardId);
  });

  console.log("\n=== Requested Rewards History ===");
  for (let r of uniqueRequestedRewards) {
    console.log(r);
  }
}

checkRewards();
