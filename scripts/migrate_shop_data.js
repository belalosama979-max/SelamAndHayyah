import fs from 'fs';

function migrate() {
  console.log("Starting Migration...");
  const db = JSON.parse(fs.readFileSync('./backup_db.json', 'utf8'));
  
  let players = db.aqsa_game_players?.value || [];
  const logs = db.aqsa_game_action_logs?.value || [];
  let requests = db.aqsa_game_prize_requests?.value || [];
  const cards = db.aqsa_game_cards?.value || [];
  const rewards = db.aqsa_game_rewards?.value || [];
  let rooms = db.aqsa_game_rooms?.value || [];

  // 1. Clean corrupted data
  const originalPlayersCount = players.length;
  players = players.filter(p => p && p.id && p.id !== 'undefined');
  console.log(`Removed ${originalPlayersCount - players.length} corrupted players.`);

  rooms = rooms.filter(r => r && r.id && r.id !== 'undefined');

  // Mapping cards to points
  const cardValueByName = {};
  cards.forEach(c => {
    if (c.value !== undefined && c.value !== null) {
      cardValueByName[c.name] = c.value;
    }
  });

  // Mapping rewards to their current prices
  const rewardCostById = {};
  const rewardNameById = {};
  rewards.forEach(r => {
    rewardCostById[r.id] = r.pointsCost;
    rewardNameById[r.id] = r.name;
  });

  // 2. Fix Prize Requests
  requests = requests.map(req => {
    let cost = req.rewardPriceAtPurchase;
    if (cost === undefined || cost === null) {
      cost = req.pointsUsed !== undefined ? req.pointsUsed : rewardCostById[req.rewardId];
    }
    cost = Number(cost) || 0;

    let rName = req.rewardName || rewardNameById[req.rewardId] || 'غير معروف';

    return {
      ...req,
      rewardPriceAtPurchase: cost,
      pointsUsed: cost,
      rewardName: rName,
      status: req.status || 'pending'
    };
  });

  // 3. Recalculate Points for each player
  const report = [];
  players = players.map(player => {
    const playerLogs = logs.filter(l => l.playerId === player.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let earnedPoints = 0;
    playerLogs.forEach(log => {
      let rawCardValue;
      if (log.cardValue !== undefined && log.cardValue !== null) {
        rawCardValue = log.cardValue;
      } else if (cardValueByName[log.cardName] !== undefined) {
        rawCardValue = cardValueByName[log.cardName];
      } else {
        rawCardValue = log.pointsApplied || 0;
      }
      
      const p = Math.max(0, rawCardValue);
      if (p > 0) {
        earnedPoints += p;
      }
    });

    const playerRequests = requests.filter(r => r.playerId === player.id);
    let spentPoints = 0;
    
    playerRequests.forEach(req => {
      if (req.status !== 'rejected' && req.status !== 'cancelled') {
        spentPoints += req.pointsUsed;
      }
    });

    const calculatedRewardPoints = Math.max(0, earnedPoints - spentPoints);

    report.push(`[${player.name}] Earned: ${earnedPoints}, Spent: ${spentPoints}, Final: ${calculatedRewardPoints}`);

    return {
      ...player,
      totalCollectedPoints: earnedPoints,
      totalSpent: spentPoints,
      rewardPoints: calculatedRewardPoints
    };
  });

  // Update the backup structure with fixed data
  db.aqsa_game_players.value = players;
  db.aqsa_game_rooms.value = rooms;
  db.aqsa_game_prize_requests.value = requests;
  db.aqsa_game_action_logs.value = logs; // untouched but keeping structure

  fs.writeFileSync('./fixed_db.json', JSON.stringify(db, null, 2));
  fs.writeFileSync('./migration_summary.txt', report.join('\n'));
  
  console.log('Migration completed. Generated fixed_db.json');
}

migrate();
