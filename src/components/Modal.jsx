import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // إغلاق بمفتاح Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // منع التمرير خلف النافذة
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      {/* الخلفية المظللة */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          transition: 'all 0.3s'
        }}
      />

      {/* محتوى النافذة المنبثقة */}
      <div 
        className="glass-panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalEntrance 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 1010
        }}
      >
        {/* رأس النافذة */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(31, 41, 55, 0.5)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="إغلاق"
          >
            إغلاق ✕
          </button>
        </div>

        {/* محتوى النافذة الداخلي مع تمرير مرن */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>

      {/* أنيميشن الدخول */}
      <style>{`
        @keyframes modalEntrance {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
