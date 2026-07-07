import React, { useState, useEffect } from 'react';
import { getRooms, getAllPlayers } from '../db/database';

export default function LeaderboardView({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [players, setPlayers] = useState([]);
  const [sortMode, setSortMode] = useState('journey'); // 'journey' | 'season'

  const loadData = () => {
    const allRooms = getRooms();
    const allPlayers = getAllPlayers();
    
    // إخفاء اللاعبين الذين ليس لديهم غرفة صحيحة
    const validPlayers = allPlayers.filter(p => allRooms.some(r => r.id === p.roomId));
    
    setRooms(allRooms);
    setPlayers(validPlayers);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db_sync', loadData);
    return () => window.removeEventListener('db_sync', loadData);
  }, []);

  // ترتيب اللاعبين بناءً على وضع الترتيب المختار
  const sortedPlayers = [...players].sort((a, b) => {
    if (sortMode === 'journey') {
      return b.points - a.points;
    } else {
      return (b.totalCollectedPoints || 0) - (a.totalCollectedPoints || 0);
    }
  });

  const getRoomName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'غير معروف';
  };

  const renderMedal = (index) => {
    if (index === 0) return <span style={{ fontSize: '2rem' }}>🥇</span>;
    if (index === 1) return <span style={{ fontSize: '2rem' }}>🥈</span>;
    if (index === 2) return <span style={{ fontSize: '2rem' }}>🥉</span>;
    return <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{index + 1}</span>;
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
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(236, 72, 153, 0.1))'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🏆</span> لوحة الأبطال العالمية
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            ترتيب جميع الطلاب عبر كافة نسخ اللعبة. تنافس نحو القمة!
          </p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          🔙 الرجوع للرئيسية
        </button>
      </div>

      {/* Toggle Sort Mode */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setSortMode('journey')}
          className={`btn ${sortMode === 'journey' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
        >
          📍 الترتيب حسب تقدم الخريطة (نقاط الرحلة)
        </button>
        <button 
          onClick={() => setSortMode('season')}
          className={`btn ${sortMode === 'season' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
        >
          🌟 الترتيب حسب إجمالي تجميع الموسم
        </button>
      </div>

      {/* Top 3 Podium */}
      {sortedPlayers.length >= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', marginTop: '2rem', marginBottom: '2rem' }}>
          {/* Second Place */}
          <div className="glass-panel" style={{ width: '220px', padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #94a3b8', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🥈</div>
            <div style={{ fontSize: '2.5rem' }}>{sortedPlayers[1].avatar}</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>{sortedPlayers[1].name}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{getRoomName(sortedPlayers[1].roomId)}</div>
            <div style={{ fontWeight: 800, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '1.5rem' }}>
              {sortMode === 'journey' ? sortedPlayers[1].points : sortedPlayers[1].totalCollectedPoints} ن
            </div>
          </div>

          {/* First Place */}
          <div className="glass-panel" style={{ width: '260px', padding: '2rem', textAlign: 'center', borderTop: '6px solid var(--gold)', borderRadius: 'var(--radius-lg)', transform: 'translateY(-20px)', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🥇</div>
            <div style={{ fontSize: '3.5rem' }}>{sortedPlayers[0].avatar}</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.5rem 0', color: 'var(--gold)' }}>{sortedPlayers[0].name}</h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{getRoomName(sortedPlayers[0].roomId)}</div>
            <div style={{ fontWeight: 900, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '2rem' }}>
              {sortMode === 'journey' ? sortedPlayers[0].points : sortedPlayers[0].totalCollectedPoints} ن
            </div>
          </div>

          {/* Third Place */}
          <div className="glass-panel" style={{ width: '220px', padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #b45309', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🥉</div>
            <div style={{ fontSize: '2.5rem' }}>{sortedPlayers[2].avatar}</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>{sortedPlayers[2].name}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{getRoomName(sortedPlayers[2].roomId)}</div>
            <div style={{ fontWeight: 800, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '1.5rem' }}>
              {sortMode === 'journey' ? sortedPlayers[2].points : sortedPlayers[2].totalCollectedPoints} ن
            </div>
          </div>
        </div>
      )}

      {/* Full List Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>الترتيب</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>الطالب</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>النسخة (الغرفة)</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>التقدم</th>
              <th style={{ padding: '1rem', color: '#60a5fa', fontWeight: 700 }}>📍 نقاط الرحلة</th>
              <th style={{ padding: '1rem', color: '#fcd34d', fontWeight: 700 }}>🌟 التجميع الكلي</th>
              <th style={{ padding: '1rem', color: '#34d399', fontWeight: 700 }}>🎁 رصيد المتجر</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => {
              const isTop3 = index < 3;
              return (
                <tr key={player.id} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: isTop3 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'background-color 0.2s',
                  ':hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                      {renderMedal(index)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{player.avatar}</span>
                      <strong style={{ fontSize: '1.1rem', color: isTop3 ? 'var(--gold)' : 'var(--text-primary)' }}>{player.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {getRoomName(player.roomId)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (player.points/7000)*100)}%`, backgroundColor: 'var(--primary)' }} />
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{Math.min(100, Math.round((player.points/7000)*100))}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: sortMode === 'journey' ? 900 : 700, color: '#93c5fd', fontSize: sortMode === 'journey' ? '1.2rem' : '1rem' }}>
                    {player.points}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: sortMode === 'season' ? 900 : 700, color: '#fde68a', fontSize: sortMode === 'season' ? '1.2rem' : '1rem' }}>
                    {player.totalCollectedPoints || 0}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#6ee7b7' }}>
                    {player.rewardPoints || 0}
                  </td>
                </tr>
              );
            })}
            {sortedPlayers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  لا يوجد طلاب مسجلين حتى الآن
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
