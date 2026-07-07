// إدارة قاعدة البيانات المحلية باستخدام LocalStorage
import { DEFAULT_CARDS, DEFAULT_BOARD_EVENTS, DEFAULT_REWARDS } from './seedData';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjTcigTLFNcNxALsGU_Apv3Z7zvcA86Ys",
  authDomain: "selamandhayyah.firebaseapp.com",
  projectId: "selamandhayyah",
  storageBucket: "selamandhayyah.firebasestorage.app",
  messagingSenderId: "414616915163",
  appId: "1:414616915163:web:82ea1bb96745cf5d4390fe",
  measurementId: "G-L2LBC2TZC5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// المفاتيح المستخدمة في LocalStorage
const KEYS = {
  ROOMS: 'aqsa_game_rooms',
  PLAYERS: 'aqsa_game_players',
  CARDS: 'aqsa_game_cards',
  EVENTS: 'aqsa_game_board_events',
  LOGS: 'aqsa_game_action_logs',
  REWARDS: 'aqsa_game_rewards',
  PRIZE_REQUESTS: 'aqsa_game_prize_requests'
};

let syncStarted = false;

const setLocalItem = (key, value, isInit = false) => {
  localStorage.setItem(key, value);
  const now = isInit ? 0 : Date.now();
  if (!isInit || !localStorage.getItem(key + '_time')) {
    localStorage.setItem(key + '_time', now.toString());
  }
  if (syncStarted && !isInit) {
    setDoc(doc(db, "data", key), { value, lastUpdated: now }).catch(console.error);
  }
};

export const startFirebaseSync = () => {
  if (syncStarted) return;
  syncStarted = true;
  
  Object.values(KEYS).forEach(key => {
    onSnapshot(doc(db, "data", key), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const localTime = Number(localStorage.getItem(key + '_time') || 0);
        if (data.value && data.lastUpdated > localTime) {
          localStorage.setItem(key, data.value);
          localStorage.setItem(key + '_time', data.lastUpdated.toString());
          window.dispatchEvent(new Event('db_sync'));
        }
      }
    });
  });
};

export const migrateDataToFirebase = async () => {
  alert("⏳ جاري سحب البيانات من جهازك ورفعها إلى السحابة... الرجاء الانتظار");
  syncStarted = true;
  try {
    for (const key of Object.values(KEYS)) {
      const val = localStorage.getItem(key);
      if (val) {
        await setDoc(doc(db, "data", key), { value: val, lastUpdated: Date.now() });
      }
    }
    localStorage.setItem('cloud_migrated', 'true');
    alert("تم رفع جميع البيانات إلى السحابة بنجاح! ☁️🎉");
  } catch (e) {
    console.error("Migration failed:", e);
    alert("حدث خطأ أثناء الرفع للسحابة: " + e.message);
  }
};

// دالة توليد معرف عشوائي فريد
export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// توليد رمز تتبع لولي الأمر
export const generateParentCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const ensureParentCodes = () => {
  try {
    const playersStr = localStorage.getItem(KEYS.PLAYERS);
    if (!playersStr) return;
    const players = JSON.parse(playersStr);
    let updated = false;
    const newPlayers = players.map(p => {
      if (!p.parentCode) {
        updated = true;
        return {
          ...p,
          parentCode: generateParentCode(),
          parentPortalEnabled: true
        };
      }
      return p;
    });
    if (updated) {
      setLocalItem(KEYS.PLAYERS, JSON.stringify(newPlayers), true);
    }
  } catch (e) {
    console.error('Error ensuring parent codes:', e);
  }
};

