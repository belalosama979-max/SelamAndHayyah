import React from 'react';
import { formatDate } from '../utils/helpers';

export default function ActionLogs({ logs = [], onUndo }) {
  return (
    <div className="glass-panel" style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxHeight: '430px'
    }}>
      {/* رأس المكون وزر التراجع */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem'
      }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          📋 سجل العمليات الحية
        </h3>
        
        {logs.length > 0 && (
          <button
            onClick={onUndo}
            className="btn btn-danger"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              gap: '0.25rem',
              borderRadius: 'var(--radius-sm)'
            }}
            title="التراجع عن آخر عملية تم إدخالها"
          >
            ↩️ تراجع عن الأخيرة
          </button>
        )}
      </div>

      {/* قائمة السجلات */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}>
        {logs.length > 0 ? (
          logs.map((log) => {
            const isNegative = log.pointsApplied < 0;
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-glass)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    👤 {log.playerName}
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: isNegative ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {log.pointsApplied > 0 ? `+${log.pointsApplied}` : log.pointsApplied} نقطة
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>🎴 بطاقة: {log.cardName}</span>
                  <span>⏰ {formatDate(log.timestamp)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            لا توجد سجلات عمليات لهذه النسخة بعد. ابدأ بتطبيق بطاقة على الطلاب للبدء.
          </div>
        )}
      </div>
    </div>
  );
}
