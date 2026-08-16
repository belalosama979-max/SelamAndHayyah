import React, { useState, useEffect } from 'react';
import { getRooms, getPlayers, getRewards, orderPrize, getAllPrizeRequests } from '../db/database';
import { isFlashSaleActive, getEffectivePointsCost, isItemOnSale, getDiscountedPoints } from '../utils/flashSale';
import FlashSaleBanner from './FlashSaleBanner';

export default function ShopView({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [rewards, setRewards] = useState([]);
  const [saleActive, setSaleActive] = useState(false);
  const [playerRequests, setPlayerRequests] = useState([]);

  const loadData = () => {
    setRooms(getRooms());
    setRewards(getRewards());
    setSaleActive(isFlashSaleActive());
    if (selectedRoomId) {
      setPlayers(getPlayers(selectedRoomId));
    }
    if (selectedPlayerId) {
      loadPlayerRequests(selectedPlayerId);
    }
  };

  // تحديث طلبات الطالب المحدد عند تغيير الطالب
  const loadPlayerRequests = (playerId) => {
    if (!playerId) { setPlayerRequests([]); return; }
    const all = getAllPrizeRequests();
    setPlayerRequests(
      all
        .filter(r => r.playerId === playerId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db_sync', loadData);
    // تحديث حالة التخفيض كل ثانية
    const saleInterval = setInterval(() => setSaleActive(isFlashSaleActive()), 1000);
    return () => {
      window.removeEventListener('db_sync', loadData);
      clearInterval(saleInterval);
    };
  }, [selectedRoomId, selectedPlayerId]);

  useEffect(() => {
    if (selectedRoomId) {
      setPlayers(getPlayers(selectedRoomId));
      setSelectedPlayerId('');
      setPlayerRequests([]);
    } else {
      setPlayers([]);
      setPlayerRequests([]);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    loadPlayerRequests(selectedPlayerId);
  }, [selectedPlayerId]);

  const [dynamicValues, setDynamicValues] = useState({});

  const activePlayer = players.find(p => p.id === selectedPlayerId);

  const handleOrder = (reward) => {
    if (!activePlayer) {
      alert('الرجاء اختيار الطالب أولاً');
      return;
    }
    
    const isDynamic = reward.name.includes("خصم على نشاط الحفاظ");
    let customPointsCost = null;

    if (isDynamic) {
      const jd = parseFloat(dynamicValues[reward.id]);
      if (!jd || jd <= 0) {
        alert("الرجاء إدخال القيمة بالدينار بشكل صحيح (مثال: 1 أو 1.2)");
        return;
      }
      customPointsCost = Math.round(jd * 800);
    }
    
    const effectiveCost = isDynamic ? customPointsCost : getEffectivePointsCost(reward);
    const onSale = !isDynamic && isItemOnSale(reward);
    const confirmMsg = onSale
      ? `🔥 تخفيض! هل أنت متأكد من طلب "${reward.name}" للطالب ${activePlayer.name} بـ ${effectiveCost} نقطة بدلاً من ${reward.pointsCost}؟`
      : `هل أنت متأكد من طلب "${reward.name}" للطالب ${activePlayer.name} بـ ${effectiveCost} نقطة؟`;
    
    if (window.confirm(confirmMsg)) {
      const result = orderPrize(activePlayer.id, reward.id, customPointsCost);
      if (result.success) {
        alert('تم طلب الجائزة بنجاح! ✅');
        // Refresh data
        setRewards(getRewards());
        setPlayers(getPlayers(selectedRoomId));
        setDynamicValues(prev => ({ ...prev, [reward.id]: '' }));
        loadPlayerRequests(selectedPlayerId);
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Flash Sale Banner */}
      <FlashSaleBanner />

      {/* Header */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🎁</span> متجر الجوائز
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            استبدل نقاطك المجمعة بجوائز قيمة. الشراء لا يؤثر على تقدمك في الخريطة!
          </p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          🔙 الرجوع للرئيسية
        </button>
      </div>

      {/* User Selector & Balance */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>👤 اختيار الطالب لإتمام الشراء</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="form-input" 
            style={{ minWidth: '250px' }}
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
          >
            <option value="">-- اختر نسخة اللعبة --</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select 
            className="form-input" 
            style={{ minWidth: '250px' }}
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            disabled={!selectedRoomId}
          >
            <option value="">-- اختر الطالب --</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {activePlayer && (
            <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '0.25rem' }}>📍 نقاط الرحلة (الخريطة)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#93c5fd' }}>{activePlayer.points}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#34d399', marginBottom: '0.25rem' }}>🎁 رصيد المتجر المتاح</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6ee7b7' }}>{activePlayer.rewardPoints}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Grid */}
      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>🛍️ الجوائز المتاحة</h3>
        {rewards.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد جوائز مضافة حالياً في المتجر.
          </div>
        ) : (
          <div className="shop-grid">
            {/* Sort so featured rewards are first */}
            {[...rewards].sort((a, b) => b.isFeatured - a.isFeatured).map(reward => {
              const isDynamic = reward.name.includes("خصم على نشاط الحفاظ");
              const jdValue = dynamicValues[reward.id] || '';
              const dynamicPointsCost = isDynamic ? Math.round((parseFloat(jdValue) || 0) * 800) : 0;

              const isOutOfStock = reward.remainingStock <= 0;
              const onSale = !isDynamic && isItemOnSale(reward);
              const effectiveCost = isDynamic ? (dynamicPointsCost || 0) : getEffectivePointsCost(reward);
              const canAfford = activePlayer && activePlayer.rewardPoints >= (isDynamic ? (dynamicPointsCost > 0 ? dynamicPointsCost : Infinity) : effectiveCost);

              return (
                <div key={reward.id} className="glass-panel" style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: onSale ? '2px solid #ffd700' : reward.isFeatured ? '2px solid var(--gold)' : '1px solid var(--border-color)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  transform: 'translateY(0)',
                  boxShadow: onSale ? '0 0 25px rgba(255, 215, 0, 0.15)' : 'none',
                  ':hover': { transform: 'translateY(-5px)' }
                }}>
                  {/* شارة التخفيض */}
                  {onSale && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                      color: '#fff',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      zIndex: 10,
                      boxShadow: '0 2px 10px rgba(255, 107, 107, 0.4)',
                      animation: 'flashSalePulse 2s ease-in-out infinite',
                    }}>
                      🔥 تخفيض!
                    </div>
                  )}

                  {reward.isFeatured && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: 'var(--gold)',
                      color: '#000',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      zIndex: 10,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                      ⭐ مميزة
                    </div>
                  )}
                  
                  {isOutOfStock && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      zIndex: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        backgroundColor: 'var(--danger)',
                        color: 'white',
                        padding: '0.5rem 2rem',
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        transform: 'rotate(-15deg)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        نفدت الكمية
                      </div>
                    </div>
                  )}

                  {/* Images Carousel or Single Image */}
                  <div style={{ height: '200px', backgroundColor: 'var(--bg-secondary)', position: 'relative', overflowX: 'auto', display: 'flex', snapType: 'x mandatory' }}>
                    {reward.images && reward.images.length > 0 ? (
                      reward.images.map((img, idx) => (
                        <img key={idx} src={img} alt={`${reward.name} - ${idx}`} style={{ height: '100%', minWidth: '100%', objectFit: 'cover', scrollSnapAlign: 'start' }} />
                      ))
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-muted)' }}>
                        🎁
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reward.name}</h4>
                      
                      {/* عرض النقاط - أصلي ومخفض */}
                      {isDynamic ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <input 
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="مثال: 1.2"
                            value={dynamicValues[reward.id] || ''}
                            onChange={(e) => setDynamicValues(prev => ({ ...prev, [reward.id]: e.target.value }))}
                            className="form-input"
                            style={{ width: '120px', padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 800 }}>
                            {dynamicPointsCost} ن
                          </span>
                        </div>
                      ) : onSale ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span style={{
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textDecoration: 'line-through',
                            opacity: 0.7,
                          }}>
                            {reward.pointsCost} ن
                          </span>
                          <span style={{
                            background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(255,215,0,0.2))',
                            color: '#ffd700',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 900,
                            fontSize: '1rem',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
                          }}>
                            🔥 {effectiveCost} ن
                          </span>
                        </div>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem' }}>
                          {reward.pointsCost} ن
                        </span>
                      )}
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                      {isDynamic && !reward.description ? "أدخل قيمة الخصم بالدينار، كل 1 دينار يخصم 800 نقطة." : reward.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: isOutOfStock ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        المخزون: <strong style={{ color: 'var(--text-primary)' }}>{reward.remainingStock} / {reward.stock}</strong>
                      </span>
                      {onSale && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#ff6b6b',
                          fontWeight: 700,
                          animation: 'flashSalePulse 2s ease-in-out infinite',
                        }}>
                          وفّر {reward.pointsCost - effectiveCost} نقطة!
                        </span>
                      )}
                    </div>

                    <button 
                      onClick={() => handleOrder(reward)}
                      disabled={isOutOfStock || (activePlayer && !canAfford) || !activePlayer}
                      className={`btn ${!activePlayer ? 'btn-secondary' : canAfford ? 'btn-primary' : 'btn-danger'}`}
                      style={{ width: '100%', opacity: (isOutOfStock || (!canAfford && activePlayer)) ? 0.5 : 1 }}
                    >
                      {!activePlayer 
                        ? 'اختر طالباً للطلب' 
                        : isOutOfStock 
                          ? 'غير متوفر' 
                          : canAfford 
                            ? (onSale ? '🔥 اطلب بسعر التخفيض!' : 'طلب الجائزة الآن')
                            : 'رصيد المتجر لا يكفي'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* طلبات الطالب السابقة */}
      {activePlayer && (
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📋</span> طلباتي السابقة
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 'auto' }}>
              ({activePlayer.name})
            </span>
          </h3>
          {playerRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
              لا توجد طلبات سابقة لهذا الطالب.
            </div>
          ) : (
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>التاريخ</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>الجائزة</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>النقاط</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {playerRequests.map(req => {
                    const statusConfig = {
                      pending:   { label: '⏳ قيد الانتظار',        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                      approved:  { label: '✅ مقبول — جاهز للتسليم', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                      delivered: { label: '📦 تم التسليم',           color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                      rejected:  { label: '❌ مرفوض — تم إرجاع النقاط', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                    };
                    const sc = statusConfig[req.status] || { label: req.status, color: 'var(--text-muted)', bg: 'transparent' };
                    const dateStr = new Date(req.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'short' });
                    const prizeName = req.rewardSnapshot?.name || 'جائزة غير معروفة';
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dateStr}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{prizeName}</td>
                        <td style={{ padding: '0.85rem 1rem', color: '#f59e0b', fontWeight: 800 }}>{req.pointsUsed} ن</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            backgroundColor: sc.bg,
                            color: sc.color,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}>
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