// تهيئة قاعدة البيانات بالبيانات الافتراضية إذا كانت فارغة
export const initDatabase = () => {
  ensureParentCodes();
  let cards = [];
  try {
    cards = JSON.parse(localStorage.getItem(KEYS.CARDS) || '[]');
  } catch(e) {}
  if (!localStorage.getItem(KEYS.CARDS) || cards.length === 0) {
    setLocalItem(KEYS.CARDS, JSON.stringify(DEFAULT_CARDS), true);
  }

  let events = [];
  try {
    events = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
  } catch(e) {}
  if (!localStorage.getItem(KEYS.EVENTS) || events.length === 0) {
    setLocalItem(KEYS.EVENTS, JSON.stringify(DEFAULT_BOARD_EVENTS), true);
  }

  if (!localStorage.getItem(KEYS.ROOMS)) {
    setLocalItem(KEYS.ROOMS, JSON.stringify([]), true);
  } else {
    // تنظيف السجلات التالفة للغرف
    try {
      const rooms = JSON.parse(localStorage.getItem(KEYS.ROOMS) || '[]');
      const cleanedRooms = rooms.filter(r => r.id && r.id !== 'undefined');
      if (cleanedRooms.length !== rooms.length) {
        setLocalItem(KEYS.ROOMS, JSON.stringify(cleanedRooms), true);
      }
    } catch(e) {}
  }

  if (!localStorage.getItem(KEYS.PLAYERS)) {
    setLocalItem(KEYS.PLAYERS, JSON.stringify([]), true);
  } else {
    // تنظيف السجلات التالفة للاعبين وتحديث الحقول الجديدة للطلاب الحاليين
    try {
      const players = JSON.parse(localStorage.getItem(KEYS.PLAYERS) || '[]');
      let updated = false;
      const cleanedPlayers = players.filter(p => p.id && p.id !== 'undefined').map(p => {
        if (p.rewardPoints === undefined) {
          p.rewardPoints = p.points || 0;
          p.totalCollectedPoints = p.points || 0;
          p.totalSpent = 0;
          updated = true;
        }
        
        // إعادة حساب نسبة التقدم الصحيحة بناءً على الهدف الجديد 7000
        const correctProgress = Math.min(100, Math.round(((p.points || 0) / 7000) * 100));
        if (p.progressPercentage !== correctProgress) {
          p.progressPercentage = correctProgress;
          updated = true;
        }

        // تحديث الموقع الحالي بناءً على القاعدة الجديدة (70 نقطة لكل خطوة بدلاً من 60)
        // هذا يضمن أن مواقع الطلاب على الخريطة متناسقة مع نقاطهم والهدف 7000
        const expectedPosition = Math.min(100, 1 + Math.floor((p.points || 0) / 70));
        if (p.position !== expectedPosition) {
           p.position = expectedPosition;
           updated = true;
        }
        
        return p;
      });
      if (cleanedPlayers.length !== players.length || updated) {
        setLocalItem(KEYS.PLAYERS, JSON.stringify(cleanedPlayers), true);
      }
    } catch(e) {}
  }

  if (!localStorage.getItem(KEYS.LOGS)) {
    setLocalItem(KEYS.LOGS, JSON.stringify([]), true);
  }
  
  if (!localStorage.getItem(KEYS.REWARDS)) {
    setLocalItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS), true);
  } else {
    // If rewards exist but are empty, seed them. Or force seeding new items if needed.
    const currentRewards = JSON.parse(localStorage.getItem(KEYS.REWARDS));
    if (currentRewards.length === 0) {
      setLocalItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS), true);
    } else {
      // Temporary check to update prices for existing items (so the user gets the updated shop)
      const hasOldPrices = currentRewards.some(r => r.name === 'كاميرا' && r.pointsCost !== 2000);
      const isMissingNewItems = !currentRewards.some(r => r.name === 'أبو صالح');
      if (hasOldPrices || isMissingNewItems) {
        setLocalItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS), true);
      }
    }
  }
  
  if (!localStorage.getItem(KEYS.PRIZE_REQUESTS)) {
    setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify([]), true);
  }

  // --- One-time fix for Abdulrahman Totanji ---
  try {
    const logsStr = localStorage.getItem(KEYS.LOGS);
    const playersStr = localStorage.getItem(KEYS.PLAYERS);
    if (logsStr && playersStr) {
      let logs = JSON.parse(logsStr);
      let players = JSON.parse(playersStr);
      
      let changed = false;
      let targetPlayerId = null;

      // Find the specific log and modify it
      logs = logs.map(log => {
        if (log.pointsApplied === 1141 && log.cardName.includes('تفاعل')) {
          log.pointsApplied = 48;
          targetPlayerId = log.playerId;
          changed = true;
        }
        return log;
      });

      if (changed && targetPlayerId) {
        // Save fixed logs
        setLocalItem(KEYS.LOGS, JSON.stringify(logs));

        // Replay all logs for this player to rebuild their state
        const player = players.find(p => p.id === targetPlayerId);
        if (player) {
          const playerLogs = logs
            .filter(l => l.playerId === player.id)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          let points = 0;
          let totalCollectedPoints = 0;
          let position = 1;
          let lastCardApplied = null;
          let hasFinished = false;

          const eventsStr = localStorage.getItem(KEYS.EVENTS);
          const events = eventsStr ? JSON.parse(eventsStr) : [];

          playerLogs.forEach(log => {
            points = Math.max(0, Math.min(7000, points + log.pointsApplied));
            totalCollectedPoints = Math.max(0, totalCollectedPoints + log.pointsApplied);
            
            let tempPos = 1 + Math.floor(points / 70);
            if (tempPos > 100) {
              tempPos = 100;
              hasFinished = true;
            }
            position = tempPos;

            const ev = events.find(e => e.startPosition === position);
            if (ev) {
              position = ev.endPosition;
              if (ev.endPosition === 100) {
                points = 7000;
                hasFinished = true;
              } else {
                points = (ev.endPosition - 1) * 70;
              }
            }
            lastCardApplied = log.cardName;
          });

          player.points = points;
          player.totalCollectedPoints = totalCollectedPoints;
          player.rewardPoints = Math.max(0, totalCollectedPoints - (player.totalSpent || 0));
          player.position = position;
          player.lastCardApplied = lastCardApplied;
          player.hasFinished = hasFinished;
          
          setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
        }
      }
    }
  } catch(e) {
    console.error("Error applying log fix:", e);
  }
};

