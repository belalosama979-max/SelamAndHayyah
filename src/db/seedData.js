// بيانات البداية الافتراضية للعبة (البطاقات والسلالم والأفاعي)

export const DEFAULT_CARDS = [
  // 1. بطاقات التجويد
  {
    id: "card-tajweed-1",
    name: "حضّر المطلوب",
    category: "تجويد",
    value: 20,
    color: "#0d9488", // Teal
    isEnabled: true,
    displayOrder: 1,
    isCustom: false
  },
  {
    id: "card-tajweed-2",
    name: "لم يحضّر المطلوب",
    category: "تجويد",
    value: -10,
    color: "#e11d48", // Rose/Red
    isEnabled: true,
    displayOrder: 2,
    isCustom: false
  },

  // 2. بطاقات الحفظ
  {
    id: "card-memorize-1",
    name: "ممتاز جداً",
    category: "حفظ",
    value: 60,
    color: "#059669", // Emerald
    isEnabled: true,
    displayOrder: 3,
    isCustom: false
  },
  {
    id: "card-memorize-2",
    name: "ممتاز",
    category: "حفظ",
    value: 50,
    color: "#10b981", // Green
    isEnabled: true,
    displayOrder: 4,
    isCustom: false
  },
  {
    id: "card-memorize-3",
    name: "جيد جداً",
    category: "حفظ",
    value: 30,
    color: "#3b82f6", // Blue
    isEnabled: true,
    displayOrder: 5,
    isCustom: false
  },
  {
    id: "card-memorize-4",
    name: "لم يكمل المطلوب",
    category: "حفظ",
    value: -10,
    color: "#f59e0b", // Amber
    isEnabled: true,
    displayOrder: 6,
    isCustom: false
  },
  {
    id: "card-memorize-5",
    name: "لم يسمع",
    category: "حفظ",
    value: -30,
    color: "#ef4444", // Red
    isEnabled: true,
    displayOrder: 7,
    isCustom: false
  },
  {
    id: "card-memorize-6",
    name: "أضاف على المطلوب",
    category: "حفظ",
    value: null, // قيمة متغيرة يحددها المستخدم
    color: "#8b5cf6", // Purple
    isEnabled: true,
    displayOrder: 8,
    isCustom: false
  },

  // 3. بطاقات المتابعات التربوية
  {
    id: "card-educational-1",
    name: "مجموع الصلوات",
    category: "متابعة تربوية",
    value: null, // قيمة متغيرة
    color: "#6366f1", // Indigo
    isEnabled: true,
    displayOrder: 9,
    isCustom: false
  },
  {
    id: "card-educational-2",
    name: "الحضور على الموعد",
    category: "متابعة تربوية",
    value: 20,
    color: "#059669",
    isEnabled: true,
    displayOrder: 10,
    isCustom: false
  },
  {
    id: "card-educational-3",
    name: "غياب بغير عذر",
    category: "متابعة تربوية",
    value: -30,
    color: "#dc2626",
    isEnabled: true,
    displayOrder: 11,
    isCustom: false
  },
  {
    id: "card-educational-4",
    name: "غياب بعذر أو تأخر",
    category: "متابعة تربوية",
    value: -10,
    color: "#ea580c", // Orange
    isEnabled: true,
    displayOrder: 12,
    isCustom: false
  },
  {
    id: "card-educational-5",
    name: "حضور نشاط",
    category: "متابعة تربوية",
    value: 20,
    color: "#06b6d4", // Cyan
    isEnabled: true,
    displayOrder: 13,
    isCustom: false
  },
  {
    id: "card-educational-6",
    name: "تم إنجاز تحدي الأسبوع",
    category: "متابعة تربوية",
    value: null, // قيمة متغيرة
    color: "#ec4899", // Pink
    isEnabled: true,
    displayOrder: 14,
    isCustom: false
  },
  {
    id: "card-educational-7",
    name: "لم ينجز تحدي الأسبوع",
    category: "متابعة تربوية",
    value: -50,
    color: "#991b1b", // Dark Red
    isEnabled: true,
    displayOrder: 15,
    isCustom: false
  },
  {
    id: "card-educational-8",
    name: "بطاقة سلوك",
    category: "متابعة تربوية",
    value: null, // قيمة متغيرة (تتحول للأحمر إذا سالبة والأخضر إذا موجبة)
    color: "#6b7280", // Gray افتراضي
    isEnabled: true,
    displayOrder: 16,
    isCustom: false
  },
  {
    id: "card-educational-9",
    name: "بطاقة تفاعل ومشاركة",
    category: "متابعة تربوية",
    value: null, // قيمة متغيرة (تتحول للأحمر إذا سالبة والأخضر إذا موجبة)
    color: "#6b7280", // Gray افتراضي
    isEnabled: true,
    displayOrder: 17,
    isCustom: false
  }
];

