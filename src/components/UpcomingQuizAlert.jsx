import React, { useState, useEffect } from 'react';

export default function UpcomingQuizAlert({ upcomingQuiz }) {
  const [visible, setVisible] = useState(true);
  const [timeLeftStr, setTimeLeftStr] = useState('جاري الحساب...');

  useEffect(() => {
    if (!upcomingQuiz) return;
    
    // إعادة إظهارها إذا تغير اللغز
    setVisible(true);
    
    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(upcomingQuiz.startTime);
      const diffMs = start - now;
      
      if (diffMs <= 0) {
        setTimeLeftStr('التحدي متاح الآن! قم بتحديث الصفحة.');
        clearInterval(timer);
        return;
      }

      const m = Math.floor(diffMs / 60000);
      const s = Math.floor((diffMs % 60000) / 1000);
      setTimeLeftStr(`يبدأ خلال ${m} دقيقة و ${s} ثانية`);
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingQuiz]);

  const handleNotify = async () => {
    if (!("Notification" in window)) {
      alert("متصفحك لا يدعم الإشعارات.");
      return;
    }
    
    if (Notification.permission === "granted") {
      alert("الإشعارات مفعلة بالفعل! سنقوم بتنبيهك عند البدء إذا بقيت الصفحة مفتوحة.");
      scheduleNotification();
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
         scheduleNotification();
         alert("تم تفعيل الإشعارات بنجاح!");
      }
    } else {
      alert("قمت برفض الإشعارات مسبقاً. يرجى تفعيلها من إعدادات المتصفح.");
    }
  };

  const scheduleNotification = () => {
    const start = new Date(upcomingQuiz.startTime).getTime();
    const now = new Date().getTime();
    const diff = start - now;
    if (diff > 0) {
      setTimeout(() => {
        new Notification("بدأ التحدي!", {
          body: `التحدي "${upcomingQuiz.title}" متاح الآن! قم بتحديث الصفحة لتبدأ الحل.`,
        });
      }, diff);
    }
  };

  if (!upcomingQuiz || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(15px)',
      border: '1px solid var(--primary)',
      padding: '1rem 1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.8rem',
      width: '90%',
      maxWidth: '400px',
      animation: 'slideUpAlert 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ margin: 0, color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⏳</span> تحدي قادم قريباً!
          </h4>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#fff' }}>{upcomingQuiz.title}</p>
        </div>
        <button onClick={() => setVisible(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.5rem' }}>✖</button>
      </div>
      
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)', textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        {timeLeftStr}
      </div>

      <button onClick={handleNotify} className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <span>🔔</span> تفعيل التنبيه عند البدء
      </button>

      <style>{`
        @keyframes slideUpAlert {
          from { transform: translate(-50%, 150%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
