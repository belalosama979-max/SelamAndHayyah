import fs from 'fs';

function revert() {
  const dbStr = fs.readFileSync('./fixed_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const players = db.aqsa_game_players?.value || [];
  let requests = db.aqsa_game_prize_requests?.value || [];

  const taym = players.find(p => p.name && p.name.includes('تيم عبده'));
  const totanji = players.find(p => p.name && p.name.includes('التوتنجي'));

  const taymIds = taym ? [taym.id] : [];
  const totanjiIds = totanji ? [totanji.id] : [];

  let changed = 0;

  requests = requests.map(req => {
    // Totanji's automatically rejected "Abu Saleh" and 1200 point requests
    if (totanjiIds.includes(req.playerId) && req.status === 'rejected') {
      const timeDiff = new Date(req.updatedAt).getTime() - new Date(req.createdAt).getTime();
      if (timeDiff < 1000) { // Rejected in less than 1 second = Automatic bug
        console.log(`Reverting Totanji auto-rejected request: ${req.rewardName || req.rewardSnapshot?.name}`);
        req.status = 'pending';
        req.updatedAt = new Date().toISOString();
        if (!req.statusHistory) req.statusHistory = [];
        req.statusHistory.push({
          from: 'rejected',
          to: 'pending',
          timestamp: new Date().toISOString(),
          source: 'system',
          reason: 'System bug correction (Totanji 1200 points bug)'
        });
        changed++;
      }
    }

    // Taym's requests that were manually clicked as "delete" but got stuck as "rejected" due to Race Condition
    if (taymIds.includes(req.playerId) && req.status === 'rejected') {
      console.log(`Reverting Taym Abdo request: ${req.rewardName || req.rewardSnapshot?.name}`);
      req.status = 'pending'; // Reverting to pending so Admin can review and set proper state
      req.updatedAt = new Date().toISOString();
      if (!req.statusHistory) req.statusHistory = [];
      req.statusHistory.push({
        from: 'rejected',
        to: 'pending',
        timestamp: new Date().toISOString(),
        source: 'system',
        reason: 'System bug correction (Delete Race Condition)'
      });
      changed++;
    }

    return req;
  });

  if (changed > 0) {
    db.aqsa_game_prize_requests.value = requests;
    fs.writeFileSync('./fixed_db.json', JSON.stringify(db, null, 2));
    console.log(`Reverted ${changed} requests. Regenerating fixed_db.json.`);
  } else {
    console.log('No requests needed reverting.');
  }
}

revert();
