import React, { useState, useEffect } from 'react';
import { getRooms, getPlayers, getRewards, orderPrize } from '../db/database';

export default function ShopView({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [rewards, setRewards] = useState([]);

  const loadData = () => {
    setRooms(getRooms());
    setRewards(getRewards());
    if (selectedRoomId) {
      setPlayers(getPlayers(selectedRoomId));
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db_sync', loadData);
    return () => window.removeEventListener('db_sync', loadData);
  }, [selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId) {
      setPlayers(getPlayers(selectedRoomId));
      setSelectedPlayerId('');
    } else {
      setPlayers([]);
    }
  }, [selectedRoomId]);

  const activePlayer = players.find(p => p.id === selectedPlayerId);

  const handleOrder = (reward) => {
    if (!activePlayer) {
      alert('الرجاء اختيار الطالب أولاً');
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من طلب "${reward.name}" للطالب ${activePlayer.name} بـ ${reward.pointsCost} نقطة؟`)) {
      const result = orderPrize(activePlayer.id, reward.id);
      if (result.success) {
        alert('تم طلب الجائزة بنجاح!');
        // Refresh data
        setRewards(getRewards());
        setPlayers(getPlayers(selectedRoomId));
      } else {
        alert(result.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
              const isOutOfStock = reward.remainingStock <= 0;
              const canAfford = activePlayer && activePlayer.rewardPoints >= reward.pointsCost;

              return (
                <div key={reward.id} className="glass-panel" style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: reward.isFeatured ? '2px solid var(--gold)' : '1px solid var(--border-color)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  transform: 'translateY(0)',
                  ':hover': { transform: 'translateY(-5px)' }
                }}>
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
                      <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem' }}>
                        {reward.pointsCost} ن
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                      {reward.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ color: isOutOfStock ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        المخزون: <strong style={{ color: 'var(--text-primary)' }}>{reward.remainingStock} / {reward.stock}</strong>
                      </span>
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
                            ? 'طلب الجائزة الآن' 
                            : 'رصيد المتجر لا يكفي'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
