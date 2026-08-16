// إدارة قاعدة البيانات المحلية باستخدام LocalStorage
import { DEFAULT_CARDS, DEFAULT_BOARD_EVENTS, DEFAULT_REWARDS } from './seedData';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getEffectivePointsCost } from '../utils/flashSale';

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
  PRIZE_REQUESTS: 'aqsa_game_prize_requests',
  SETTINGS: 'aqsa_game_settings',
  QUIZZES: 'aqsa_game_quizzes'
};

let syncStarted = false;

// ================================================================
// Quizzes (الألغاز والأسئلة)
// ================================================================
export const getQuizzes = () => {
  initDatabase();
  try {
    return JSON.parse(localStorage.getItem(KEYS.QUIZZES) || '[]');
  } catch(e) {
    return [];
  }
};

export const saveQuiz = (quiz) => {
  const quizzes = getQuizzes();
  if (quiz.id) {
    const idx = quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      quizzes[idx] = { ...quizzes[idx], ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.push({ ...quiz, updatedAt: new Date().toISOString() });
    }
  } else {
    quizzes.push({
      ...quiz,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  setLocalItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  return true;
};

export const deleteQuiz = (quizId) => {
  let quizzes = getQuizzes();
  quizzes = quizzes.filter(q => q.id !== quizId);
  setLocalItem(KEYS.QUIZZES, JSON.stringify(quizzes));
  return true;
};

// ================================================================
// إعدادات اللعبة العامة (الهدف وسعة الخريطة)
// ================================================================
const DEFAULT_SETTINGS = {
  targetPoints: 8500,
  boardSize: 100,
};

export const getGameSettings = () => {
  try {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch(e) {}
  return { ...DEFAULT_SETTINGS };
};

// نقاط خطوة واحدة على الخريطة = الهدف / عدد الخانات
const getPointsPerStep = () => {
  const { targetPoints, boardSize } = getGameSettings();
  return targetPoints / boardSize;
};

export const saveGameSettings = (newSettings) => {
  const merged = { ...DEFAULT_SETTINGS, ...getGameSettings(), ...newSettings };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  if (syncStarted) {
    setDoc(doc(db, 'data', KEYS.SETTINGS), { value: JSON.stringify(merged), lastUpdated: Date.now() }).catch(console.error);
  }
  // إعادة حساب مواقع وتقدم جميع الطلاب تلقائياً بناءً على الإعداد الجديد
  recalculateAllPlayers();
};

const setLocalItem = (key, value, isInit = false) => {
  localStorage.setItem(key, value);
  const now = isInit ? 0 : Date.now();
  if (!isInit || !localStorage.getItem(key + '_time')) {
    localStorage.setItem(key + '_time', now.toString());
  }
  // إرسال فوري للسحابة في كل عملية حفظ
  if (!isInit) {
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
        let localTime = Number(localStorage.getItem(key + '_time') || 0);
        // حماية ضد أي أوقات مستقبلية تالفة قد تكون حفظت سابقاً
        if (localTime > Date.now() + 60000) {
          localTime = 0;
          localStorage.setItem(key + '_time', '0');
        }
        if (data.value && data.lastUpdated > localTime) {
          localStorage.setItem(key, data.value);
          localStorage.setItem(key + '_time', data.lastUpdated.toString());
          window.dispatchEvent(new Event('db_sync'));
        }
      }
    }, (error) => {
      console.warn("Firestore sync warning for key:", key, error.message);
    });
  });
};

