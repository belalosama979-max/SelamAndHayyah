import AvatarDisplay from './AvatarDisplay';
import React, { useState, useEffect, useMemo } from 'react';
import { getAllPlayers, getRooms, getAllLogs, getBoardEvents, getAllPrizeRequests, getRewards, orderPrize, savePlayer } from '../db/database';
import Board from './Board';

export default function ParentPortal() {
  const [currentView, setCurrentView] = useState(sessionStorage.getItem('aqsa_parent_currentView') || 'landing'); // landing, student
  const [studentTab, setStudentTab] = useState(sessionStorage.getItem('aqsa_parent_studentTab') || 'dashboard'); // dashboard, shop, leaderboard, profile
  const [student, setStudent] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aqsa_parent_student');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    sessionStorage.setItem('aqsa_parent_currentView', currentView);
    sessionStorage.setItem('aqsa_parent_studentTab', studentTab);
    if (student) {
      sessionStorage.setItem('aqsa_parent_student', JSON.stringify(student));
    } else {
      sessionStorage.removeItem('aqsa_parent_student');
    }
  }, [currentView, studentTab, student]);

  // Login State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Data
  const [allPlayers, setAllPlayers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allPrizeRequests, setAllPrizeRequests] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [sortMode, setSortMode] = useState('journey'); // Added sort mode

  const loadData = () => {
    // Load fresh data
    const players = getAllPlayers();
    setAllPlayers(players);
    setAllRooms(getRooms());
    setAllLogs(getAllLogs());
    setAllEvents(getBoardEvents());
    setAllPrizeRequests(getAllPrizeRequests());
    setRewards(getRewards());

    // Refresh student data if logged in
    setStudent(prev => {
      if (!prev) return null;
      const fresh = players.find(p => p.id === prev.id);
      return fresh || prev;
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db_sync', loadData);
    return () => window.removeEventListener('db_sync', loadData);
  }, []);

  const onLoginSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setErrorMsg('الرجاء اختيار الطالب أولاً.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMsg('الرجاء إدخال كلمة المرور.');
      return;
    }

    const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return;

    // Password logic: Use custom password if set, otherwise First name + 123
    const expectedPassword = selectedPlayer.password || (selectedPlayer.name.split(' ')[0] + '123');
    
    if (passwordInput.trim() === expectedPassword) {
      if (selectedPlayer.parentPortalEnabled === false) {
        setErrorMsg('عذراً، تم تعطيل بوابة المتابعة لهذا الطالب مؤقتاً من قبل المشرف.');
        setStudent(null);
      } else {
        setStudent(selectedPlayer);
        setCurrentView('student');
        setStudentTab('dashboard');
        setErrorMsg('');
        setPasswordInput('');
      }
    } else {
      setErrorMsg('كلمة المرور غير صحيحة.');
      setStudent(null);
    }
  };

  const handleOrderPrize = (reward) => {
    if (!student) return;
    
    if (window.confirm(`هل أنت متأكد من طلب "${reward.name}" للطالب بـ ${reward.pointsCost} نقطة؟`)) {
      const result = orderPrize(student.id, reward.id);
      if (result.success) {
        alert('تم طلب الجائزة بنجاح!');
        // Refresh data
        setAllPrizeRequests(getAllPrizeRequests());
        setRewards(getRewards());
        const updatedPlayers = getAllPlayers();
        setAllPlayers(updatedPlayers);
        setStudent(updatedPlayers.find(p => p.id === student.id));
      } else {
        alert(result.message);
      }
    }
  };

  // -------------------------------------------------------------
  // Derived Data
  // -------------------------------------------------------------
  const roomPlayersList = useMemo(() => {
    if (!selectedRoomId) return [];
    return allPlayers.filter(p => p.roomId === selectedRoomId);
  }, [allPlayers, selectedRoomId]);

  const studentRoomPlayers = useMemo(() => {
    if (!student) return [];
    return allPlayers.filter(p => p.roomId === student.roomId);
  }, [student, allPlayers]);

  const sortedRoomPlayers = useMemo(() => {
    return [...studentRoomPlayers].sort((a, b) => {
      if (sortMode === 'journey') {
        return (b.points || 0) - (a.points || 0);
      } else {
        return (b.totalCollectedPoints || 0) - (a.totalCollectedPoints || 0);
      }
    });
  }, [studentRoomPlayers, sortMode]);

  const studentLogs = useMemo(() => {
    if (!student) return [];
    return allLogs
      .filter(l => l.playerId === student.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15); // Last 15 events
  }, [student, allLogs]);

  const studentPrizes = useMemo(() => {
    if (!student) return [];
    return allPrizeRequests
      .filter(r => r.playerId === student.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [student, allPrizeRequests]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'var(--success)';
      case 'approved': return 'var(--primary)';
      case 'pending': return 'var(--gold)';
      case 'rejected': return 'var(--danger)';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'delivered': return 'تم التسليم ✔️';
      case 'approved': return 'تمت الموافقة 👍';
      case 'pending': return 'قيد المراجعة ⏳';
      case 'rejected': return 'مرفوض ❌';
      default: return status;
    }
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#070a13',
      color: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      direction: 'rtl'
    }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        backgroundColor: 'var(--bg-primary-transparent)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👨‍👩‍👦</span> بوابة أولياء الأمور
          </h1>
        </div>
        {currentView !== 'landing' && (
          <button 
            onClick={() => {
              setCurrentView('landing');
              setStudent(null);
              setSelectedRoomId('');
              setSelectedPlayerId('');
              setPasswordInput('');
              setErrorMsg('');
            }}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            خروج 🚪
          </button>
        )}
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* ========================================================
            LANDING VIEW
        ======================================================== */}
        {currentView === 'landing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>تسجيل الدخول لمتابعة الطالب</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                اختر الغرفة ثم اسم الطالب، وأدخل كلمة المرور (الاسم الأول للطالب + 123)
              </p>
              
              <form onSubmit={onLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>الغرفة / الحلقة:</label>
                  <select 
                    className="form-input" 
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      setSelectedPlayerId('');
                    }}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- اختر الغرفة --</option>
                    {allRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>اسم الطالب:</label>
                  <select 
                    className="form-input" 
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    disabled={!selectedRoomId}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- اختر الطالب --</option>
                    {roomPlayersList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>كلمة المرور:</label>
                  <input
                    type="password"
                    placeholder="الاسم الأول للطالب + 123 (أو كلمة المرور المخصصة)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{errorMsg}</div>}
                
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                  دخول وبدء المتابعة 🚀
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            STUDENT DASHBOARD VIEW
        ======================================================== */}
        {currentView === 'student' && student && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* بطاقة الطالب */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', borderTop: '4px solid var(--primary)' }}>
              <div style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
                <AvatarDisplay avatar={student.avatar} size="4rem" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{student.name}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-accent)', padding: '0.4rem 0.8rem', borderRadius: '1rem' }}>
                    👥 الغرفة: {allRooms.find(r => r.id === student.roomId)?.name || 'غير محدد'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-accent)', padding: '0.4rem 0.8rem', borderRadius: '1rem' }}>
                    🏅 الترتيب الحالي: {student.rank}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="parent-nav-tabs">
              <button 
                onClick={() => setStudentTab('dashboard')}
                className={`btn ${studentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📊 لوحة الطالب والخريطة
              </button>
              <button 
                onClick={() => setStudentTab('leaderboard')}
                className={`btn ${studentTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🏆 لوحة ترتيب الغرفة
              </button>
              <button 
                onClick={() => setStudentTab('shop')}
                className={`btn ${studentTab === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🎁 متجر الجوائز
              </button>
              <button 
                onClick={() => setStudentTab('profile')}
                className={`btn ${studentTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
              >
                ⚙️ الملف الشخصي
              </button>
            </div>

            {/* TAB: DASHBOARD */}
            {studentTab === 'dashboard' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* الإحصائيات والمؤشرات */}
                <div className="mobile-stat-grid">
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>نقاط الرحلة الحالية</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38bdf8' }}>{student.points}</div>
                  </div>
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>النقاط المتبقية للختمة</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{Math.max(0, 7000 - student.points)}</div>
                  </div>
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>نسبة التقدم</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>{student.progressPercentage}%</div>
                    <div className="progress-bar-container" style={{ marginTop: '0.5rem', height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${student.progressPercentage}%`, backgroundColor: 'var(--success)' }}></div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>رصيد متجر الجوائز</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--gold)' }}>{student.rewardPoints}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {/* سجل الإنجازات (Timeline) */}
                  <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      ⏱️ سجل التقدم وآخر الإنجازات
                    </h3>
                    {studentLogs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {studentLogs.map((log) => (
                          <div key={log.id} style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            borderLeft: `3px solid ${log.pointsApplied > 0 ? 'var(--success)' : (log.pointsApplied < 0 ? 'var(--danger)' : 'var(--text-muted)')}`
                          }}>
                            <div style={{ 
                              fontSize: '1.2rem', 
                              fontWeight: 900, 
                              color: log.pointsApplied > 0 ? 'var(--success)' : (log.pointsApplied < 0 ? 'var(--danger)' : 'var(--text-muted)'),
                              minWidth: '50px',
                              textAlign: 'center'
                            }}>
                              {log.pointsApplied > 0 ? `+${log.pointsApplied}` : log.pointsApplied}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{log.cardName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(log.timestamp).toLocaleString('ar-SA')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>لا توجد سجلات بعد.</div>
                    )}
                  </div>

                  {/* الجوائز المشتراة */}
                  <div className="glass-panel" style={{ padding: '1.5rem', minWidth: '300px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      🎁 سجل طلبات المتجر
                    </h3>
                    {studentPrizes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {studentPrizes.map(request => (
                          <div key={request.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '2rem' }}>{request.rewardSnapshot.imageEmoji}</div>
                              <div>
                                <div style={{ fontWeight: 700 }}>{request.rewardSnapshot.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.5rem', 
                                borderRadius: '1rem', 
                                backgroundColor: `${getStatusColor(request.status)}20`,
                                color: getStatusColor(request.status),
                                fontWeight: 700
                              }}>
                                {getStatusLabel(request.status)}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: '0.25rem', fontWeight: 700 }}>
                                {request.pointsUsed} ن
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>لم يتم طلب جوائز بعد.</div>
                    )}
                  </div>
                </div>

                {/* الخريطة المصغرة لجميع طلاب الغرفة */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center', color: '#14b8a6' }}>
                    📍 موقع الطالب على الخريطة بين زملائه
                  </h3>
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    توضح الخريطة مواقع جميع الطلاب في نفس الحلقة، وتمييز الطالب الحالي للتركيز على مساره.
                  </p>
                  
                  <div style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '1rem'
                  }}>
                    <Board 
                      players={studentRoomPlayers} // Show all room players
                      boardEvents={allEvents}
                      cards={[]}
                      animatingPlayerId={null}
                      animationType={null}
                      activePlayer={student}
                      showYouAreHere={true}
                      setActivePlayer={() => {}}
                      onApplyCard={() => {}}
                      onUndo={() => {}}
                      logs={[]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LEADERBOARD */}
            {studentTab === 'leaderboard' && (
              <div className="fade-in glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: '#14b8a6' }}>
                  🏆 لوحة صدارة الشعبة ({allRooms.find(r => r.id === student.roomId)?.name})
                </h3>
                
                {/* Toggle Sort Mode */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                  <button 
                    onClick={() => setSortMode('journey')}
                    className={`btn ${sortMode === 'journey' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--text-sm)', flex: '1', minWidth: '200px', maxWidth: '320px' }}
                  >
                    📍 تقدم الخريطة (الرحلة)
                  </button>
                  <button 
                    onClick={() => setSortMode('season')}
                    className={`btn ${sortMode === 'season' ? 'btn-gold' : 'btn-secondary'}`}
                    style={{ padding: '0.75rem 1.25rem', fontSize: 'var(--text-sm)', flex: '1', minWidth: '200px', maxWidth: '320px' }}
                  >
                    🌟 إجمالي تجميع الموسم
                  </button>
                </div>

                {/* Top 3 Podium */}
                {sortedRoomPlayers.length >= 3 && (
                  <div className="leaderboard-podium" style={{ marginBottom: '2rem' }}>
                    {/* Second Place */}
                    <div className="glass-panel podium-card" style={{ borderTop: '4px solid #94a3b8' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🥈</div>
                      <div><AvatarDisplay avatar={sortedRoomPlayers[1].avatar} size="2.5rem" /></div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>{sortedRoomPlayers[1].name}</h3>
                      <div style={{ fontWeight: 800, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '1.3rem' }}>
                        {sortMode === 'journey' ? sortedRoomPlayers[1].points : sortedRoomPlayers[1].totalCollectedPoints} ن
                      </div>
                    </div>

                    {/* First Place */}
                    <div className="glass-panel podium-card first-place">
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🥇</div>
                      <div><AvatarDisplay avatar={sortedRoomPlayers[0].avatar} size="3rem" /></div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0.5rem 0', color: 'var(--gold)' }}>{sortedRoomPlayers[0].name}</h3>
                      <div style={{ fontWeight: 900, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '1.5rem' }}>
                        {sortMode === 'journey' ? sortedRoomPlayers[0].points : sortedRoomPlayers[0].totalCollectedPoints} ن
                      </div>
                    </div>

                    {/* Third Place */}
                    <div className="glass-panel podium-card" style={{ borderTop: '4px solid #b45309' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🥉</div>
                      <div><AvatarDisplay avatar={sortedRoomPlayers[2].avatar} size="2.5rem" /></div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>{sortedRoomPlayers[2].name}</h3>
                      <div style={{ fontWeight: 800, color: sortMode === 'journey' ? '#93c5fd' : '#fcd34d', fontSize: '1.3rem' }}>
                        {sortMode === 'journey' ? sortedRoomPlayers[2].points : sortedRoomPlayers[2].totalCollectedPoints} ن
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-scroll">
                  <table className="data-table" style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1rem' }}>الترتيب</th>
                        <th style={{ padding: '1rem' }}>الطالب</th>
                        <th style={{ padding: '1rem', color: '#60a5fa' }}>📍 نقاط الرحلة</th>
                        <th style={{ padding: '1rem', color: '#fcd34d' }}>🌟 نقاط الموسم</th>
                        <th style={{ padding: '1rem', color: '#34d399' }}>🎁 متجر الجوائز</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRoomPlayers.map((p, idx) => (
                        <tr key={p.id} style={{ backgroundColor: p.id === student.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent', borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '1rem', fontWeight: 900 }}>
                            {idx === 0 ? <span style={{fontSize:'1.5rem'}}>🥇</span> : idx === 1 ? <span style={{fontSize:'1.5rem'}}>🥈</span> : idx === 2 ? <span style={{fontSize:'1.5rem'}}>🥉</span> : `#${idx + 1}`}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: p.id === student.id ? '#38bdf8' : 'var(--text-primary)' }}>
                            <AvatarDisplay avatar={p.avatar} size="1.5rem" style={{ marginLeft: '0.5rem' }} /> {p.name}
                            {p.id === student.id && <span style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: 'var(--gold)' }}>(طالبك)</span>}
                          </td>
                          <td style={{ padding: '1rem', color: '#93c5fd', fontWeight: sortMode === 'journey' ? 900 : 700 }}>{p.points}</td>
                          <td style={{ padding: '1rem', color: '#fcd34d', fontWeight: sortMode === 'season' ? 900 : 700 }}>{p.totalCollectedPoints || 0}</td>
                          <td style={{ padding: '1rem', color: '#34d399', fontWeight: 700 }}>{p.rewardPoints || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SHOP */}
            {studentTab === 'shop' && (
              <div className="fade-in glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>🛍️ متجر الجوائز</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>استبدل نقاطك التكريمية بجوائز رائعة من اختيارك.</p>
                  </div>
                  <div className="shop-balance-badge">
                    <div style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '0.25rem' }}>رصيدك المتاح للشراء</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#6ee7b7' }}>{student.rewardPoints} ن</div>
                  </div>
                </div>

                {rewards.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    لا توجد جوائز متاحة في المتجر حالياً.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[...rewards].sort((a, b) => b.isFeatured - a.isFeatured).map(reward => {
                      const isOutOfStock = reward.remainingStock <= 0;
                      const canAfford = student.rewardPoints >= reward.pointsCost;

                      return (
                        <div key={reward.id} style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-lg)',
                          overflow: 'hidden',
                          border: reward.isFeatured ? '2px solid var(--gold)' : '1px solid var(--border-color)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {reward.isFeatured && (
                            <div style={{
                              position: 'absolute', top: '10px', right: '10px',
                              backgroundColor: 'var(--gold)', color: '#000',
                              padding: '0.25rem 0.75rem', borderRadius: '20px',
                              fontSize: '0.8rem', fontWeight: 800, zIndex: 10
                            }}>
                              ⭐ مميزة
                            </div>
                          )}
                          
                          {isOutOfStock && (
                            <div style={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 5,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <div style={{
                                backgroundColor: 'var(--danger)', color: 'white',
                                padding: '0.5rem 2rem', fontSize: '1.5rem', fontWeight: 900,
                                transform: 'rotate(-15deg)', borderRadius: 'var(--radius-sm)'
                              }}>
                                نفدت الكمية
                              </div>
                            </div>
                          )}

                          <div style={{ height: '180px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {reward.images && reward.images.length > 0 ? (
                              <img src={reward.images[0]} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '4rem' }}>{reward.imageEmoji || '🎁'}</div>
                            )}
                          </div>

                          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{reward.name}</h4>
                              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.85rem' }}>
                                {reward.pointsCost} ن
                              </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1, minHeight: '40px' }}>
                              {reward.description}
                            </p>

                            <button 
                              onClick={() => handleOrderPrize(reward)}
                              disabled={isOutOfStock || !canAfford}
                              className={`btn ${canAfford ? 'btn-primary' : 'btn-danger'}`}
                              style={{ width: '100%', opacity: (isOutOfStock || !canAfford) ? 0.5 : 1 }}
                            >
                              {isOutOfStock ? 'غير متوفر' : canAfford ? 'طلب الجائزة الآن' : 'نقاط المتجر لا تكفي'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* TAB: PROFILE */}
            {studentTab === 'profile' && (
              <ProfileTab 
                student={student} 
                setStudent={(updated) => {
                  setStudent(updated);
                  const updatedPlayers = getAllPlayers();
                  setAllPlayers(updatedPlayers);
                }} 
              />
            )}

          </div>
        )}

      </main>
    </div>
  );
}

// -------------------------------------------------------------
// Profile Tab Component
// -------------------------------------------------------------
function ProfileTab({ student, setStudent }) {
  const [name, setName] = useState(student.name);
  const [avatar, setAvatar] = useState(student.avatar);
  const [password, setPassword] = useState(student.password || '');
  const [isSaved, setIsSaved] = useState(false);

  const avatarsList = ['🦅', '🦁', '🐅', '🐎', '🐫', '🐬', '🦈', '🚀', '⭐', '🔥', '⚡', '🏹', '⚔️', '🛡️', '👑', '🎓', '🎯', '💡', '🤖', '👾'];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار صورة صالحة.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const updatedStudent = {
      ...student,
      name: name.trim(),
      avatar: avatar,
      password: password.trim(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to DB
    savePlayer(updatedStudent);
    
    // Update parent state
    setStudent(updatedStudent);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="fade-in glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: '#14b8a6' }}>
        ⚙️ إعدادات الملف الشخصي
      </h3>
      
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>اختر الأفاتار أو ارفع صورتك:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            
            {/* عرض الصورة الحالية */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '80px', height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--bg-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem',
                overflow: 'hidden',
                border: '2px solid var(--primary)'
              }}>
                {avatar && avatar.startsWith('data:image') ? (
                  <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  avatar || '👤'
                )}
              </div>
              
              <div>
                <label className="btn btn-secondary" style={{ display: 'inline-block', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                  📸 رفع صورة من الجهاز
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>سيتم ضغط الصورة تلقائياً لتسريع الموقع.</p>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {avatarsList.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  style={{
                    fontSize: '1.5rem',
                    padding: '0.5rem',
                    border: avatar === a ? '2px solid var(--primary)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: avatar === a ? 'rgba(13, 148, 136, 0.2)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>اسمك في اللعبة:</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="form-input" 
            style={{ width: '100%' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>كلمة المرور الجديدة (اختياري):</label>
          <input 
            type="text" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="form-input" 
            style={{ width: '100%' }}
            placeholder="اتركه فارغاً لاستخدام الكلمة الافتراضية"
          />
          <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
            الكلمة الافتراضية هي: {student.name.split(' ')[0]}123
          </small>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '1.1rem', marginTop: '1rem' }}>
          حفظ التعديلات 💾
        </button>

        {isSaved && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'bold' }}>
            تم حفظ التعديلات بنجاح! 🎉
          </div>
        )}
      </form>
    </div>
  );
}
