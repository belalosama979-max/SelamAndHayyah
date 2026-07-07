import React, { useState } from 'react';

export default function CardSelector({ cards = [], onApplyCard, activePlayer }) {
  const [activeTab, setActiveTab] = useState('تجويد');
  const [selectedCard, setSelectedCard] = useState(null);
  const [customValue, setCustomValue] = useState('');

  if (!activePlayer) {
    return (
      <div className="glass-panel" style={{
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <h3>👤 الرجاء اختيار طالب من القائمة لتطبيق البطاقات عليه</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          اختر طالباً من قائمة الطلاب النشطة لتعديل نقاطه وتحريك موقعه في طريق الأقصى.
        </p>
      </div>
    );
  }

  // تصفية البطاقات المفعلة والمطابقة للتصنيف النشط وترتيبها
  const filteredCards = cards
    .filter(c => c.isEnabled && c.category === activeTab)
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  // تلوين البطاقة ديناميكياً إذا كانت بطاقة سلوك أو تفاعل ومشاركة وقيمتها سالبة/موجبة
  const getDynamicCardStyle = (card, forceValueInput = null) => {
    const isBehaviorOrInteraction = card.name === 'بطاقة سلوك' || card.name === 'بطاقة تفاعل ومشاركة';
    
    if (isBehaviorOrInteraction) {
      const val = forceValueInput !== null ? Number(forceValueInput) : null;
      if (val !== null && !isNaN(val)) {
        if (val < 0) {
          return { backgroundColor: 'var(--danger)', color: '#fff', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' };
        } else if (val > 0) {
          return { backgroundColor: 'var(--success)', color: '#fff', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' };
        }
      }
    }
    
    // اللون الافتراضي للبطاقة من إعداداتها
    return { backgroundColor: card.color || 'var(--bg-tertiary)', color: '#fff' };
  };

  const handleCardClick = (card) => {
    if (card.value !== null) {
      // بطاقة ذات قيمة ثابتة، نطبقها مباشرة
      onApplyCard(card.id, null);
      setSelectedCard(null);
      setCustomValue('');
    } else {
      // بطاقة ذات قيمة متغيرة، نفتح خيارات إدخال القيمة
      setSelectedCard(card);
      setCustomValue('');
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!selectedCard || customValue === '') return;
    
    onApplyCard(selectedCard.id, Number(customValue));
    setSelectedCard(null);
    setCustomValue('');
  };

  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* رأس المكون */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          🎴 لوحة بطاقات التقدم: <span style={{ color: activePlayer.color }}>{activePlayer.name}</span>
        </h3>
        <span style={{ 
          fontSize: '0.85rem', 
          backgroundColor: 'var(--bg-glass-hover)', 
          padding: '0.2rem 0.5rem', 
          borderRadius: 'var(--radius-sm)' 
        }}>
          النقاط الحالية: {activePlayer.points} ن
        </span>
      </div>

      {/* تصنيفات البطاقات (Tabs) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: 'var(--bg-primary)',
        padding: '0.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {['تجويد', 'حفظ', 'متابعة تربوية'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedCard(null);
            }}
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* قائمة البطاقات المتاحة */}
      {!selectedCard ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.75rem',
          maxHeight: '340px',
          overflowY: 'auto',
          padding: '0.25rem'
        }}>
          {filteredCards.length > 0 ? (
            filteredCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="referee-card"
                style={{
                  ...getDynamicCardStyle(card, null)
                }}
              >
                <span className="referee-card-category">{card.category}</span>
                <strong className="referee-card-name">{card.name}</strong>
                <span className="referee-card-value">
                  {card.value !== null ? (card.value > 0 ? `+${card.value}` : card.value) : '؟'}
                </span>
              </button>
            ))
          ) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
              لا توجد بطاقات متاحة في هذا التصنيف.
            </div>
          )}
        </div>
      ) : (
        /* واجهة إدخال القيمة المخصصة للبطاقة المتغيرة */
        <form onSubmit={handleApplyCustom} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-accent)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.2s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
              تطبيق بطاقة بقيمة متغيرة: <span style={{ color: 'var(--gold)' }}>{selectedCard.name}</span>
            </h4>
            <button 
              type="button" 
              onClick={() => setSelectedCard(null)} 
              className="btn btn-secondary"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem' }}
            >
              إلغاء
            </button>
          </div>

          {/* معاينة شكل البطاقة مباشرة أثناء تغيير القيمة */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
            <div className="referee-card" style={{
              ...getDynamicCardStyle(selectedCard, customValue)
            }}>
              <span className="referee-card-category">{selectedCard.category}</span>
              <strong className="referee-card-name">{selectedCard.name}</strong>
              <span className="referee-card-value">
                {customValue !== '' ? (Number(customValue) > 0 ? `+${customValue}` : customValue) : '؟'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="number"
              required
              placeholder="أدخل قيمة النقاط (مثال: +30 أو -20)"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              تطبيق
            </button>
          </div>
        </form>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
