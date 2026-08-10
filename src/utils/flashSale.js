// ============================================================
// Flash Sale System - نظام التخفيضات السريعة
// ============================================================
// يعمل فقط خلال فترة محددة (ساعتين)
// يطبق خصومات على النقاط بناءً على سعر الجائزة الأصلي بالدنانير

// ── إعدادات فترة التخفيض ──────────────────────────────────────
// التاريخ: 8 أغسطس 2026 - من 3:00 مساءً إلى 5:00 مساءً (توقيت الأردن +3)
const SALE_START = new Date('2026-08-08T15:00:00+03:00');
const SALE_END = new Date('2026-08-08T16:00:00+03:00');

// ── استخراج السعر بالدنانير من وصف الجائزة ────────────────────
function extractPriceFromDescription(description) {
  if (!description) return null;
  // يبحث عن أنماط مثل "5 دنانير" أو "1.5 دينار" أو "0.5 دينار"
  const match = description.match(/([\d.]+)\s*دن?[اي]/);
  if (match) return parseFloat(match[1]);
  return null;
}

// ── قائمة الجوائز المستثناة من الخصم ──────────────────────────
const EXCLUDED_ITEMS = ['بلوزة'];

// ── حساب النقاط بعد الخصم لجائزة واحدة ───────────────────────
export function getDiscountedPoints(reward) {
  // لا تطبق الخصم على العناصر المستثناة
  if (EXCLUDED_ITEMS.includes(reward.name)) {
    return null; // لا خصم
  }

  const priceJD = extractPriceFromDescription(reward.description);
  if (priceJD === null) return null; // لا يمكن تحديد السعر

  let discountedPriceJD = null;

  if (priceJD === 5) {
    // 5 دنانير → 4.25 دنانير
    discountedPriceJD = 4.25;
  } else if (priceJD === 6) {
    // 6 دنانير → 5.25 دنانير
    discountedPriceJD = 5.25;
  } else if (priceJD <= 3) {
    if (priceJD <= 0.60) {
      return null;
    }
    // 3 دنانير وأقل → خصم 60 قرش (0.60 دينار)
    discountedPriceJD = Math.max(0.1, priceJD - 0.60);
  } else {
    // أسعار أخرى (مثل 3.5, 7) → لا خصم
    return null;
  }

  // حساب النقاط الجديدة بناءً على النسبة
  // النسبة = نقاط / سعر أصلي → نقاط جديدة = نسبة × سعر جديد
  const ratio = reward.pointsCost / priceJD;
  const discountedPoints = Math.round(discountedPriceJD * ratio);

  return discountedPoints;
}

// ── التحقق من أن التخفيض نشط الآن ─────────────────────────────
export function isFlashSaleActive() {
  const now = new Date();
  return now >= SALE_START && now < SALE_END;
}

// ── الحصول على الوقت المتبقي للتخفيض ──────────────────────────
export function getTimeRemaining() {
  const now = new Date();

  if (now < SALE_START) {
    // لم يبدأ بعد
    return { active: false, started: false, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  if (now >= SALE_END) {
    // انتهى
    return { active: false, started: true, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const diff = SALE_END.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { active: true, started: true, hours, minutes, seconds, totalMs: diff };
}

// ── الحصول على النقاط الفعلية (مع أو بدون خصم) ─────────────────
export function getEffectivePointsCost(reward) {
  if (!isFlashSaleActive()) return reward.pointsCost;

  const discounted = getDiscountedPoints(reward);
  return discounted !== null ? discounted : reward.pointsCost;
}

// ── التحقق من أن الجائزة مشمولة بالخصم ─────────────────────────
export function isItemOnSale(reward) {
  if (!isFlashSaleActive()) return false;
  return getDiscountedPoints(reward) !== null;
}

// ── معلومات التخفيض الكاملة ─────────────────────────────────────
export function getSaleInfo() {
  return {
    startTime: SALE_START,
    endTime: SALE_END,
    isActive: isFlashSaleActive(),
    timeRemaining: getTimeRemaining(),
  };
}