// --- عمليات الغرف (Rooms) ---

export const getRooms = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.ROOMS) || '[]');
};

export const saveRoom = (room) => {
  const rooms = getRooms();
  const isNew = !room.id;
  const index = isNew ? -1 : rooms.findIndex(r => r.id === room.id);
  
  if (index >= 0) {
    const { id, ...roomData } = room;
    rooms[index] = { ...rooms[index], ...roomData, lastUsedAt: new Date().toISOString() };
  } else {
    const { id, ...roomData } = room;
    rooms.push({
      id: generateId(),
      targetPoints: 7000,
      status: 'active',
      winnerId: null,
      maxPlayers: roomData.maxPlayers || 10,
      createdBy: roomData.createdBy || 'المشرف',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      ...roomData
    });
  }
  setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
  return rooms;
};

export const deleteRoom = (roomId) => {
  // حذف الغرفة
  let rooms = getRooms();
  rooms = rooms.filter(r => r.id !== roomId);
  setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));

  // حذف لاعبي الغرفة
  let players = getAllPlayers();
  players = players.filter(p => p.roomId !== roomId);
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));

  // حذف سجلات الغرفة
  let logs = getAllLogs();
  logs = logs.filter(l => l.roomId !== roomId);
  setLocalItem(KEYS.LOGS, JSON.stringify(logs));

  return rooms;
};

export const archiveRoom = (roomId) => {
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.id === roomId);
  if (index >= 0) {
    rooms[index].status = rooms[index].status === 'finished' ? 'active' : 'finished';
    rooms[index].lastUsedAt = new Date().toISOString();
    setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
  }
  return rooms;
};

// --- عمليات اللاعبين (Players) ---

export const getAllPlayers = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.PLAYERS) || '[]');
};

export const getPlayers = (roomId) => {
  const players = getAllPlayers();
  return players.filter(p => p.roomId === roomId).sort((a, b) => b.points - a.points);
};

export const savePlayer = (player) => {
  const players = getAllPlayers();
  const isNew = !player.id;
  const index = isNew ? -1 : players.findIndex(p => p.id === player.id);
  
  if (index >= 0) {
    // تحديث طالب موجود
    const { id, roomId, ...updatedFields } = player;
    players[index] = { 
      ...players[index], 
      ...updatedFields, 
      updatedAt: new Date().toISOString() 
    };
  } else {
    // إضافة طالب جديد
    // التحقق من الحد الأقصى للنسخة
    const rooms = getRooms();
    const room = rooms.find(r => r.id === player.roomId);
    const currentCount = players.filter(p => p.roomId === player.roomId).length;
    
    if (room && currentCount >= room.maxPlayers) {
      return { error: true, message: `⚠️ عذراً، لا يمكن إضافة الطالب. لقد تم الوصول للحد الأقصى للطلاب في هذه النسخة (${room.maxPlayers} طلاب).` };
    }

    const { id, ...playerData } = player;
    players.push({
      id: generateId(),
      points: 0,
      rewardPoints: 0,
      totalCollectedPoints: 0,
      totalSpent: 0,
      position: 1,
      avatar: playerData.avatar || '⭐',
      color: playerData.color || '#3b82f6',
      rank: 1,
      progressPercentage: 0,
      lastCardApplied: null,
      hasFinished: false,
      updatedAt: new Date().toISOString(),
      parentCode: generateParentCode(),
      parentPortalEnabled: true,
      ...playerData
    });
  }
  
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  recalculateRanks(player.roomId);
  return getPlayers(player.roomId);
};

