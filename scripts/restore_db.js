import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function restore() {
  const backupData = JSON.parse(fs.readFileSync('./fixed_db.json', 'utf8'));

  for (const key of Object.keys(backupData)) {
    try {
      const data = backupData[key];
      await setDoc(doc(db, "data", key), {
        value: JSON.stringify(data.value || []),
        // Force override the 9999999999999 timestamp from the old migration!
        lastUpdated: 9999999999999 + Date.now() 
      });
      console.log(`Successfully uploaded ${key}`);
    } catch (e) {
      console.error(`Error uploading ${key}:`, e);
    }
  }
  console.log('Restore completed successfully.');
  process.exit(0);
}

restore();
