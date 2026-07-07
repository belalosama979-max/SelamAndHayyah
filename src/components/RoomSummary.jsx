import AvatarDisplay from './AvatarDisplay';
import React from 'react';
import { getPlayers } from '../db/database';
import { getRankEmoji, getRankBadgeClass, getRemainingPoints, formatDate } from '../utils/helpers';

export default function RoomSummary({ room, onEnter, onEdit, onArchive }) {
  // جلب لاعبي هذه الغرفة والترتيب
  const players = getPlayers(room.id);
  
  // حساب الإحصائيات الحية للغرفة
  const totalPlayers = players.length;
  const leader = players.find(p => p.rank === 1);
  
  // حساب متوسط نسبة إنجاز النسخة بالكامل
  const averageProgress = totalPlayers > 0 
    ? Math.round(players.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / totalPlayers) 
    : 0;

  return (
    <div className="glass-panel animate-room-card" style={{
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      backgroundColor: room.status === 'finished' ? 'rgba(31, 41, 55, 0.25)' : 'var(--bg-primary-transparent)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s'
    }}>
      {/* القسم العلوي: تفاصيل الغرفة */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🏢 {room.name}
            </h2>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: room.status === 'finished' ? 'var(--danger-light)' : 'var(--success-light)',
              color: room.status === 'finished' ? 'var(--danger)' : 'var(--success)',
              fontWeight: 700
            }}>
              {room.status === 'finished' ? '🗄️ منتهية/مؤرشفة' : '🟢 نشطة'}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>👥 اللاعبون: <strong>{totalPlayers} / {room.maxPlayers}</strong></span>
            <span>👑 المتصدر: <strong style={{ color: 'var(--gold)' }}>{leader ? leader.name : 'لا يوجد'}</strong></span>
            <span>📅 آخر نشاط: <strong>{formatDate(room.lastUsedAt || room.createdAt)}</strong></span>
          </div>
        </div>

        {/* أزرار التحكم بالنسخة */}
        <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
          <button 
            onClick={() => onEnter(room.id)} 
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            🎮 دخول للعب
          </button>
          <button 
            onClick={() => onEdit(room)} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            title="تعديل اسم النسخة أو الحد الأقصى"
          >
            ✏️ تعديل
          </button>
          <button 
            onClick={() => onArchive(room.id)} 
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          >
            {room.status === 'finished' ? '🔓 تنشيط' : '🗄️ أرشفة'}
          </button>
        </div>
      </div>

      {/* نسبة إنجاز النسخة بالكامل */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>📈 نسبة إنجاز النسخة الإجمالية:</span>
          <span style={{ color: 'var(--primary-hover)' }}>{averageProgress}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${averageProgress}%`, 
              backgroundColor: 'var(--primary)' 
            }}
          />
        </div>
      </div>

      {/* القسم السفلي: جدول اللاعبين التفصيلي */}
      <div style={{ marginTop: '0.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          📋 قائمة تفاصيل تقدم الطلاب:
        </h4>
        
        {totalPlayers > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>الترتيب</th>
                  <th style={{ padding: '0.5rem' }}>اسم اللاعب</th>
                  <th style={{ padding: '0.5rem', color: '#93c5fd' }}>📍 نقاط الرحلة</th>
                  <th style={{ padding: '0.5rem', color: '#6ee7b7' }}>🎁 المتجر</th>
                  <th style={{ padding: '0.5rem' }}>المتبقي للهدف (7000)</th>
                  <th style={{ padding: '0.5rem' }}>شريط التقدم والنسبة</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const isGold = player.rank === 1;
                  const isSilver = player.rank === 2;
                  const isBronze = player.rank === 3;
                  const remaining = getRemainingPoints(player.points);
                  
                  return (
                    <tr key={player.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      {/* الترتيب وميداليته */}
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <span className={`badge ${getRankBadgeClass(player.rank)}`} style={{
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {getRankEmoji(player.rank)}
                        </span>
                      </td>
                      {/* اسم الطالب وأيقونته */}
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>
                        <AvatarDisplay avatar={player.avatar || '⭐'} size="1.15rem" style={{ marginLeft: '0.35rem' }} />
                        {player.name}
                      </td>
                      {/* نقاط الرحلة والمشتريات */}
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: '#93c5fd' }}>
                        {player.points} ن
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: '#6ee7b7' }}>
                        {player.rewardPoints || 0} ن
                      </td>
                      {/* النقاط المتبقية أو مكتمل */}
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        {player.points >= 7000 ? (
                          <span style={{ color: 'var(--success)', fontWeight: 800 }}>🏆 مكتمل</span>
                        ) : (
                          <span>متبقي: {remaining} ن</span>
                        )}
                      </td>
                      {/* شريط التقدم الفردي */}
                      <td style={{ padding: '0.6rem 0.5rem', width: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar-container" style={{ flex: 1, height: '6px' }}>
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${player.progressPercentage}%`,
                                backgroundColor: player.color || 'var(--primary)'
                              }} 
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '32px', textAlign: 'left' }}>
                            {player.progressPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>
            لا يوجد لاعبون مضافون في هذه النسخة بعد. اذهب للعب لإضافتهم.
          </div>
        )}
      </div>
      
      <style>{`
        .animate-room-card {
          animation: roomCardFade 0.35s ease-out;
        }
        @keyframes roomCardFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
