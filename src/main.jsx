import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { recalculatePositionsFromTotalPoints } from './db/database.js'

// --- Migration v3: إعادة حساب مواقع الطلاب من totalCollectedPoints ---
// الطريقة الصحيحة: totalCollectedPoints يحتوي النقاط الحقيقية بدون تأثير سلالم/أفاعي
// يعمل مرة واحدة فقط (يُشغَّل عند أول فتح للتطبيق بعد تغيير التوزيع)
const RECALC_KEY_V3 = 'player_pos_recalc_v3';
if (!localStorage.getItem(RECALC_KEY_V3)) {
  try {
    recalculatePositionsFromTotalPoints();
    localStorage.setItem(RECALC_KEY_V3, '1');
    console.log('[Migration v3] Player positions fixed from totalCollectedPoints ✅');
  } catch(e) {
    console.error('[Migration v3] Failed:', e);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
