import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { replayAllLogsCorrectly } from './db/database.js'

// --- Migration v4: Replay كامل للسجلات من نقطة الصفر مع التوزيع الجديد ---
// يحذف نقاط كل طالب ويعيد بناءها بطاقةً بطاقة.
// يستخدم log.cardValue (القيمة الخام) → اسم البطاقة → آخر مورد.
// بعد كل بطاقة: يُطبَّق التوزيع الجديد للسلالم/الأفاعي.
// يعمل مرة واحدة فقط عند أول فتح للتطبيق.
const RECALC_KEY_V4 = 'player_replay_v4';
if (!localStorage.getItem(RECALC_KEY_V4)) {
  try {
    replayAllLogsCorrectly();
    localStorage.setItem(RECALC_KEY_V4, '1');
    console.log('[Migration v4] Full log replay with new board events ✅');
  } catch(e) {
    console.error('[Migration v4] Failed:', e);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