export const deletePlayer = (playerId, roomId) => {
  let players = getAllPlayers();
  players = players.filter(p => p.id !== playerId);
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  recalculateRanks(roomId);
  return getPlayers(roomId);
};

// إعادة حساب الترتيب ونسب التقدم للاعبين في نسخة معينة
export const recalculateRanks = (roomId) => {
  const allPlayers = getAllPlayers();
  const roomPlayers = allPlayers.filter(p => p.roomId === roomId);
  
  // ترتيب اللاعبين تنازلياً حسب النقاط
  roomPlayers.sort((a, b) => b.points - a.points);
  
  roomPlayers.forEach((player, index) => {
    player.rank = index + 1;
    player.progressPercentage = Math.min(100, Math.round((player.points / 7000) * 100));
  });

  // تحديث اللاعبين في المصفوفة الشاملة
  const updatedAllPlayers = allPlayers.map(p => {
    if (p.roomId === roomId) {
      const updated = roomPlayers.find(rp => rp.id === p.id);
      return updated || p;
    }
    return p;
  });

  setLocalItem(KEYS.PLAYERS, JSON.stringify(updatedAllPlayers));
};

// --- عمليات السلالم والأفاعي (BoardEvents) ---

export const getBoardEvents = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
};

export const saveBoardEvent = (event) => {
  const events = getBoardEvents();
  const isNew = !event.id;
  const index = isNew ? -1 : events.findIndex(e => e.id === event.id);
  
  if (index >= 0) {
    const { id, ...eventData } = event;
    events[index] = { ...events[index], ...eventData };
  } else {
    const { id, ...eventData } = event;
    events.push({
      id: generateId(),
      ...eventData
    });
  }
  setLocalItem(KEYS.EVENTS, JSON.stringify(events));
  return events;
};

export const deleteBoardEvent = (eventId) => {
  let events = getBoardEvents();
  events = events.filter(e => e.id !== eventId);
  setLocalItem(KEYS.EVENTS, JSON.stringify(events));
  return events;
};

// --- عمليات البطاقات (Cards) ---

export const getCards = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.CARDS) || '[]')
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
};

export const saveCard = (card) => {
  const cards = getCards();
  const isNew = !card.id;
  const index = isNew ? -1 : cards.findIndex(c => c.id === card.id);
  
  if (index >= 0) {
    const { id, ...cardData } = card;
    cards[index] = { ...cards[index], ...cardData };
  } else {
    const { id, ...cardData } = card;
    cards.push({
      id: generateId(),
      isEnabled: true,
      displayOrder: cards.length + 1,
      isCustom: true,
      ...cardData
    });
  }
  setLocalItem(KEYS.CARDS, JSON.stringify(cards));
  return getCards();
};

export const deleteCard = (cardId) => {
  let cards = getCards();
  cards = cards.filter(c => c.id !== cardId);
  setLocalItem(KEYS.CARDS, JSON.stringify(cards));
  return getCards();
};

// --- عمليات سجل النشاط (Logs) ---

export const getAllLogs = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
};

export const getLogs = (roomId) => {
  const logs = getAllLogs();
  return logs.filter(l => l.roomId === roomId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// --- عمليات الجوائز والطلبات (Rewards & Requests) ---

export const getRewards = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.REWARDS) || '[]');
};

export const saveReward = (reward) => {
  const rewards = getRewards();
  const isNew = !reward.id;
  const index = isNew ? -1 : rewards.findIndex(r => r.id === reward.id);
  
  if (index >= 0) {
    const { id, ...rewardData } = reward;
    rewards[index] = { ...rewards[index], ...rewardData, updatedAt: new Date().toISOString() };
  } else {
    const { id, ...rewardData } = reward;
    rewards.push({
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFeatured: false,
      images: [],
      stock: 1,
      remainingStock: 1,
      ...rewardData
    });
  }
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  return getRewards();
};

export const deleteReward = (rewardId) => {
  let rewards = getRewards();
  rewards = rewards.filter(r => r.id !== rewardId);
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  return getRewards();
};