export const DEFAULT_BOARD_EVENTS = [
  // سلالم (Ladders)
  {
    id: "event-ladder-1",
    type: "ladder",
    startPosition: 3,
    endPosition: 22,
    description: "المحافظة على صلاة الفجر في جماعة"
  },
  {
    id: "event-ladder-2",
    type: "ladder",
    startPosition: 12,
    endPosition: 38,
    description: "حفظ ورد الحفظ الأسبوعي كاملاً"
  },
  {
    id: "event-ladder-3",
    type: "ladder",
    startPosition: 28,
    endPosition: 56,
    description: "بر الوالدين ومساعدتهم في المنزل"
  },
  {
    id: "event-ladder-4",
    type: "ladder",
    startPosition: 47,
    endPosition: 75,
    description: "التصدق والمشاركة في عمل تطوعي"
  },
  {
    id: "event-ladder-5",
    type: "ladder",
    startPosition: 70,
    endPosition: 92,
    description: "التفوق الدراسي ونشر الخير بين الزملاء"
  },

  // أفاعي (Snakes)
  {
    id: "event-snake-1",
    type: "snake",
    startPosition: 25,
    endPosition: 7,
    description: "التفوه بكلمات سيئة أو الغيبة"
  },
  {
    id: "event-snake-2",
    type: "snake",
    startPosition: 44,
    endPosition: 19,
    description: "إهمال الواجبات المدرسية والتكاسل"
  },
  {
    id: "event-snake-3",
    type: "snake",
    startPosition: 62,
    endPosition: 35,
    description: "عقوق الوالدين أو إساءة الأدب"
  },
  {
    id: "event-snake-4",
    type: "snake",
    startPosition: 86,
    endPosition: 53,
    description: "التخلف عن صلاة الجماعة لعدة أيام"
  },
  {
    id: "event-snake-5",
    type: "snake",
    startPosition: 97,
    endPosition: 73,
    description: "الكبر والغرور واحتقار الآخرين"
  }
];

