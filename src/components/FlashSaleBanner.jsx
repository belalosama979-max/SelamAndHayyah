import React, { useState, useEffect, useCallback } from 'react';
import { isFlashSaleActive, getTimeRemaining } from '../utils/flashSale';

// ============================================================
// Flash Sale Banner - بانر التخفيضات مع عد تنازلي
// ============================================================
// يظهر كإعلان منبثق فاخر عند فتح الموقع أثناء فترة التخفيض
// ثم يتحول لشريط صغير ثابت يعرض العد التنازلي

export default function FlashSaleBanner() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // فحص إذا عرضنا المودال لهذه الجلسة
  const hasShownModal = useCallback(() => {
    return sessionStorage.getItem('flash_sale_modal_shown') === 'true';
  }, []);

  useEffect(() => {
    const update = () => {
      const active = isFlashSaleActive();
      setIsActive(active);

      if (active) {
        const remaining = getTimeRemaining();
        setTimeLeft(remaining);

        // عرض المودال مرة واحدة لكل جلسة
        if (!hasShownModal()) {
          setShowModal(true);
          sessionStorage.setItem('flash_sale_modal_shown', 'true');
        }
      } else {
        setShowModal(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hasShownModal]);

  const handleDismiss = () => {
    setShowModal(false);
    setDismissed(true);
  };

  if (!isActive) return null;

  const padZero = (n) => String(n).padStart(2, '0');

  return (
    <>
      {/* ═══════════ المودال المنبثق (الإعلان الكبير) ═══════════ */}
      {showModal && (
        <div
          className="flash-sale-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'flashSaleOverlayIn 0.3s ease-out',
            padding: '1rem',
          }}
          onClick={handleDismiss}
        >
          <div
            className="flash-sale-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #0f0c29, #302b63, #24243e)',
              borderRadius: '24px',
              padding: '0',
              maxWidth: '520px',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 80px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 107, 107, 0.2)',
              animation: 'flashSaleModalIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: '2px solid rgba(255, 215, 0, 0.4)',
            }}
          >
            {/* خلفية متحركة بالنجوم */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.08) 0%, transparent 50%)',
              pointerEvents: 'none',
            }} />

            {/* شريط علوي متوهج */}
            <div style={{
              background: 'linear-gradient(90deg, #ff6b6b, #ffd700, #ff6b6b, #ffd700)',
              backgroundSize: '300% 100%',
              animation: 'flashSaleGradientMove 3s linear infinite',
              height: '4px',
            }} />

            <div style={{ padding: '2.5rem 2rem', textAlign: 'center', position: 'relative' }}>
              {/* أيقونة كبيرة */}
              <div style={{
                fontSize: '4rem',
                marginBottom: '0.5rem',
                animation: 'flashSaleBounce 2s ease-in-out infinite',
                filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
              }}>
                🔥
              </div>

              {/* العنوان الرئيسي */}
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #ffd700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.75rem',
                letterSpacing: '1px',
                textShadow: 'none',
              }}>
                ⚡ تخفيضات حصرية ⚡
              </h2>

              <p style={{
                fontSize: '1.15rem',
                color: '#e0d6ff',
                marginBottom: '0.5rem',
                fontWeight: 600,
                lineHeight: 1.6,
              }}>
                خصومات مذهلة على جوائز المتجر!
              </p>

              <p style={{
                fontSize: '1rem',
                color: '#b8b0d4',
                marginBottom: '2rem',
                lineHeight: 1.5,
              }}>
                لحق حالك قبل ما تنتهي! ⏳
              </p>

              {/* العد التنازلي */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '2rem',
                direction: 'ltr',
              }}>
                {[
                  { val: padZero(timeLeft.hours), label: 'ساعة' },
                  { val: padZero(timeLeft.minutes), label: 'دقيقة' },
                  { val: padZero(timeLeft.seconds), label: 'ثانية' },
                ].map((unit, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(145deg, rgba(255,215,0,0.15), rgba(255,107,107,0.1))',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    minWidth: '85px',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.1), inset 0 0 20px rgba(255, 215, 0, 0.05)',
                  }}>
                    <div style={{
                      fontSize: '2.2rem',
                      fontWeight: 900,
                      color: '#ffd700',
                      fontFamily: 'monospace',
                      lineHeight: 1,
                      textShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
                    }}>
                      {unit.val}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b8b0d4',
                      marginTop: '0.5rem',
                      fontWeight: 600,
                    }}>
                      {unit.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* ميزات التخفيض */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '2rem',
                textAlign: 'right',
              }}>
                {[
                  '🎯 جوائز الـ 5 دنانير بنقاط أقل!',
                  '⭐ جوائز الـ 6 دنانير مخفضة!',
                  '🎁 جوائز الـ 3 دنانير وأقل عليها خصم!',
                ].map((text, i) => (
                  <div key={i} style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    color: '#e0d6ff',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    {text}
                  </div>
                ))}
              </div>

              {/* زر الدخول */}
              <button
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#0f0c29',
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
                  letterSpacing: '1px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.03)';
                  e.target.style.boxShadow = '0 6px 30px rgba(255, 215, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 20px rgba(255, 215, 0, 0.4)';
                }}
              >
                🛒 تصفح المتجر الآن!
              </button>
            </div>

            {/* شريط سفلي متوهج */}
            <div style={{
              background: 'linear-gradient(90deg, #ff6b6b, #ffd700, #ff6b6b, #ffd700)',
              backgroundSize: '300% 100%',
              animation: 'flashSaleGradientMove 3s linear infinite',
              height: '4px',
            }} />
          </div>
        </div>
      )}

      {/* ═══════════ الشريط الثابت (العد التنازلي المصغر) ═══════════ */}
      {!showModal && (
        <div
          className="flash-sale-bar"
          style={{
            background: 'linear-gradient(90deg, #1a0a2e, #302b63, #1a0a2e)',
            borderRadius: '16px',
            padding: '0.75rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 25px rgba(255, 215, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* الخلفية المتحركة */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.05), transparent)',
            animation: 'flashSaleShimmer 3s linear infinite',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            position: 'relative',
          }}>
            <span style={{
              fontSize: '1.5rem',
              animation: 'flashSalePulse 1.5s ease-in-out infinite',
            }}>🔥</span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffd700, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              ⚡ تخفيضات حصرية نشطة!
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            direction: 'ltr',
            position: 'relative',
          }}>
            <span style={{ fontSize: '0.85rem', color: '#b8b0d4', fontWeight: 600 }}>
              ينتهي خلال:
            </span>
            <div style={{
              display: 'flex',
              gap: '0.35rem',
              direction: 'ltr',
            }}>
              {[padZero(timeLeft.hours), padZero(timeLeft.minutes), padZero(timeLeft.seconds)].map((val, i) => (
                <React.Fragment key={i}>
                  <span style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.15)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '0.3rem 0.5rem',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#ffd700',
                    fontFamily: 'monospace',
                    minWidth: '36px',
                    textAlign: 'center',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                  }}>
                    {val}
                  </span>
                  {i < 2 && (
                    <span style={{
                      color: '#ffd700',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      animation: 'flashSalePulse 1s ease-in-out infinite',
                    }}>:</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ أنماط الحركة ═══════════ */}
      <style>{`
        @keyframes flashSaleOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes flashSaleModalIn {
          from { opacity: 0; transform: scale(0.8) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes flashSaleGradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes flashSaleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes flashSalePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes flashSaleShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
