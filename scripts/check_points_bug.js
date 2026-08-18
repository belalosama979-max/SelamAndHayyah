import fs from 'fs';

function checkPoints() {
  const dbStr = fs.readFileSync('./fixed_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const players = db.aqsa_game_players?.value || [];
  const reqs = db.aqsa_game_prize_requests?.value || [];

  const check = (name) => {
    const p = players.find(x => x.name && x.name.includes(name));
    if (p) {
      console.log(`\nPlayer: ${p.name}`);
      console.log(`rewardPoints in DB: ${p.rewardPoints}`);
      console.log(`totalSpent in DB: ${p.totalSpent}`);
      
      const pReqs = reqs.filter(r => r.playerId === p.id && r.status !== 'rejected' && r.status !== 'cancelled');
      const calculatedSpent = pReqs.reduce((sum, r) => sum + (r.pointsUsed || 0), 0);
      console.log(`Calculated Spent from Requests: ${calculatedSpent}`);
      
      console.log(`Requests:`);
      pReqs.forEach(r => console.log(` - ${r.rewardName || r.rewardSnapshot?.name} (${r.status}): ${r.pointsUsed} points`));
    } else {
      console.log(`\nPlayer containing '${name}' not found.`);
    }
  }

  check('المناصير');
  check('أسامة طب');
  check('تيم عبده');
}

checkPoints();