export const DEFAULT_REWARDS = [
  { id: "reward-1", name: "كاميرا", pointsCost: 2000, description: "5 دنانير (متوسطة لكبيرة)", isFeatured: true, imageEmoji: "📸", remainingStock: 5 },
  { id: "reward-2", name: "ساعة ذكية", pointsCost: 2400, description: "6 دنانير (كبيرة)", isFeatured: true, imageEmoji: "⌚", remainingStock: 5 },
  { id: "reward-3", name: "كرة قدم (أصلية)", pointsCost: 1800, description: "5 دنانير (متوسطة لكبيرة)", isFeatured: true, imageEmoji: "⚽", remainingStock: 5 },
  { id: "reward-4", name: "كرة قدم (عادية)", pointsCost: 1500, description: "3 دنانير (متوسطة)", isFeatured: false, imageEmoji: "⚽", remainingStock: 10 },
  { id: "reward-5", name: "سيارة ريموت (كبيرة)", pointsCost: 2500, description: "7 دنانير (غالية)", isFeatured: true, imageEmoji: "🏎️", remainingStock: 3 },
  { id: "reward-6", name: "سيارة ريموت (متوسطة)", pointsCost: 1500, description: "3.5 دنانير (متوسطة)", isFeatured: false, imageEmoji: "🚗", remainingStock: 5 },
  { id: "reward-7", name: "يويو", pointsCost: 600, description: "1.5 دينار (خفيفة)", isFeatured: false, imageEmoji: "🪀", remainingStock: 15 },
  { id: "reward-8", name: "شطرنج (عادي)", pointsCost: 800, description: "2 دينار (خفيفة)", isFeatured: false, imageEmoji: "♟️", remainingStock: 10 },
  { id: "reward-9", name: "شطرنج (فاخر)", pointsCost: 1800, description: "5 دنانير (متوسطة لكبيرة)", isFeatured: true, imageEmoji: "♚", remainingStock: 5 },
  { id: "reward-10", name: "مضارب تنس", pointsCost: 1500, description: "3 دنانير (متوسطة)", isFeatured: false, imageEmoji: "🎾", remainingStock: 5 },
  { id: "reward-11", name: "مضارب ريشة", pointsCost: 1500, description: "3 دنانير (متوسطة)", isFeatured: false, imageEmoji: "🏸", remainingStock: 5 },
  { id: "reward-12", name: "وجبة شاورما (عادي)", pointsCost: 1200, description: "2 دينار (خفيفة لمتوسطة)", isFeatured: false, imageEmoji: "🌯", remainingStock: 20 },
  { id: "reward-13", name: "وجبة شاورما (سوبر)", pointsCost: 1500, description: "3 دنانير (متوسطة)", isFeatured: true, imageEmoji: "🥙", remainingStock: 20 },
  { id: "reward-14", name: "لعبة تركيب شخصيات", pointsCost: 400, description: "0.5 دينار (خفيفة)", isFeatured: false, imageEmoji: "🧩", remainingStock: 20 },
  { id: "reward-15", name: "أبو صالح", pointsCost: 1200, description: "2.5 دينار (خفيفة لمتوسطة)", isFeatured: false, imageEmoji: "🧸", remainingStock: 10 },
  { id: "reward-16", name: "مكعب روبيك (أصلي)", pointsCost: 1000, description: "2 دينار (خفيفة لمتوسطة)", isFeatured: false, imageEmoji: "🧊", remainingStock: 10 },
  { id: "reward-17", name: "لعبة أونو", pointsCost: 600, description: "1 دينار (خفيفة)", isFeatured: false, imageEmoji: "🃏", remainingStock: 20 },
  { id: "reward-18", name: "حبل نط", pointsCost: 600, description: "1.5 دينار (خفيفة)", isFeatured: false, imageEmoji: "➰", remainingStock: 15 },
  { id: "reward-19", name: "قفازات حارس مرمى", pointsCost: 1500, description: "3 دنانير (متوسطة)", isFeatured: false, imageEmoji: "🧤", remainingStock: 5 },
  { id: "reward-20", name: "أتاري (SUP Game Box)", pointsCost: 2000, description: "5 دنانير (غالية)", isFeatured: true, imageEmoji: "🕹️", images: ["/atari_reward.png"], remainingStock: 5, stock: 5 },
  { id: "reward-21", name: "بلوزة", pointsCost: 2000, description: "5 دنانير (غالية)", isFeatured: true, imageEmoji: "👕", images: ["/blouse_reward.png"], remainingStock: 5, stock: 5 },
  { id: "reward-22", name: "سندويشة شاورما كبير", pointsCost: 480, description: "1.2 دينار (خفيفة)", isFeatured: false, imageEmoji: "🥙", remainingStock: 30, stock: 30 },
  { id: "reward-23", name: "مصحف", pointsCost: 1200, description: "3 دنانير (متوسطة)", isFeatured: false, imageEmoji: "📖", remainingStock: 10, stock: 10 }
];
