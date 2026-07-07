import React, { useState } from 'react';

export default function LoginGate({ onAdminLogin, onStudentLogin }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (password === 'Qwertyuiop1!@gmail.com') {
      onAdminLogin();
    } else {
      setError('كلمة المرور غير صحيحة!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: 'var(--bg-dark)',
      direction: 'rtl'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        
        <div>
          <span style={{ fontSize: '4rem', marginBottom: '1rem', display: 'block' }}>🕌</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            لعبة سلم وحية طريق المسجد الأقصى
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            أهلاً بك! الرجاء تحديد هويتك للدخول:
          </p>
        </div>

        {!showAdminLogin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="btn btn-gold" 
              style={{ padding: '1rem', fontSize: '1.2rem', gap: '0.5rem' }}
            >
              👨‍🏫 أنا معلم (إدارة النظام)
            </button>
            <button 
              onClick={onStudentLogin}
              className="btn btn-primary" 
              style={{ padding: '1rem', fontSize: '1.2rem', gap: '0.5rem' }}
            >
              👨‍🎓 أنا طالب / ولي أمر
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'right' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', color: 'var(--gold)' }}>
              تسجيل دخول المعلم
            </h3>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>كلمة المرور:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="form-input"
                placeholder="أدخل كلمة المرور..."
                required
                style={{ width: '100%' }}
                autoFocus
              />
              {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              دخول
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowAdminLogin(false)} 
              className="btn" 
              style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)' }}
            >
              الرجوع
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
