// دالات مساعدة عامة للتطبيق

// الحصول على فئة التنسيق الخاصة بالترتيب (ذهبي، فضي، برونزي)
export const getRankBadgeClass = (rank) => {
  if (rank === 1) return 'badge-gold glow-gold';
  if (rank === 2) return 'badge-silver';
  if (rank === 3) return 'badge-bronze';
  return 'bg-gray-700 text-gray-300';
};

// الحصول على الرمز التعبيري للترتيب
export const getRankEmoji = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
};

// حساب النقاط المتبقية للوصول إلى 7000
export const getRemainingPoints = (points) => {
  return Math.max(0, 7000 - points);
};

// تنسيق التاريخ إلى اللغة العربية الفصحى
export const formatDate = (isoString) => {
  if (!isoString) return 'غير محدد';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'تاريخ غير صالح';
  }
};

// توليد نقاط الإحداثيات لمسار الخريطة (100 خانة)
// سنقوم بإنشاء مسار متعرج ممتع بـ 100 محطة يبدأ من الأسفل وينتهي في الأعلى حيث المسجد الأقصى
export const generatePathCoordinates = (width = 800, height = 600) => {
  const points = [];
  const rows = 10;
  const cols = 10;
  const paddingX = 50;
  const paddingY = 60;
  const stepX = (width - paddingX * 2) / (cols - 1);
  const stepY = (height - paddingY * 2) / (rows - 1);

  // سنقوم بإنشاء مسار ثنائي الأبعاد ممتد ومتعرج (بواستروفيدون)
  // الصفوف تبدأ من الأسفل (الصف 9) متجهة للأعلى (الصف 0)
  for (let r = 0; r < rows; r++) {
    const isRowEven = r % 2 === 0; // اتجاه اليمين واليسار المتبادل
    const y = height - paddingY - r * stepY;

    for (let c = 0; c < cols; c++) {
      const colIndex = isRowEven ? c : (cols - 1 - c);
      const x = paddingX + colIndex * stepX;
      
      // سنضيف تعرجاً طفيفاً لجعل المسار يبدو طبيعياً وأقل جموداً
      const waveX = Math.sin(r * 1.5 + c * 0.8) * 12;
      const waveY = Math.cos(c * 1.5 + r * 0.8) * 8;

      points.push({
        x: Math.round(x + waveX),
        y: Math.round(y + waveY),
        number: r * cols + c + 1
      });
    }
  }

  return points;
};