export const getAllPrizeRequests = () => {
  initDatabase();
  return JSON.parse(localStorage.getItem(KEYS.PRIZE_REQUESTS) || '[]');
};

export const savePrizeRequest = (request) => {
  const requests = getAllPrizeRequests();
  const isNew = !request.id;
  const index = isNew ? -1 : requests.findIndex(r => r.id === request.id);
  
  if (index >= 0) {
    const { id, ...requestData } = request;
    requests[index] = { ...requests[index], ...requestData, updatedAt: new Date().toISOString() };
  } else {
    const { id, ...requestData } = request;
    requests.push({
      id: generateId(),
      status: 'pending', // pending, approved, delivered, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...requestData
    });
  }
  setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests));
  return getAllPrizeRequests();
};

export const orderPrize = (playerId, rewardId) => {
  const players = getAllPlayers();
  const rewards = getRewards();
  
  const playerIndex = players.findIndex(p => p.id === playerId);
  const rewardIndex = rewards.findIndex(r => r.id === rewardId);
  
  if (playerIndex === -1 || rewardIndex === -1) {
    return { success: false, message: "الطالب أو الجائزة غير موجودة" };
  }
  
  const player = players[playerIndex];
  const reward = rewards[rewardIndex];
  
  if (player.rewardPoints < reward.pointsCost) {
    return { success: false, message: "عذراً، الرصيد غير كافٍ" };
  }
  
  if (reward.remainingStock <= 0) {
    return { success: false, message: "عذراً، نفدت الكمية المتاحة من هذه الجائزة" };
  }
  
  // خصم الرصيد وتحديث الطالب
  player.rewardPoints -= reward.pointsCost;
  player.totalSpent = (player.totalSpent || 0) + reward.pointsCost;
  player.updatedAt = new Date().toISOString();
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  
  // خصم المخزون
  reward.remainingStock -= 1;
  reward.updatedAt = new Date().toISOString();
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  
  // تسجيل الطلب وحفظ نسخة ثابتة من الجائزة
  const newRequest = {
    playerId: player.id,
    playerName: player.name,
    roomId: player.roomId,
    rewardId: reward.id,
    pointsUsed: reward.pointsCost,
    rewardSnapshot: { ...reward },
  };
  savePrizeRequest(newRequest);
  
  return { success: true, message: "تم تسجيل الطلب بنجاح" };
};

export const updatePrizeRequestStatus = (requestId, newStatus) => {
  const requests = getAllPrizeRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return { success: false, message: "الطلب غير موجود" };

  const request = requests[index];
  
  // إذا تم الرفض، نعيد النقاط والمخزون
  if (newStatus === 'rejected' && request.status !== 'rejected') {
    const players = getAllPlayers();
    const rewards = getRewards();
    
    const playerIndex = players.findIndex(p => p.id === request.playerId);
    if (playerIndex >= 0) {
      players[playerIndex].rewardPoints += request.pointsUsed;
      players[playerIndex].totalSpent = Math.max(0, (players[playerIndex].totalSpent || 0) - request.pointsUsed);
      setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
    }
    
    const rewardIndex = rewards.findIndex(r => r.id === request.rewardId);
    if (rewardIndex >= 0) {
      rewards[rewardIndex].remainingStock += 1;
      setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
    }
  }

  request.status = newStatus;
  request.updatedAt = new Date().toISOString();
  if (newStatus === 'delivered') {
    request.deliveredAt = new Date().toISOString();
  }
  
  setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests));
  return { success: true };
};

