import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjTcigTLFNcNxALsGU_Apv3Z7zvcA86Ys",
  authDomain: "selamandhayyah.firebaseapp.com",
  projectId: "selamandhayyah",
  storageBucket: "selamandhayyah.firebasestorage.app",
  messagingSenderId: "414616915163",
  appId: "1:414616915163:web:82ea1bb96745cf5d4390fe"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const KEYS = [
  'aqsa_game_rooms',
  'aqsa_game_players',
  'aqsa_game_cards',
  'aqsa_game_board_events',
  'aqsa_game_action_logs',
  'aqsa_game_rewards',
  'aqsa_game_prize_requests'
];

async function backup() {
  const backupData = {};
  for (const key of KEYS) {
    try {
      const snap = await getDoc(doc(db, "data", key));
      if (snap.exists()) {
        const data = snap.data();
        backupData[key] = {
          lastUpdated: data.lastUpdated,
          value: JSON.parse(data.value || '[]')
        };
      } else {
        backupData[key] = { value: [] };
      }
    } catch (e) {
      console.error(`Error fetching ${key}:`, e);
      backupData[key] = { value: [] };
    }
  }
  
  fs.writeFileSync('./backup_db.json', JSON.stringify(backupData, null, 2));
  console.log('Backup created successfully at backup_db.json');
  process.exit(0);
}

backup();