export const migrateDataToFirebase = async (silent = false) => {
  if (!silent) {
    alert("⏳ جاري سحب البيانات من جهازك ورفعها إلى السحابة... الرجاء الانتظار");
  }
  syncStarted = true;
  try {
    for (const key of Object.values(KEYS)) {
      const val = localStorage.getItem(key);
      if (val) {
        await setDoc(doc(db, "data", key), { value: val, lastUpdated: Date.now() });
      }
    }
    localStorage.setItem('cloud_migrated', 'true');
    if (!silent) {
      alert("تم رفع جميع البيانات إلى السحابة بنجاح! ☁️🎉");
    }
  } catch (e) {
    console.error("Migration failed:", e);
    if (!silent) {
      alert("حدث خطأ أثناء الرفع للسحابة: " + e.message);
    }
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

let isInitializing = false;

// تهيئة قاعدة البيانات بالبيانات الافتراضية إذا كانت فارغة
export const initDatabase = () => {
  if (isInitializing) return;
  isInitializing = true;
  try {
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
          
          // إعادة حساب نسبة التقدم الصحيحة بناءً على الهدف الحالي
          const _tp = getGameSettings().targetPoints;
          const _bs = getGameSettings().boardSize;
          const _pps = _tp / _bs;
          const correctProgress = Math.min(100, Math.round(((p.points || 0) / _tp) * 100));
          if (p.progressPercentage !== correctProgress) {
            p.progressPercentage = correctProgress;
            updated = true;
          }

          // تحديث الموقع الحالي بناءً على الإعداد الديناميكي
          const expectedPosition = Math.min(_bs, 1 + Math.floor((p.points || 0) / _pps));
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
      try {
        const currentRewards = JSON.parse(localStorage.getItem(KEYS.REWARDS));
        if (!Array.isArray(currentRewards) || currentRewards.length === 0) {
          setLocalItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS), true);
        } else {
          // دمج الهدايا الجديدة دون حذف الموجودة أو المخصصة
          const existingIds = new Set(currentRewards.map(r => r.id));
          const newRewardsToAdd = DEFAULT_REWARDS.filter(r => !existingIds.has(r.id));
          
          if (newRewardsToAdd.length > 0) {
            const merged = [...currentRewards, ...newRewardsToAdd];
            setLocalItem(KEYS.REWARDS, JSON.stringify(merged), true);
          }
        }
      } catch (e) {
        console.error("Error parsing rewards:", e);
        setLocalItem(KEYS.REWARDS, JSON.stringify(DEFAULT_REWARDS), true);
      }
    }
    
    if (!localStorage.getItem(KEYS.PRIZE_REQUESTS)) {
      setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify([]), true);
    }

    if (!localStorage.getItem(KEYS.QUIZZES)) {
      setLocalItem(KEYS.QUIZZES, JSON.stringify([]), true);
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
          setLocalItem(KEYS.LOGS, JSON.stringify(logs), true);

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
            const { targetPoints: ftp, boardSize: fbs } = getGameSettings();
            const fpps = ftp / fbs;

            playerLogs.forEach(log => {
              points = Math.max(0, Math.min(ftp, points + log.pointsApplied));
              totalCollectedPoints = Math.max(0, totalCollectedPoints + log.pointsApplied);
              
              let tempPos = 1 + Math.floor(points / fpps);
              if (tempPos > fbs) {
                tempPos = fbs;
                hasFinished = true;
              }
              position = tempPos;

              const ev = events.find(e => e.startPosition === position);
              if (ev) {
                position = ev.endPosition;
                if (ev.endPosition === fbs) {
                  points = ftp;
                  hasFinished = true;
                } else {
                  points = (ev.endPosition - 1) * fpps;
                }
              }
              lastCardApplied = log.cardName;
            });

            player.points = points;
            player.totalCollectedPoints = totalCollectedPoints;
            player.rewardPoints = totalCollectedPoints - (player.totalSpent || 0);
            player.position = position;
            player.lastCardApplied = lastCardApplied;
            player.hasFinished = hasFinished;
            
            setLocalItem(KEYS.PLAYERS, JSON.stringify(players), true);
          }
        }
      }
    } catch(e) {
      console.error("Error applying log fix:", e);
    }

    // --- One-time fix: Reject and refund prize request for Abdulrahman Totanji (Abu Saleh 1200 points) ---
    try {
      const requestsStr = localStorage.getItem(KEYS.PRIZE_REQUESTS);
      if (requestsStr) {
        const requests = JSON.parse(requestsStr);
        const targetReq = requests.find(r => 
          (r.playerName?.includes('التوتنجي') || r.playerName?.includes('عبدالرحمن')) && 
          (r.rewardSnapshot?.name?.includes('أبو صالح') || r.pointsUsed === 1200) &&
          r.status !== 'rejected'
        );
        if (targetReq) {
          targetReq.status = 'rejected';
          targetReq.updatedAt = new Date().toISOString();
          setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests), true);

          const playersStr = localStorage.getItem(KEYS.PLAYERS);
          if (playersStr) {
            const players = JSON.parse(playersStr);
            const pIndex = players.findIndex(p => p.id === targetReq.playerId);
            if (pIndex >= 0) {
              players[pIndex].rewardPoints += (targetReq.pointsUsed || 0);
              players[pIndex].totalSpent = Math.max(0, (players[pIndex].totalSpent || 0) - (targetReq.pointsUsed || 0));
              setLocalItem(KEYS.PLAYERS, JSON.stringify(players), true);
            }
          }
        }
      }
    } catch(e) {
      console.error("Error rejecting prize request:", e);
    }

    // --- One-time fix: Omar Al-Rajoub bought لعبة تركيب شخصيات for free ---
    try {
      const requestsStr = localStorage.getItem(KEYS.PRIZE_REQUESTS);
      if (requestsStr) {
        const requests = JSON.parse(requestsStr);
        const targetReqs = requests.filter(r => 
          r.playerName?.includes('عمر') && r.playerName?.includes('الرجوب') && 
          r.rewardSnapshot?.name?.includes('لعبة تركيب شخصيات') &&
          (!r.pointsUsed || r.pointsUsed == 0) &&
          !r.fixedForOmar
        );

        if (targetReqs.length > 0) {
          let playersChanged = false;
          let players = null;
          
          const playersStr = localStorage.getItem(KEYS.PLAYERS);
          if (playersStr) players = JSON.parse(playersStr);

          targetReqs.forEach(targetReq => {
            targetReq.pointsUsed = 400; 
            targetReq.fixedForOmar = true;
            
            if (players) {
              const pIndex = players.findIndex(p => p.id === targetReq.playerId);
              if (pIndex >= 0) {
                players[pIndex].rewardPoints = (players[pIndex].rewardPoints || 0) - 400;
                players[pIndex].totalSpent = (players[pIndex].totalSpent || 0) + 400;
                playersChanged = true;
              }
            }
          });

          // Force local storage and sync to Firebase immediately
          const now = Date.now();
          localStorage.setItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests));
          localStorage.setItem(KEYS.PRIZE_REQUESTS + '_time', now.toString());
          setDoc(doc(db, "data", KEYS.PRIZE_REQUESTS), { value: JSON.stringify(requests), lastUpdated: now }).catch(console.error);

          if (playersChanged && players) {
            localStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
            localStorage.setItem(KEYS.PLAYERS + '_time', now.toString());
            setDoc(doc(db, "data", KEYS.PLAYERS), { value: JSON.stringify(players), lastUpdated: now }).catch(console.error);
          }
        }
      }
    } catch(e) {
      console.error("Error fixing Omar Al-Rajoub:", e);
    }

    // --- Migration: إعادة توزيع السلالم والأفاعي (v2) ---
    // يعمل مرة واحدة فقط عند وجود التوزيع القديم غير المتوازن
    try {
      const migrationKey = 'board_events_rebalanced_v2';
      if (!localStorage.getItem(migrationKey)) {
        // التوزيع الجديد المتوازن للسلالم والأفاعي
        const newEvents = [
          { id: "event-ladder-1", type: "ladder", startPosition: 6,  endPosition: 17, description: "المحافظة على صلاة الفجر في جماعة" },
          { id: "event-ladder-2", type: "ladder", startPosition: 18, endPosition: 30, description: "حفظ ورد الحفظ الأسبوعي كاملاً" },
          { id: "event-ladder-3", type: "ladder", startPosition: 38, endPosition: 51, description: "بر الوالدين ومساعدتهم في المنزل" },
          { id: "event-ladder-4", type: "ladder", startPosition: 59, endPosition: 73, description: "التصدق والمشاركة في عمل تطوعي" },
          { id: "event-ladder-5", type: "ladder", startPosition: 77, endPosition: 91, description: "التفوق الدراسي ونشر الخير بين الزملاء" },
          { id: "event-snake-1", type: "snake", startPosition: 26, endPosition: 15, description: "التفوه بكلمات سيئة أو الغيبة" },
          { id: "event-snake-2", type: "snake", startPosition: 45, endPosition: 33, description: "إهمال الواجبات المدرسية والتكاسل" },
          { id: "event-snake-3", type: "snake", startPosition: 54, endPosition: 42, description: "عقوق الوالدين أو إساءة الأدب" },
          { id: "event-snake-4", type: "snake", startPosition: 68, endPosition: 57, description: "التخلف عن صلاة الجماعة لعدة أيام" },
          { id: "event-snake-5", type: "snake", startPosition: 88, endPosition: 74, description: "الكبر والغرور واحتقار الآخرين" },
        ];
        // استخدام isInit=false وtimestamp عالٍ لضمان فوز الأحداث الجديدة على Firebase
        const highTs = Date.now();
        localStorage.setItem(KEYS.EVENTS, JSON.stringify(newEvents));
        localStorage.setItem(KEYS.EVENTS + '_time', highTs.toString());
        setDoc(doc(db, 'data', KEYS.EVENTS), { value: JSON.stringify(newEvents), lastUpdated: highTs }).catch(console.error);
        localStorage.setItem(migrationKey, '1');
      }
    } catch(e) {
      console.error('Error applying board events migration v2:', e);
    }

    // تنظيف أي تايمستامب مستقبلي غير طبيعي لضمان عمل المزامنة بشكل سليم
    try {
      Object.values(KEYS).forEach(k => {
        const t = Number(localStorage.getItem(k + '_time') || 0);
        if (t > Date.now() + 60000) {
          localStorage.setItem(k + '_time', Date.now().toString());
        }
      });
    } catch(e) {}

    // --- إصلاح تلقائي شامل: تدقيق وإعادة حساب نقاط المتجر وضمان إرجاع طلبات المناصير المرفوضة ---
    try {
      const storeAuditKey = 'store_points_audit_v4';
      if (!localStorage.getItem(storeAuditKey)) {
        const allLogsStr = localStorage.getItem(KEYS.LOGS);
        const allPlayersStr = localStorage.getItem(KEYS.PLAYERS);
        const allRequestsStr = localStorage.getItem(KEYS.PRIZE_REQUESTS);
        const cardsStr = localStorage.getItem(KEYS.CARDS);

        if (allLogsStr && allPlayersStr) {
          const allLogs = JSON.parse(allLogsStr);
          let allPlayers = JSON.parse(allPlayersStr);
          let allPrizeRequests = allRequestsStr ? JSON.parse(allRequestsStr) : [];
          const allCards = cardsStr ? JSON.parse(cardsStr) : [];

          // 1. فحص طلبات المناصير: إذا كان هناك طلب كاميرا لمحمد المناصير، نجعله مرفوضاً لضمان إرجاع النقاط
          let requestsChanged = false;
          allPrizeRequests = allPrizeRequests.map(req => {
            if (
              req.playerName?.includes('المناصير') &&
              (req.rewardSnapshot?.name?.includes('كاميرا') || req.rewardSnapshot?.name?.toLowerCase().includes('camera'))
            ) {
              if (req.status !== 'rejected') {
                requestsChanged = true;
                return { ...req, status: 'rejected', updatedAt: new Date().toISOString() };
              }
            }
            return req;
          });

          if (requestsChanged) {
            const reqStr = JSON.stringify(allPrizeRequests);
            localStorage.setItem(KEYS.PRIZE_REQUESTS, reqStr);
            setDoc(doc(db, 'data', KEYS.PRIZE_REQUESTS), { value: reqStr, lastUpdated: Date.now() }).catch(console.error);
          }

          // 2. جدول البحث: اسم البطاقة → قيمتها الخام
          const cardValueByName = {};
          allCards.forEach(c => {
            if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value;
          });

          // 3. إعادة حساب نقاط المتجر لكل طالب من السجلات المباشرة
          let playersChanged = false;
          const fixedPlayers = allPlayers.map(player => {
            const playerLogs = allLogs
              .filter(l => l.playerId === player.id || (l.playerName === player.name && l.roomId === player.roomId))
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            let totalCollectedPoints = 0;
            playerLogs.forEach(log => {
              let rawCardValue;
              if (log.cardValue !== undefined && log.cardValue !== null) {
                rawCardValue = log.cardValue;
              } else if (cardValueByName[log.cardName] !== undefined) {
                rawCardValue = cardValueByName[log.cardName];
              } else {
                rawCardValue = log.pointsApplied;
              }
              totalCollectedPoints = Math.max(0, totalCollectedPoints + rawCardValue);
            });

            // حساب المصروف الحقيقي من الطلبات المعتمدة فقط (استثناء المرفوضة والملغاة)
            const playerPrizes = allPrizeRequests.filter(
              r => (r.playerId === player.id || (r.playerName === player.name && r.roomId === player.roomId)) &&
                   r.status !== 'rejected' &&
                   r.status !== 'cancelled'
            );
            const totalSpent = playerPrizes.reduce((s, r) => s + (Number(r.pointsUsed) || 0), 0);
            const newRewardPoints = Math.max(0, totalCollectedPoints - totalSpent);

            if (
              player.totalCollectedPoints !== totalCollectedPoints ||
              player.totalSpent !== totalSpent ||
              player.rewardPoints !== newRewardPoints
            ) {
              playersChanged = true;
              return {
                ...player,
                totalCollectedPoints,
                totalSpent,
                rewardPoints: newRewardPoints
              };
            }
            return player;
          });

          if (playersChanged) {
            const now = Date.now();
            const fixedStr = JSON.stringify(fixedPlayers);
            localStorage.setItem(KEYS.PLAYERS, fixedStr);
            localStorage.setItem(KEYS.PLAYERS + '_time', now.toString());
            setDoc(doc(db, 'data', KEYS.PLAYERS), { value: fixedStr, lastUpdated: now }).catch(console.error);
          }

          localStorage.setItem(storeAuditKey, '1');
        }
      }
    } catch(e) {
      console.error('Error applying store points audit:', e);
    }

  } finally {
    isInitializing = false;
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
      targetPoints: getGameSettings().targetPoints,
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

// تسجيل آخر زيارة/جلسة للطالب (يُستدعى عند تحديد الطالب أو تطبيق بطاقة عليه)
export const recordPlayerVisit = (playerId) => {
  if (!playerId) return;
  try {
    const players = getAllPlayers();
    const idx = players.findIndex(p => p.id === playerId);
    if (idx >= 0) {
      players[idx].lastSeenAt = new Date().toISOString();
      setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
    }
  } catch(e) {
    console.error('recordPlayerVisit error:', e);
  }
};


// إعادة حساب الترتيب ونسب التقدم للاعبين في نسخة معينة
export const recalculateRanks = (roomId) => {
  const allPlayers = getAllPlayers();
  const roomPlayers = allPlayers.filter(p => p.roomId === roomId);
  
  // ترتيب اللاعبين تنازلياً حسب النقاط
  roomPlayers.sort((a, b) => b.points - a.points);
  
  const { targetPoints: rtp } = getGameSettings();
  roomPlayers.forEach((player, index) => {
    player.rank = index + 1;
    player.progressPercentage = Math.min(100, Math.round((player.points / rtp) * 100));
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

// إعادة حساب مواقع وتقدم جميع الطلاب عند تغيير إعدادات اللعبة
export const recalculateAllPlayers = () => {
  try {
    const allPlayersStr = localStorage.getItem(KEYS.PLAYERS);
    if (!allPlayersStr) return;
    const allPlayers = JSON.parse(allPlayersStr);
    const { targetPoints, boardSize } = getGameSettings();
    const pps = targetPoints / boardSize;

    const updated = allPlayers.map(p => {
      const pts = p.points || 0;
      const newProgress = Math.min(100, Math.round((pts / targetPoints) * 100));
      const newPosition = Math.min(boardSize, 1 + Math.floor(pts / pps));
      return { ...p, progressPercentage: newProgress, position: newPosition };
    });

    setLocalItem(KEYS.PLAYERS, JSON.stringify(updated));

    // إعادة حساب الرتب لكل غرفة
    const roomsStr = localStorage.getItem(KEYS.ROOMS);
    if (roomsStr) {
      JSON.parse(roomsStr).forEach(room => recalculateRanks(room.id));
    }
    // إطلاق حدث التحديث لإعادة رسم واجهة المستخدم
    window.dispatchEvent(new Event('db_sync'));
  } catch(e) {
    console.error('recalculateAllPlayers error:', e);
  }
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
  try {
    const rewards = JSON.parse(localStorage.getItem(KEYS.REWARDS) || '[]');
    if (!Array.isArray(rewards) || rewards.length === 0) return DEFAULT_REWARDS;
    return rewards.map(r => {
      const stock = Number(r.stock) > 0 ? Number(r.stock) : (Number(r.remainingStock) > 0 ? Number(r.remainingStock) : 1);
      const remainingStock = r.remainingStock !== undefined && !isNaN(Number(r.remainingStock))
        ? Number(r.remainingStock)
        : stock;
      return {
        ...r,
        stock,
        remainingStock: Math.max(0, remainingStock)
      };
    });
  } catch (e) {
    return DEFAULT_REWARDS;
  }
};

export const saveReward = (reward) => {
  const rewards = getRewards();
  const isNew = !reward.id;
  const index = isNew ? -1 : rewards.findIndex(r => r.id === reward.id);
  
  const stock = Number(reward.stock) > 0 ? Number(reward.stock) : 1;
  const remainingStock = reward.remainingStock !== undefined && !isNaN(Number(reward.remainingStock))
    ? Number(reward.remainingStock)
    : stock;
  
  if (index >= 0) {
    const { id, ...rewardData } = reward;
    rewards[index] = { 
      ...rewards[index], 
      ...rewardData, 
      stock, 
      remainingStock: Math.max(0, remainingStock),
      updatedAt: new Date().toISOString() 
    };
  } else {
    const { id, ...rewardData } = reward;
    rewards.push({
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFeatured: false,
      images: [],
      stock,
      remainingStock: Math.max(0, remainingStock),
      ...rewardData
    });
  }
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  window.dispatchEvent(new Event('db_sync'));
  return getRewards();
};

export const deleteReward = (rewardId) => {
  // عند حذف جائزة: أولاً ارفض الطلبات المعلقة (يُعيد النقاط للطلاب) ثم احذف جميع طلباتها
  const allRequests = getAllPrizeRequests();
  const relatedRequests = allRequests.filter(r => r.rewardId === rewardId);
  relatedRequests.forEach(req => {
    if (req.status !== 'rejected' && req.status !== 'cancelled') {
      updatePrizeRequestStatus(req.id, 'rejected');
    }
  });
  const cleanedRequests = getAllPrizeRequests().filter(r => r.rewardId !== rewardId);
  setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(cleanedRequests));

  let rewards = getRewards();
  rewards = rewards.filter(r => r.id !== rewardId);
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  window.dispatchEvent(new Event('db_sync'));
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
  window.dispatchEvent(new Event('db_sync'));
  return getAllPrizeRequests();
};

export const orderPrize = (playerId, rewardId, customPointsCost = null) => {
  const players = getAllPlayers();
  const rewards = getRewards();
  
  const playerIndex = players.findIndex(p => p.id === playerId);
  const rewardIndex = rewards.findIndex(r => r.id === rewardId || r.name === rewardId);
  
  if (playerIndex === -1 || rewardIndex === -1) {
    return { success: false, message: "الطالب أو الجائزة غير موجودة" };
  }
  
  const player = players[playerIndex];
  const reward = rewards[rewardIndex];
  
  // حساب التكلفة الفعلية (مع أو بدون خصم أو السعر المخصص)
  const effectiveCost = customPointsCost !== null ? customPointsCost : getEffectivePointsCost(reward);
  
  if ((player.rewardPoints || 0) < effectiveCost) {
    return { success: false, message: "عذراً، الرصيد غير كافٍ" };
  }
  
  if ((reward.remainingStock || 0) <= 0) {
    return { success: false, message: "عذراً، نفدت الكمية المتاحة من هذه الجائزة" };
  }
  
  // خصم الرصيد وتحديث الطالب
  player.rewardPoints = Math.max(0, (player.rewardPoints || 0) - effectiveCost);
  player.totalSpent = (player.totalSpent || 0) + effectiveCost;
  player.updatedAt = new Date().toISOString();
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  
  // خصم المخزون
  reward.remainingStock = Math.max(0, (reward.remainingStock || 1) - 1);
  reward.updatedAt = new Date().toISOString();
  setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
  
  // تسجيل الطلب وحفظ نسخة ثابتة من الجائزة
  const newRequest = {
    id: generateId(),
    playerId: player.id,
    playerName: player.name,
    roomId: player.roomId,
    rewardId: reward.id,
    pointsUsed: effectiveCost,
    originalPointsCost: customPointsCost !== null ? customPointsCost : reward.pointsCost,
    wasFlashSale: customPointsCost === null && effectiveCost < reward.pointsCost,
    rewardSnapshot: { ...reward, effectivePointsCost: effectiveCost },
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const requests = getAllPrizeRequests();
  requests.push(newRequest);
  setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests));
  
  // إشعار جميع التبويبات والمكونات المفتوحة فوراً
  window.dispatchEvent(new Event('db_sync'));
  
  return { success: true, message: "تم تسجيل الطلب بنجاح" };
};

export const updatePrizeRequestStatus = (requestId, newStatus) => {
  const requests = getAllPrizeRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return { success: false, message: "الطلب غير موجود" };

  const request = requests[index];
  const oldStatus = request.status;
  
  // إذا تم التغيير إلى مرفوض من حالة غير مرفوضة -> نعيد النقاط والمخزون
  if (newStatus === 'rejected' && oldStatus !== 'rejected') {
    const players = getAllPlayers();
    const rewards = getRewards();
    
    const playerIndex = players.findIndex(p => p.id === request.playerId || (p.name === request.playerName && p.roomId === request.roomId));
    if (playerIndex >= 0) {
      const pointsToRefund = Number(request.pointsUsed) || 0;
      players[playerIndex].rewardPoints = (players[playerIndex].rewardPoints || 0) + pointsToRefund;
      players[playerIndex].totalSpent = Math.max(0, (players[playerIndex].totalSpent || 0) - pointsToRefund);
      players[playerIndex].updatedAt = new Date().toISOString();
      setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
    }
    
    const rewardIndex = rewards.findIndex(r => r.id === request.rewardId || r.name === request.rewardSnapshot?.name);
    if (rewardIndex >= 0) {
      const currentRemaining = Number(rewards[rewardIndex].remainingStock) || 0;
      const maxStock = Number(rewards[rewardIndex].stock) || 1;
      rewards[rewardIndex].remainingStock = Math.min(maxStock, currentRemaining + 1);
      rewards[rewardIndex].updatedAt = new Date().toISOString();
      setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
    }
  }

  // إذا تم التراجع عن الرفض (من مرفوض إلى مقبول/معلق/مسلم) -> نخصم النقاط والمخزون مرة أخرى
  if (oldStatus === 'rejected' && newStatus !== 'rejected') {
    const players = getAllPlayers();
    const rewards = getRewards();
    
    const playerIndex = players.findIndex(p => p.id === request.playerId || (p.name === request.playerName && p.roomId === request.roomId));
    if (playerIndex >= 0) {
      const pointsToDeduct = Number(request.pointsUsed) || 0;
      players[playerIndex].rewardPoints = Math.max(0, (players[playerIndex].rewardPoints || 0) - pointsToDeduct);
      players[playerIndex].totalSpent = (players[playerIndex].totalSpent || 0) + pointsToDeduct;
      players[playerIndex].updatedAt = new Date().toISOString();
      setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
    }
    
    const rewardIndex = rewards.findIndex(r => r.id === request.rewardId || r.name === request.rewardSnapshot?.name);
    if (rewardIndex >= 0) {
      const currentRemaining = Number(rewards[rewardIndex].remainingStock) || 0;
      rewards[rewardIndex].remainingStock = Math.max(0, currentRemaining - 1);
      rewards[rewardIndex].updatedAt = new Date().toISOString();
      setLocalItem(KEYS.REWARDS, JSON.stringify(rewards));
    }
  }

  request.status = newStatus;
  request.updatedAt = new Date().toISOString();
  if (newStatus === 'delivered') {
    request.deliveredAt = new Date().toISOString();
  }
  
  setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(requests));
  window.dispatchEvent(new Event('db_sync'));
  return { success: true };
};

export const deletePrizeRequest = (requestId) => {
  let requests = getAllPrizeRequests();
  const req = requests.find(r => r.id === requestId);
  if (req) {
    if (req.status !== 'rejected') {
      updatePrizeRequestStatus(requestId, 'rejected');
      requests = getAllPrizeRequests();
    }
    const updated = requests.filter(r => r.id !== requestId);
    setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('db_sync'));
  }
  return getAllPrizeRequests();
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

  // تحديث نقاط اللاعب (بين 0 والهدف الأقصى)
  const { targetPoints: tp, boardSize: bs } = getGameSettings();
  const pps = tp / bs;
  let newPoints = Math.max(0, Math.min(tp, player.points + pointsApplied));
  player.points = newPoints;
  player.lastCardApplied = card.name;
  player.updatedAt = new Date().toISOString();

  // حساب الخانة التقديرية (بين 1 وعدد خانات الخريطة)
  let tentativePosition = 1 + Math.floor(newPoints / pps);
  if (tentativePosition > bs) tentativePosition = bs;
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
    if (boardEvent.endPosition === bs) {
      player.points = tp;
    } else {
      player.points = (boardEvent.endPosition - 1) * pps;
    }
  }

  // التحقق من حالة الفوز
  let isNewWinner = false;
  if (player.points >= tp && !player.hasFinished) {
    player.hasFinished = true;
    player.points = tp;
    player.position = bs;
    
    // إذا لم يكن هناك فائز في هذه الغرفة بعد، يتم تسجيله
    if (!room.winnerId) {
      room.winnerId = player.id;
      room.status = 'finished';
      isNewWinner = true;
    }
  } else if (player.points < tp) {
    player.hasFinished = false;
    // إذا كان هو الفائز المسجل وتراجعت نقاطه، يتم إخلاء خانة الفائز وتنشيط الغرفة مجدداً
    if (room.winnerId === player.id) {
      room.winnerId = null;
      room.status = 'active';
    }
  }

  // تحديث رصيد المشتريات ومجموع نقاط الموسم
  // يتأثر فقط بقيمة البطاقة المطبّقة (pointsApplied = قيمة البطاقة الخام قبل السلم/الأفعى)
  // rewardPoints يُشتق دائماً من totalCollectedPoints - totalSpent لضمان الاتساق مع recalculate
  player.totalCollectedPoints = Math.max(0, (player.totalCollectedPoints || 0) + pointsApplied);
  player.rewardPoints = player.totalCollectedPoints - (player.totalSpent || 0);


  // تحديث البيانات في LocalStorage
  setLocalItem(KEYS.PLAYERS, JSON.stringify(players));
  setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
  
  // إعادة حساب الترتيب ونسب التقدم للغرفة
  recalculateRanks(roomId);

  // تسجيل العملية في السجل
  // cardValue = قيمة البطاقة الخام (للمتجر ونقاط المكافآت)
  // pointsApplied = التغيير الفعلي في نقاط الخريطة شاملاً السلم والأفعى (للعرض)
  const newLog = {
    id: generateId(),
    roomId,
    playerId,
    playerName: player.name,
    cardName: card.name,
    cardValue: pointsApplied,                  // قيمة البطاقة الخام (بدون السلم/الأفعى)
    pointsApplied: player.points - oldPoints,   // التغيير الفعلي في الخريطة (شاملاً السلم/الأفعى)
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

  const players = getAllPlayers();
  const player = players.find(p => p.id === lastLog.playerId || (p.name === lastLog.playerName && p.roomId === lastLog.roomId));
  
  if (player) {
    const playerLogs = remainingLogs
      .filter(l => l.playerId === player.id || (l.playerName === player.name && l.roomId === player.roomId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // إعادة الحساب التراكمي للاعب من نقطة الصفر
    let points = 0;
    let totalCollectedPoints = 0;
    let position = 1;
    let lastCardApplied = null;
    let hasFinished = false;

    const events = getBoardEvents();
    const cards = getCards();
    const { targetPoints: utp, boardSize: ubs } = getGameSettings();
    const upps = utp / ubs;

    const cardValueByName = {};
    cards.forEach(c => { if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value; });

    playerLogs.forEach(log => {
      let rawCardValue;
      if (log.cardValue !== undefined && log.cardValue !== null) {
        rawCardValue = log.cardValue;
      } else if (cardValueByName[log.cardName] !== undefined) {
        rawCardValue = cardValueByName[log.cardName];
      } else {
        rawCardValue = log.pointsApplied;
      }

      totalCollectedPoints = Math.max(0, totalCollectedPoints + rawCardValue);
      points = Math.max(0, Math.min(utp, points + rawCardValue));
      
      let tempPos = Math.min(ubs, 1 + Math.floor(points / upps));
      position = tempPos;

      const ev = events.find(e => e.startPosition === position);
      if (ev) {
        position = ev.endPosition;
        if (ev.endPosition === ubs) {
          points = utp;
          hasFinished = true;
        } else {
          points = (ev.endPosition - 1) * upps;
        }
      }

      if (points >= utp) { hasFinished = true; position = ubs; points = utp; }
      lastCardApplied = log.cardName;
    });

    const allPrizeRequests = getAllPrizeRequests();
    const playerPrizes = allPrizeRequests.filter(
      r => (r.playerId === player.id || (r.playerName === player.name && r.roomId === player.roomId)) &&
           r.status !== 'rejected' &&
           r.status !== 'cancelled'
    );
    const calculatedTotalSpent = playerPrizes.reduce((s, r) => s + (Number(r.pointsUsed) || 0), 0);

    player.points = points;
    player.totalCollectedPoints = totalCollectedPoints;
    player.totalSpent = calculatedTotalSpent;
    player.rewardPoints = Math.max(0, totalCollectedPoints - calculatedTotalSpent);
    player.position = position;
    player.lastCardApplied = lastCardApplied;
    player.hasFinished = hasFinished;
    player.updatedAt = new Date().toISOString();

    setLocalItem(KEYS.PLAYERS, JSON.stringify(players));

    const rooms = getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (room && room.winnerId === player.id && !hasFinished) {
      room.winnerId = null;
      room.status = 'active';
      setLocalItem(KEYS.ROOMS, JSON.stringify(rooms));
    }

    recalculateRanks(roomId);
  }

  window.dispatchEvent(new Event('db_sync'));
  return {
    success: true,
    players: getPlayers(roomId),
    rooms: getRooms()
  };
};

// --- إعادة حساب جميع اللاعبين من السجلات (Recalculate from Logs) ---
// هذه الدالة تعيد بناء حالة كل لاعب من نقطة الصفر بناءً على سجل العمليات الصحيح
// وتضمن أن نقاط الخريطة ونقاط المتجر صحيحة ومستقلتان
export const recalculateAllFromLogs = () => {
  try {
    const allLogs = getAllLogs();
    const allPlayers = getAllPlayers();
    const allPrizeRequests = getAllPrizeRequests();
    const events = getBoardEvents();
    const cards = getCards();
    const { targetPoints: tp, boardSize: bs } = getGameSettings();
    const pps = tp / bs;

    // جدول البحث: اسم البطاقة → قيمتها الحالية (للسجلات القديمة بدون cardValue)
    const cardValueByName = {};
    cards.forEach(c => { if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value; });

    const updatedPlayers = allPlayers.map(player => {
      const playerLogs = allLogs
        .filter(l => l.playerId === player.id || (l.playerName === player.name && l.roomId === player.roomId))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      let points = 0;
      let totalCollectedPoints = 0;
      let position = 1;
      let lastCardApplied = null;
      let hasFinished = false;

      playerLogs.forEach(log => {
        // استخراج القيمة الخام للبطاقة بالأولوية:
        // 1. log.cardValue (الحقل الحديث – قيمة البطاقة قبل أي سلم/أفعى)
        // 2. قيمة البطاقة الحالية من قائمة البطاقات بالاسم (للسجلات القديمة)
        // 3. log.pointsApplied كآخر مورد فقط
        let rawCardValue;
        if (log.cardValue !== undefined && log.cardValue !== null) {
          rawCardValue = log.cardValue;
        } else if (cardValueByName[log.cardName] !== undefined) {
          rawCardValue = cardValueByName[log.cardName];
        } else {
          rawCardValue = log.pointsApplied;
        }

        // نقاط المتجر: القيمة الخام فقط (لا تتأثر بالسلم/الأفعى)
        totalCollectedPoints = Math.max(0, totalCollectedPoints + rawCardValue);

        // نقاط الخريطة: تبنى من القيمة الخام ثم يُطبَّق السلم/الأفعى
        points = Math.max(0, Math.min(tp, points + rawCardValue));

        let tempPos = Math.min(bs, 1 + Math.floor(points / pps));
        position = tempPos;

        // تطبيق السلم/الأفعى على الجميع
        const ev = events.find(e => e.startPosition === position);
        if (ev) {
          position = ev.endPosition;
          if (ev.endPosition === bs) {
            points = tp;
            hasFinished = true;
          } else {
            points = (ev.endPosition - 1) * pps;
          }
        }

        if (points >= tp) { hasFinished = true; position = bs; points = tp; }
        lastCardApplied = log.cardName;
      });

      // حساب المصروف الحقيقي من سجلات طلبات المتجر مباشرة
      // نُدرج كل الطلبات ما عدا المرفوضة أو الملغاة
      const playerPrizes = allPrizeRequests.filter(
        r => (r.playerId === player.id || (r.playerName === player.name && r.roomId === player.roomId)) &&
             r.status !== 'rejected' &&
             r.status !== 'cancelled'
      );
      const calculatedTotalSpent = playerPrizes.reduce(
        (sum, r) => sum + (Number(r.pointsUsed) || 0), 0
      );

      // rewardPoints النهائي = إجمالي المجمع - المنفق الحقيقي في المتجر
      const finalRewardPoints = Math.max(0, totalCollectedPoints - calculatedTotalSpent);

      return {
        ...player,
        points,
        rewardPoints: finalRewardPoints,
        totalCollectedPoints: Math.max(0, totalCollectedPoints),
        totalSpent: calculatedTotalSpent,
        position,
        progressPercentage: Math.min(100, Math.round((points / tp) * 100)),
        lastCardApplied,
        hasFinished
      };
    });

    setLocalItem(KEYS.PLAYERS, JSON.stringify(updatedPlayers));

    // إعادة حساب الرتب لكل غرفة
    const rooms = getRooms();
    rooms.forEach(room => recalculateRanks(room.id));

    // تحديث تاريخ آخر نشاط لكل غرفة بناءً على آخر سجل موجود فعلياً
    const currentLogs = getAllLogs();
    const roomsWithUpdatedDates = getRooms().map(room => {
      const roomLogs = currentLogs.filter(l => l.roomId === room.id);
      if (roomLogs.length > 0) {
        const latestLog = roomLogs.reduce((latest, log) =>
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        return { ...room, lastUsedAt: latestLog.timestamp };
      }
      return room;
    });
    setLocalItem(KEYS.ROOMS, JSON.stringify(roomsWithUpdatedDates));

    window.dispatchEvent(new Event('db_sync'));
    return { success: true, count: updatedPlayers.length };
  } catch(e) {
    console.error('recalculateAllFromLogs error:', e);
    return { success: false, error: e.message };
  }
};

// --- إعادة حساب شاملة للطلاب من السجلات مع التوزيع الجديد للسلالم والأفاعي ---
// تختلف عن recalculateAllFromLogs في أنها تعيد تطبيق السلالم/الأفاعي على جميع السجلات
// (القديمة والجديدة) باستخدام القيمة الخام للبطاقة دائماً.
// تُستخدم عند تغيير توزيع السلالم والأفاعي لضمان انعكاس التغيير على جميع الطلاب.
export const recalculateFromLogsWithNewEvents = () => {
  try {
    const allLogs = getAllLogs();
    const allPlayers = getAllPlayers();
    const allPrizeRequests = getAllPrizeRequests();
    const events = getBoardEvents();
    const cards = getCards();
    const { targetPoints: tp, boardSize: bs } = getGameSettings();
    const pps = tp / bs;

    const cardValueByName = {};
    cards.forEach(c => { if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value; });

    const updatedPlayers = allPlayers.map(player => {
      const playerLogs = allLogs
        .filter(l => l.playerId === player.id || (l.playerName === player.name && l.roomId === player.roomId))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      let points = 0;
      let totalCollectedPoints = 0;
      let position = 1;
      let lastCardApplied = null;
      let hasFinished = false;

      playerLogs.forEach(log => {
        let rawValue;
        if (log.cardValue !== undefined && log.cardValue !== null) {
          rawValue = log.cardValue;
        } else if (cardValueByName[log.cardName] !== undefined) {
          rawValue = cardValueByName[log.cardName];
        } else {
          rawValue = log.pointsApplied;
        }

        points = Math.max(0, Math.min(tp, points + rawValue));
        totalCollectedPoints = Math.max(0, totalCollectedPoints + rawValue);

        // حساب الموقع من النقاط
        let tempPos = Math.min(bs, 1 + Math.floor(points / pps));
        position = tempPos;

        // تطبيق السلم/الأفعى الجديد على الجميع (قديم وجديد)
        const ev = events.find(e => e.startPosition === position);
        if (ev) {
          position = ev.endPosition;
          if (ev.endPosition === bs) {
            points = tp;
            hasFinished = true;
          } else {
            points = (ev.endPosition - 1) * pps;
          }
        }

        if (points >= tp) { hasFinished = true; position = bs; points = tp; }
        lastCardApplied = log.cardName;
      });

      // حساب المصروف من المتجر من سجلات الطلبات
      const playerPrizes = allPrizeRequests.filter(
        r => (r.playerId === player.id || (r.playerName === player.name && r.roomId === player.roomId)) &&
             r.status !== 'rejected' &&
             r.status !== 'cancelled'
      );
      const calculatedTotalSpent = playerPrizes.reduce(
        (sum, r) => sum + (Number(r.pointsUsed) || 0), 0
      );
      const finalRewardPoints = Math.max(0, totalCollectedPoints - calculatedTotalSpent);

      return {
        ...player,
        points,
        rewardPoints: finalRewardPoints,
        totalCollectedPoints: Math.max(0, totalCollectedPoints),
        totalSpent: calculatedTotalSpent,
        position,
        progressPercentage: Math.min(100, Math.round((points / tp) * 100)),
        lastCardApplied,
        hasFinished
      };
    });

    setLocalItem(KEYS.PLAYERS, JSON.stringify(updatedPlayers));

    // إعادة حساب الرتب لكل غرفة
    const rooms = getRooms();
    rooms.forEach(room => recalculateRanks(room.id));

    // تحديث تاريخ آخر نشاط لكل غرفة
    const currentLogs = getAllLogs();
    const roomsWithUpdatedDates = getRooms().map(room => {
      const roomLogs = currentLogs.filter(l => l.roomId === room.id);
      if (roomLogs.length > 0) {
        const latestLog = roomLogs.reduce((latest, log) =>
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        return { ...room, lastUsedAt: latestLog.timestamp };
      }
      return room;
    });
    setLocalItem(KEYS.ROOMS, JSON.stringify(roomsWithUpdatedDates));

    window.dispatchEvent(new Event('db_sync'));
    return { success: true, count: updatedPlayers.length };
  } catch(e) {
    console.error('recalculateFromLogsWithNewEvents error:', e);
    return { success: false, error: e.message };
  }
};

// --- إعادة تشغيل كاملة من السجلات من نقطة الصفر مع التوزيع الجديد للسلالم والأفاعي ---
// تحذف نقاط كل طالب وتعيد بناءها بطاقةً بطاقة من سجل العمليات.
// المصدر: log.cardValue (القيمة الخام) → إذا غير موجود → قيمة البطاقة الحالية بالاسم → آخر مورد: log.pointsApplied
// بعد كل بطاقة: يُطبَّق التوزيع الجديد للسلالم/الأفاعي على الخانة.
// لا تُعدّل: totalCollectedPoints للمتجر، rewardPoints، totalSpent.
export const replayAllLogsCorrectly = () => {
  try {
    const allLogs = getAllLogs();
    const allPlayers = getAllPlayers();
    const allPrizeRequests = getAllPrizeRequests();
    const events = getBoardEvents(); // التوزيع الجديد
    const cards = getCards();
    const { targetPoints: tp, boardSize: bs } = getGameSettings();
    const pps = tp / bs;

    // جدول البحث: اسم البطاقة → قيمتها الحالية (للسجلات القديمة بدون cardValue)
    const cardValueByName = {};
    cards.forEach(c => { if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value; });

    const updatedPlayers = allPlayers.map(player => {
      const playerLogs = allLogs
        .filter(l => l.playerId === player.id || (l.playerName === player.name && l.roomId === player.roomId))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      let points = 0;              // نقاط الخريطة (تتأثر بالسلم/الأفعى)
      let rawTotal = 0;            // مجموع قيم البطاقات الخام فقط
      let position = 1;
      let lastCardApplied = null;
      let hasFinished = false;

      playerLogs.forEach(log => {
        // استخراج القيمة الخام للبطاقة بالأولوية:
        // 1. log.cardValue (الحقل الحديث – قيمة البطاقة قبل أي سلم/أفعى)
        // 2. قيمة البطاقة الحالية من قائمة البطاقات (للسجلات القديمة)
        // 3. log.pointsApplied كآخر مورد (قد يشمل تأثير السلم القديم)
        let rawValue;
        if (log.cardValue !== undefined && log.cardValue !== null) {
          rawValue = log.cardValue;
        } else if (cardValueByName[log.cardName] !== undefined) {
          rawValue = cardValueByName[log.cardName];
        } else {
          rawValue = log.pointsApplied;
        }

        // تراكم النقاط الخام (للمتجر – لا تتأثر بالسلم/الأفعى)
        rawTotal += rawValue;

        // تطبيق النقطة على الخريطة
        points = Math.max(0, Math.min(tp, points + rawValue));

        // حساب الخانة الخام من النقاط
        let tempPos = Math.min(bs, 1 + Math.floor(points / pps));
        position = tempPos;

        // تطبيق السلم أو الأفعى الجديد
        const ev = events.find(e => e.startPosition === position);
        if (ev) {
          position = ev.endPosition;
          if (ev.endPosition === bs) {
            points = tp;
            hasFinished = true;
          } else {
            points = (ev.endPosition - 1) * pps;
          }
        }

        if (points >= tp) { hasFinished = true; position = bs; points = tp; }
        lastCardApplied = log.cardName;
      });

      // حساب نقاط المتجر من سجلات الطلبات فقط
      const playerPrizes = allPrizeRequests.filter(
        r => (r.playerId === player.id || (r.playerName === player.name && r.roomId === player.roomId)) &&
             r.status !== 'rejected' &&
             r.status !== 'cancelled'
      );
      const totalSpent = playerPrizes.reduce((sum, r) => sum + (Number(r.pointsUsed) || 0), 0);
      const rewardPoints = Math.max(0, rawTotal - totalSpent);

      return {
        ...player,
        points,
        rewardPoints,
        totalCollectedPoints: Math.max(0, rawTotal),
        totalSpent,
        position,
        progressPercentage: Math.min(100, Math.round((points / tp) * 100)),
        lastCardApplied,
        hasFinished
      };
    });

    setLocalItem(KEYS.PLAYERS, JSON.stringify(updatedPlayers));

    const rooms = getRooms();
    rooms.forEach(room => recalculateRanks(room.id));

    const currentLogs = getAllLogs();
    const roomsWithUpdatedDates = getRooms().map(room => {
      const roomLogs = currentLogs.filter(l => l.roomId === room.id);
      if (roomLogs.length > 0) {
        const latestLog = roomLogs.reduce((latest, log) =>
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        return { ...room, lastUsedAt: latestLog.timestamp };
      }
      return room;
    });
    setLocalItem(KEYS.ROOMS, JSON.stringify(roomsWithUpdatedDates));

    window.dispatchEvent(new Event('db_sync'));
    return { success: true, count: updatedPlayers.length };
  } catch(e) {
    console.error('replayAllLogsCorrectly error:', e);
    return { success: false, error: e.message };
  }
};

// --- إعادة حساب مواقع الطلاب من totalCollectedPoints (الأسلوب الصحيح) ---
// totalCollectedPoints = مجموع قيم البطاقات الخام فقط، لا يتأثر أبداً بالسلالم/الأفاعي.
// هذه الدالة هي الطريقة الصحيحة لإعادة حساب المواقع بعد تغيير توزيع السلالم والأفاعي.
// لا تُعدّل: rewardPoints، totalCollectedPoints، totalSpent، السجلات، أسماء الطلاب.
export const recalculatePositionsFromTotalPoints = () => {
  try {
    const allPlayers = getAllPlayers();
    const events = getBoardEvents();
    const { targetPoints: tp, boardSize: bs } = getGameSettings();
    const pps = tp / bs;

    const updated = allPlayers.map(player => {
      // النقاط الحقيقية = totalCollectedPoints (مجموع البطاقات الخام بدون سلالم/أفاعي)
      // نرجع لـ player.points كاحتياط إذا لم يكن totalCollectedPoints موجوداً
      const truePoints = Math.max(0, Math.min(tp,
        player.totalCollectedPoints != null
          ? player.totalCollectedPoints
          : (player.points || 0)
      ));

      // نسبة التقدم الحقيقية مبنية على النقاط الخام (ثابتة، لا تتغير بالسلالم/الأفاعي)
      const progress = Math.min(100, Math.round((truePoints / tp) * 100));

      // حساب الخانة الخام من النقاط الحقيقية
      let rawPos = Math.min(bs, 1 + Math.floor(truePoints / pps));

      // تطبيق السلم أو الأفعى إذا وقعت على خانة حدث
      const ev = events.find(e => e.startPosition === rawPos);
      let finalPos = rawPos;
      let mapPoints = truePoints;

      if (ev) {
        finalPos = ev.endPosition;
        mapPoints = ev.endPosition === bs ? tp : (ev.endPosition - 1) * pps;
      }

      // إذا أكمل الطالب الخريطة
      const hasFinished = truePoints >= tp;
      if (hasFinished) {
        finalPos = bs;
        mapPoints = tp;
      }

      return {
        ...player,
        points: mapPoints,          // نقاط الخريطة (قد تختلف بسبب السلم/الأفعى)
        position: finalPos,          // الخانة النهائية على الخريطة
        progressPercentage: progress, // النسبة مبنية على النقاط الحقيقية دائماً
        hasFinished
        // لا نُعدّل: rewardPoints, totalCollectedPoints, totalSpent
      };
    });

    setLocalItem(KEYS.PLAYERS, JSON.stringify(updated));

    // إعادة حساب الرتب لكل غرفة
    const rooms = getRooms();
    rooms.forEach(room => recalculateRanks(room.id));

    window.dispatchEvent(new Event('db_sync'));
    return { success: true, count: updated.length };
  } catch(e) {
    console.error('recalculatePositionsFromTotalPoints error:', e);
    return { success: false, error: e.message };
  }
};

// --- استعادة البيانات لتاريخ محدد (Restore to Date) ---
// تُعيد هذه الدالة بناء حالة كل طالب بناءً على سجلات العمليات والمشتريات قبل تاريخ قطع محدد فقط
// تُلغي أي عمليات أو مشتريات بعد هذا التاريخ
export const recalculateFromLogsBeforeDate = (cutoffDateISO) => {
  try {
    const cutoff = new Date(cutoffDateISO);
    const allLogs = getAllLogs();
    const allPlayers = getAllPlayers();
    const allPrizeRequests = getAllPrizeRequests();
    const events = getBoardEvents();
    const cards = getCards();
    const { targetPoints: tp, boardSize: bs } = getGameSettings();
    const pps = tp / bs;

    // جدول البحث: اسم البطاقة → قيمتها (للسجلات القديمة بدون cardValue)
    const cardValueByName = {};
    cards.forEach(c => { if (c.value !== null && c.value !== undefined) cardValueByName[c.name] = c.value; });

    // المشتريات قبل تاريخ القطع فقط (كل الحالات ما عدا المرفوضة والملغاة)
    const validPrizeRequests = allPrizeRequests.filter(r => {
      const reqDate = new Date(r.createdAt || r.updatedAt || '2000-01-01');
      return reqDate < cutoff;
    });

    const updatedPlayers = allPlayers.map(player => {
      // فلترة سجلات هذا الطالب قبل تاريخ القطع فقط
      const playerLogs = allLogs
        .filter(l => l.playerId === player.id && new Date(l.timestamp) < cutoff)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      let points = 0;
      let totalCollectedPoints = 0;
      let position = 1;
      let lastCardApplied = null;
      let hasFinished = false;

      playerLogs.forEach(log => {
        // استخراج القيمة الخام للبطاقة بالأولوية:
        // 1. log.cardValue (الحقل الحديث)
        // 2. قيمة البطاقة بالاسم من قائمة البطاقات الحالية
        // 3. log.pointsApplied كملاذ أخير فقط
        let rawCardValue;
        if (log.cardValue !== undefined && log.cardValue !== null) {
          rawCardValue = log.cardValue;
        } else if (cardValueByName[log.cardName] !== undefined) {
          rawCardValue = cardValueByName[log.cardName];
        } else {
          rawCardValue = log.pointsApplied;
        }

        // نقاط المتجر: القيمة الخام دائماً (لا تتأثر بالسلم/الأفعى)
        totalCollectedPoints = Math.max(0, totalCollectedPoints + rawCardValue);

        // نقاط الخريطة: القيمة الخام + تطبيق السلم/الأفعى
        points = Math.max(0, Math.min(tp, points + rawCardValue));

        let tempPos = Math.min(bs, 1 + Math.floor(points / pps));
        position = tempPos;

        // تطبيق السلم/الأفعى
        const ev = events.find(e => e.startPosition === position);
        if (ev) {
          position = ev.endPosition;
          if (ev.endPosition === bs) { points = tp; hasFinished = true; }
          else { points = (ev.endPosition - 1) * pps; }
        }

        if (points >= tp) { hasFinished = true; position = bs; points = tp; }
        lastCardApplied = log.cardName;
      });

      // حساب المصروف في المتجر قبل تاريخ القطع فقط
      const playerPrizesBeforeCutoff = validPrizeRequests.filter(
        r => r.playerId === player.id &&
             r.status !== 'rejected' &&
             r.status !== 'cancelled'
      );
      const totalSpentBeforeCutoff = playerPrizesBeforeCutoff.reduce(
        (sum, r) => sum + (r.pointsUsed || 0), 0
      );

      // الرصيد النهائي = المجموع المجمّع - المصروف
      const finalRewardPoints = Math.max(0, totalCollectedPoints - totalSpentBeforeCutoff);

      return {
        ...player,
        points,
        rewardPoints: finalRewardPoints,
        totalCollectedPoints: Math.max(0, totalCollectedPoints),
        totalSpent: totalSpentBeforeCutoff,
        position,
        progressPercentage: Math.min(100, Math.round((points / tp) * 100)),
        lastCardApplied,
        hasFinished
      };
    });

    // حفظ اللاعبين المُحدَّثين
    setLocalItem(KEYS.PLAYERS, JSON.stringify(updatedPlayers));

    // فلترة سجلات العمليات — الاحتفاظ فقط بالسجلات قبل تاريخ القطع
    const logsBeforeCutoff = allLogs.filter(l => new Date(l.timestamp) < cutoff);
    setLocalItem(KEYS.LOGS, JSON.stringify(logsBeforeCutoff));

    // فلترة طلبات المتجر — الاحتفاظ فقط بالطلبات قبل تاريخ القطع
    setLocalItem(KEYS.PRIZE_REQUESTS, JSON.stringify(validPrizeRequests));

    // إعادة حساب الرتب لكل غرفة وتحديث تاريخ آخر نشاط
    const rooms = getRooms();
    const roomsWithUpdatedDates = rooms.map(room => {
      const roomLogs = logsBeforeCutoff.filter(l => l.roomId === room.id);
      if (roomLogs.length > 0) {
        const latestLog = roomLogs.reduce((latest, log) =>
          new Date(log.timestamp) > new Date(latest.timestamp) ? log : latest
        );
        return { ...room, lastUsedAt: latestLog.timestamp };
      }
      return room;
    });
    setLocalItem(KEYS.ROOMS, JSON.stringify(roomsWithUpdatedDates));
    roomsWithUpdatedDates.forEach(room => recalculateRanks(room.id));

    window.dispatchEvent(new Event('db_sync'));

    const removedLogs = allLogs.length - logsBeforeCutoff.length;
    const removedPrizes = allPrizeRequests.length - validPrizeRequests.length;
    return {
      success: true,
      playersCount: updatedPlayers.length,
      removedLogs,
      removedPrizes
    };
  } catch(e) {
    console.error('recalculateFromLogsBeforeDate error:', e);
    return { success: false, error: e.message };
  }
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
    prizeRequests: getAllPrizeRequests(),
    settings: getGameSettings()
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
    if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));

    // إعادة ضبط الرتب للجميع للاطمئنان
    data.rooms.forEach(room => {
      recalculateRanks(room.id);
    });

    return { success: true, message: "تم استيراد البيانات بنجاح وتحديث كافة الإحصائيات" };
  } catch (error) {
    return { success: false, message: "حدث خطأ أثناء معالجة ملف البيانات: " + error.message };
  }
};