// --- المنطق الأساسي للعبة: تطبيق بطاقة على لاعب ---
export const applyCardToPlayer = (roomId, playerId, cardId, customValue = null) => {
  const rooms = getRooms();
  const players = getAllPlayers();
  const cards = getCards();
  const events = getBoardEvents();
  const logs = getAllLogs();

  const roomIndex = rooms.findIndex(r => r.id === roomId);
  const playerIndex = players.findIndex(p => p.id === playerId);
  const card = cards.find(c => c.id === cardId);

  if (roomIndex === -1 || playerIndex === -1 || !card) {
    return { success: false, message: "الغرفة أو اللاعب أو البطاقة غير موجودة" };
  }

  const room = rooms[roomIndex];
  const player = players[playerIndex];

  // حساب قيمة النقاط المضافة
  let pointsApplied = 0;
  if (card.value !== null) {
    pointsApplied = card.value;
  } else if (customValue !== null) {
    pointsApplied = Number(customValue);
  }

  // حفظ النقاط السابقة للتراجع
  const oldPoints = player.points;
  const oldPosition = player.position;

  // تحديث نقاط اللاعب (بين 0 و 7000)
  let newPoints = Math.max(0, Math.min(7000, player.points + pointsApplied));
  player.points = newPoints;
  player.lastCardApplied = card.name;
  player.updatedAt = new Date().toISOString();

  // حساب الخانة التقديرية (بين 1 و 100)
  // النقطة 0 -> خانة 1
  // النقطة 7000 -> خانة 100
  // كل 70 نقطة تمثل خطوة (خانة) واحدة على الخريطة تبدأ من 1 وتنتهي عند 100
  let tentativePosition = 1 + Math.floor(newPoints / 70);
  if (tentativePosition > 100) tentativePosition = 100;
  player.position = tentativePosition;

  // التحقق من حدوث حدث على اللوحة (سلم أو أفعى)
  const boardEvent = events.find(e => e.startPosition === player.position);
  let eventTriggered = null;

  if (boardEvent) {
    eventTriggered = {
      type: boardEvent.type, // 'ladder' | 'snake'
      start: boardEvent.startPosition,
      end: boardEvent.endPosition,
      description: boardEvent.description
    };
    
    // نقل اللاعب للخانة الجديدة وتعديل نقاطه لتطابقها
    player.position = boardEvent.endPosition;
    
    // تعديل النقاط لتطابق الخانة الجديدة
    if (boardEvent.endPosition === 100) {
      player.points = 7000;
    } else {
      player.points = (boardEvent.endPosition - 1) * 70;
    }
  }

  // التحقق من حالة الفوز
  let isNewWinner = false;
  if (player.points >= 7000 && !player.hasFinished) {
    player.hasFinished = true;
    player.points = 7000;
    player.position = 100;
    
    // إذا لم يكن هناك فائز في هذه الغرفة بعد، يتم تسجيله
    if (!room.winnerId) {
      room.winnerId = player.id;
      room.status = 'finished';
      isNewWinner = true;
    }
  } else if (player.points < 7000) {
    player.hasFinished = false;
    // إذا كان هو الفائز المسجل وتراجعت نقاطه، يتم إخلاء خانة الفائز وتنشيط الغرفة مجدداً
    if (room.winnerId === player.id) {
      room.winnerId = null;
      room.status = 'active';
    }
  }

  // تحديث رصيد المشتريات ومجموع نقاط الموسم
  // يتأثر فقط بقيمة البطاقة المطبّقة (pointsApplied)، وليس بتأثير السلم أو الأفعى
  player.rewardPoints = Math.max(0, (player.rewardPoints || 0) + pointsApplied);
  player.totalCollectedPoints = Math.max(0, (player.totalCollectedPoints || 0) + pointsApplied);

  // تحديث البيانات في LocalStorage
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
  
  // إعادة حساب الترتيب ونسب التقدم للغرفة
  recalculateRanks(roomId);

  // تسجيل العملية في السجل
  const newLog = {
    id: generateId(),
    roomId,
    playerId,
    playerName: player.name,
    cardName: card.name,
    pointsApplied: player.points - oldPoints, // النقاط الفعلية المضافة شاملة السلم والحية
    timestamp: new Date().toISOString()
  };
  
  logs.push(newLog);
  setLocalItem(KEYS.LOGS, JSON.stringify(logs));

  // تحديث وقت آخر استخدام للغرفة
  room.lastUsedAt = new Date().toISOString();
  setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));

  return {
    success: true,
    player: getAllPlayers().find(p => p.id === playerId),
    room: getRooms().find(r => r.id === roomId),
    eventTriggered,
    isNewWinner,
    log: newLog
  };
};

