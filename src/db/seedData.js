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
  // سلالم (Ladders) - توزيع متوازن: +11 إلى +14 خانة
  {
    id: "event-ladder-1",
    type: "ladder",
    startPosition: 6,
    endPosition: 17,
    description: "المحافظة على صلاة الفجر في جماعة"
  },
  {
    id: "event-ladder-2",
    type: "ladder",
    startPosition: 18,
    endPosition: 30,
    description: "حفظ ورد الحفظ الأسبوعي كاملاً"
  },
  {
    id: "event-ladder-3",
    type: "ladder",
    startPosition: 38,
    endPosition: 51,
    description: "بر الوالدين ومساعدتهم في المنزل"
  },
  {
    id: "event-ladder-4",
    type: "ladder",
    startPosition: 59,
    endPosition: 73,
    description: "التصدق والمشاركة في عمل تطوعي"
  },
  {
    id: "event-ladder-5",
    type: "ladder",
    startPosition: 77,
    endPosition: 91,
    description: "التفوق الدراسي ونشر الخير بين الزملاء"
  },

  // أفاعي (Snakes) - توزيع متوازن: -11 إلى -14 خانة
  {
    id: "event-snake-1",
    type: "snake",
    startPosition: 26,
    endPosition: 15,
    description: "التفوه بكلمات سيئة أو الغيبة"
  },
  {
    id: "event-snake-2",
    type: "snake",
    startPosition: 45,
    endPosition: 33,
    description: "إهمال الواجبات المدرسية والتكاسل"
  },
  {
    id: "event-snake-3",
    type: "snake",
    startPosition: 54,
    endPosition: 42,
    description: "عقوق الوالدين أو إساءة الأدب"
  },
  {
    id: "event-snake-4",
    type: "snake",
    startPosition: 68,
    endPosition: 57,
    description: "التخلف عن صلاة الجماعة لعدة أيام"
  },
  {
    id: "event-snake-5",
    type: "snake",
    startPosition: 88,
    endPosition: 74,
    description: "الكبر والغرور واحتقار الآخرين"
  }
];

export const DEFAULT_REWARDS = [];
