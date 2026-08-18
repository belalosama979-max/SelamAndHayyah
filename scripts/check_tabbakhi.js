import fs from 'fs';

function calcPoints() {
  const dbStr = fs.readFileSync('./backup_db.json', 'utf8');
  const db = JSON.parse(dbStr);

  const logs = db.aqsa_game_action_logs?.value || [];
  const cards = db.aqsa_game_cards?.value || [];
  
  const cardValueByName = {};
  cards.forEach(c => {
    if (c.value !== null && c.value !== undefined) {
      cardValueByName[c.name] = c.value;
    }
  });

  const getTruePoints = (name) => {
    const pLogs = logs.filter(l => l.playerName && l.playerName.includes(name));
    let rawTotal = 0;
    
    pLogs.forEach(l => {
      let rawValue = 0;
      if (l.cardValue !== undefined && l.cardValue !== null) {
        rawValue = l.cardValue;
      } else if (cardValueByName[l.cardName] !== undefined) {
        rawValue = cardValueByName[l.cardName];
      } else {
        rawValue = l.pointsApplied || 0;
      }
      rawTotal += rawValue;
      console.log(`Log: ${l.cardName} | rawValue: ${rawValue} | total so far: ${rawTotal}`);
    });
    console.log(`\n=> ${name} Total Earned: ${rawTotal}`);
  };

  getTruePoints('طباخي');
}

calcPoints();