// --- دالة التراجع عن آخر عملية (Undo) ---
export const undoLastLog = (roomId) => {
  const logs = getLogs(roomId);
  if (logs.length === 0) return { success: false, message: "لا توجد عمليات للتراجع عنها" };

  const lastLog = logs[0]; // آخر عملية مضافة
  
  const allLogs = getAllLogs();
  const remainingLogs = allLogs.filter(l => l.id !== lastLog.id);
  setLocalItem(KEYS.LOGS, JSON.stringify(remainingLogs));

  // لإرجاع الحالة السابقة بدقة، سنقوم بإعادة بناء حالة نقاط اللاعبين وموقعهم من خلال إعادة تطبيق السجلات المتبقية من البداية للاعب المعني!
  // هذه الطريقة (Event Sourcing) هي الأكثر أماناً لمنع تعارض الحسابات.
  const players = getAllPlayers();
  const player = players.find(p => p.id === lastLog.playerId);
  
  if (player) {
    const playerLogs = remainingLogs
      .filter(l => l.playerId === player.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // إعادة الحساب التراكمي للاعب من نقطة الصفر
    let points = 0;
    let rewardPoints = 0;
    let totalCollectedPoints = 0;
    let position = 1;
    let lastCardApplied = null;
    let hasFinished = false;

    const events = getBoardEvents();

    playerLogs.forEach(log => {
      // نطبق التعديل التراكمي على نقاط اللعبة
      points = Math.max(0, Math.min(7000, points + log.pointsApplied));

      // نقاط المتجر تتأثر فقط بقيمة البطاقة (pointsApplied)، بمعزل عن السلم والأفعى
      rewardPoints = Math.max(0, rewardPoints + log.pointsApplied);
      totalCollectedPoints = Math.max(0, totalCollectedPoints + log.pointsApplied);
      
      let tempPos = 1 + Math.floor(points / 70);
      if (tempPos > 100) {
        tempPos = 100;
        hasFinished = true;
      }
      position = tempPos;

      // نتحقق من وجود سلم أو حية - تؤثر على الموقع ونقاط اللعبة فقط
      const ev = events.find(e => e.startPosition === position);
      if (ev) {
        position = ev.endPosition;
        if (ev.endPosition === 100) {
          points = 7000;
          hasFinished = true;
        } else {
          points = (ev.endPosition - 1) * 70;
        }
      }
      lastCardApplied = log.cardName;
    });

    player.points = points;
    // الحفاظ على الخصومات اللي تمت من المتجر (totalSpent) 
    // وبناء rewardPoints الجديد بناء عليها
    player.totalCollectedPoints = totalCollectedPoints;
    player.rewardPoints = Math.max(0, totalCollectedPoints - (player.totalSpent || 0));
    player.position = position;
    player.lastCardApplied = lastCardApplied;
    player.hasFinished = hasFinished;
    player.updatedAt = new Date().toISOString();

    setLocalItem(KEYS.PLAYERS, JSON.stringify(players));

    // إذا تم حذف فوز اللاعب، نحدث الغرفة أيضاً
    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (room && room.winnerId === player.id && !hasFinished) {
      room.winnerId = null;
      room.status = 'active';
      setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
    }

    recalculateRanks(roomId);
  }

  return {
    success: true,
    players: getPlayers(roomId),
    rooms: getRooms()
  };
};

// --- تصدير واستيراد البيانات (Backup) ---

export const exportData = () => {
  const data = {
    rooms: getRooms(),
    players: getAllPlayers(),
    cards: getCards(),
    events: getBoardEvents(),
    logs: getAllLogs(),
    rewards: getRewards(),
    prizeRequests: getAllPrizeRequests()
  };
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    // التحقق من سلامة البيانات المستوردة
    if (!data.rooms || !data.players || !data.cards || !data.events || !data.logs) {
      return { success: false, message: "تنسيق الملف غير صالح، بعض الجداول الأساسية مفقودة" };
    }

    setLocalItem(KEYS.ROOMS, JSON.stringify(data.rooms));
    setLocalItem(KEYS.PLAYERS, JSON.stringify(data.players));
    setLocalItem(KEYS.CARDS, JSON.stringify(data.cards));
    setLocalItem(KEYS.EVENTS, JSON.stringify(data.events));
    setLocalItem(KEYS.LOGS, JSON.stringify(data.logs));
    if (data.rewards) setLocalItem(KEYS.REWARDS, JSON.stringify(data.rewards));
    if (data.prizeRequests) setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(data.prizeRequests));

    // إعادة ضبط الرتب للجميع للاطمئنان
    data.rooms.forEach(room => {
      recalculateRanks(room.id);
    });

    return { success: true, message: "تم استيراد البيانات بنجاح وتحديث كافة الإحصائيات" };
  } catch (error) {
    return { success: false, message: "حدث خطأ أثناء معالجة ملف البيانات: " + error.message };
  }
};
