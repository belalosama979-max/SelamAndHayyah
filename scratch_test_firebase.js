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

async function checkData() {
  const keys = ['aqsa_game_rooms', 'aqsa_game_players', 'aqsa_game_logs'];
  for (const key of keys) {
    const docRef = doc(db, "data", key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log(`Key: ${key}`);
      console.log(`Last Updated: ${data.lastUpdated} (Date: ${new Date(data.lastUpdated).toISOString()})`);
      const val = JSON.parse(data.value);
      console.log(`Array Length: ${val.length}`);
      if (val.length > 0) {
        console.log(`Sample item:`, val[0]);
      }
    } else {
      console.log(`Key: ${key} does not exist in Firestore!`);
    }
    console.log('-----------------');
  }
  process.exit(0);
}

checkData();
