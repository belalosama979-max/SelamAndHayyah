import fs from 'fs';

function reconcile() {
  const db = JSON.parse(fs.readFileSync('./backup_db.json', 'utf8'));
  
  const players = db.aqsa_game_players?.value || [];
  const logs = db.aqsa_game_action_logs?.value || [];
  const requests = db.aqsa_game_prize_requests?.value || [];
  const cards = db.aqsa_game_cards?.value || [];
  
  // Mapping cards to points
  const cardValueByName = {};
  cards.forEach(c => {
    if (c.value !== undefined && c.value !== null) {
      cardValueByName[c.name] = c.value;
    }
  });

  const report = [];
  let differencesFound = 0;

  players.forEach(player => {
    const playerLogs = logs.filter(l => l.playerId === player.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let earnedPoints = 0;
    const earnedDetails = [];

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
        earnedDetails.push(`${log.cardName || 'نقاط'}: +${p}`);
      }
    });

    const playerRequests = requests.filter(r => r.playerId === player.id);
    let spentPoints = 0;
    const activeRequests = [];
    const rejectedRequests = [];
    const deliveredRequests = [];

    playerRequests.forEach(req => {
      // Historical price
      const price = req.rewardPriceAtPurchase !== undefined ? req.rewardPriceAtPurchase : (req.pointsUsed || 0);

      if (req.status === 'rejected' || req.status === 'cancelled') {
        rejectedRequests.push(`${req.rewardName} (${price})`);
      } else {
        spentPoints += price;
        if (req.status === 'delivered') deliveredRequests.push(`${req.rewardName} (${price})`);
        else activeRequests.push(`${req.rewardName} (${price}) [${req.status}]`);
      }
    });

    const calculatedRewardPoints = Math.max(0, earnedPoints - spentPoints);
    const currentRewardPoints = player.rewardPoints || 0;
    
    if (calculatedRewardPoints !== currentRewardPoints) {
      differencesFound++;
    }

    report.push(`
=========================================
الطالب: ${player.name} (الغرفة: ${player.roomId})
إجمالي المكتسب: ${earnedPoints}
تفاصيل الاكتساب: ${earnedDetails.slice(0, 3).join(' | ')}${earnedDetails.length > 3 ? ' ...' : ''}

إجمالي المخصوم/المحجوز: ${spentPoints}
طلبات محجوزة (فعالة): ${activeRequests.length ? activeRequests.join(', ') : 'لا يوجد'}
طلبات مسلّمة: ${deliveredRequests.length ? deliveredRequests.join(', ') : 'لا يوجد'}
طلبات مرفوضة/ملغاة (تم الإرجاع): ${rejectedRequests.length ? rejectedRequests.join(', ') : 'لا يوجد'}

المتاح حسابياً: ${calculatedRewardPoints}
المخزن حالياً: ${currentRewardPoints}
الفرق: ${calculatedRewardPoints - currentRewardPoints !== 0 ? `⚠️ يوجد فرق! (${calculatedRewardPoints - currentRewardPoints})` : '✅ متطابق'}
=========================================
`);
  });

  fs.writeFileSync('./reconciliation_report.txt', report.join('\n'));
  console.log(`Reconciliation completed. Differences found in ${differencesFound} players. Report written to reconciliation_report.txt`);
}

reconcile();
