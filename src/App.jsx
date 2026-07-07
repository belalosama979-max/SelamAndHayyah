import React, { useState, useEffect } from 'react';
import { 
  getRooms, saveRoom, archiveRoom, deleteRoom,
  getPlayers, savePlayer,
  getCards, getBoardEvents, getLogs, applyCardToPlayer, undoLastLog, initDatabase
} from './db/database';
import RoomSummary from './components/RoomSummary';
import Board from './components/Board';
import CardSelector from './components/CardSelector';
import ActionLogs from './components/ActionLogs';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';
import ShopView from './components/ShopView';
import LeaderboardView from './components/LeaderboardView';
import ParentPortal from './components/ParentPortal';

// أيقونات مبسطة لتفادي أخطاء الاستيراد
const HomeIcon = () => <span>🏠</span>;
const SettingsIcon = () => <span>🛠️</span>;
const PlusIcon = () => <span>➕</span>;
const TrophyIcon = () => <span>🏆</span>;

export default function App() {
  // المظهر (Light/Dark Mode)
  const [theme, setTheme] = useState(localStorage.getItem('aqsa_theme') || 'dark');

  // حالة الكود الأولي لولي الأمر
  const [initialParentCode, setInitialParentCode] = useState('');

  // تهيئة قاعدة البيانات عند تشغيل التطبيق لأول مرة وتطبيق المظهر
  useEffect(() => {
    initDatabase();
    import('../db/database').then(db => {
      db.startFirebaseSync();
    });
    setRooms(getRooms());
    setCards(getCards());
    setBoardEvents(getBoardEvents());

    // فحص رابط ولي الأمر
    const params = new URLSearchParams(window.location.search);
    const pCode = params.get('parentCode');
    if (pCode) {
      setInitialParentCode(pCode);
      setCurrentScreen('parent-portal');
    } else {
      // Restore room state if available
      const savedRoomId = sessionStorage.getItem('aqsa_selectedRoomId');
      if (savedRoomId) {
        const allRooms = getRooms();
        const room = allRooms.find(r => r.id === savedRoomId);
        if (room) {
          setActiveRoom(room);
          setActivePlayers(getPlayers(savedRoomId));
          setActiveLogs(getLogs(savedRoomId));
        } else {
          sessionStorage.removeItem('aqsa_selectedRoomId');
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aqsa_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // حالات التنقل والبيانات
  const [currentScreen, setCurrentScreen] = useState(sessionStorage.getItem('aqsa_currentScreen') || 'dashboard'); // 'dashboard' | 'game' | 'admin' | 'parent-portal'
  const [rooms, setRooms] = useState([]);
  const [cards, setCards] = useState([]);
  const [boardEvents, setBoardEvents] = useState([]);
  
  // الغرفة المحددة للعب
  const [selectedRoomId, setSelectedRoomId] = useState(sessionStorage.getItem('aqsa_selectedRoomId') || '');
  const [activeRoom, setActiveRoom] = useState(null);
  const [activePlayers, setActivePlayers] = useState([]);
  const [activePlayer, setActivePlayer] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aqsa_activePlayer');
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });
  const [activeLogs, setActiveLogs] = useState([]);

  // حفظ الحالة في الجلسة عند كل تغيير
  useEffect(() => {
    sessionStorage.setItem('aqsa_currentScreen', currentScreen);
    sessionStorage.setItem('aqsa_selectedRoomId', selectedRoomId);
    if (activePlayer) {
      sessionStorage.setItem('aqsa_activePlayer', JSON.stringify(activePlayer));
    } else {
      sessionStorage.removeItem('aqsa_activePlayer');
    }
  }, [currentScreen, selectedRoomId, activePlayer]);

  // حالات الرسوم المتحركة
  const [animatingPlayerId, setAnimatingPlayerId] = useState(null);
  const [animationType, setAnimationType] = useState(null); // 'ladder' | 'snake'

  // حالة الفوز والاحتفال
  const [showVictory, setShowVictory] = useState(false);
  const [winnerName, setWinnerName] = useState('');

  // نوافذ التعديل والإضافة السريعة من الرئيسية
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomModalData, setRoomModalData] = useState({ id: '', name: '', maxPlayers: 10, createdBy: '' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  // تحديث القوائم العامة عند حدوث تعديل خارجي (من لوحة الإدارة مثلاً أو المزامنة السحابية)
  const handleDataChange = () => {
    setRooms(getRooms());
    setCards(getCards());
    setBoardEvents(getBoardEvents());
    
    // إذا كنا داخل غرفة معينة، نقوم بتحديث تفاصيلها
    if (selectedRoomId) {
      const allRooms = getRooms();
      const updatedRoom = allRooms.find(r => r.id === selectedRoomId);
      if (updatedRoom) {
        setActiveRoom(updatedRoom);
        const updatedPlayers = getPlayers(selectedRoomId);
        setActivePlayers(updatedPlayers);
        setActiveLogs(getLogs(selectedRoomId));
        
        // الحفاظ على الطالب النشط أو إعادة تعيينه
        if (activePlayer) {
          const freshPlayer = updatedPlayers.find(p => p.id === activePlayer.id);
          setActivePlayer(freshPlayer || null);
        }
      } else {
        // إذا حذفت الغرفة الحالية أثناء فتحها
        handleBackToDashboard();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('db_sync', handleDataChange);
    return () => window.removeEventListener('db_sync', handleDataChange);
  }, [selectedRoomId, activePlayer]);

  // الدخول لغرفة اللعب
  const handleEnterRoom = (roomId) => {
    setSelectedRoomId(roomId);
    const room = getRooms().find(r => r.id === roomId);
    setActiveRoom(room);
    
    const playersList = getPlayers(roomId);
    setActivePlayers(playersList);
    setActiveLogs(getLogs(roomId));
    
    // اختيار اللاعب الأول تلقائياً لتسهيل اللعب
    setActivePlayer(playersList[0] || null);
    setCurrentScreen('game');
  };

  // الرجوع للرئيسية
  const handleBackToDashboard = () => {
    setSelectedRoomId('');
    setActiveRoom(null);
    setActivePlayers([]);
    setActivePlayer(null);
    setActiveLogs([]);
    setRooms(getRooms());
    setCurrentScreen('dashboard');
  };

  // تطبيق بطاقة حركة على طالب
  const handleApplyCard = (cardId, customValue) => {
    if (!selectedRoomId || !activePlayer) return;

    const result = applyCardToPlayer(selectedRoomId, activePlayer.id, cardId, customValue);
    
    if (result.success) {
      const currentAppliedPlayerId = activePlayer.id;
      const updatedPlayers = getPlayers(selectedRoomId);

      if (result.eventTriggered) {
        // حساب المسافة والمدة للزحف للخانة الأولى (بداية السلم أو الأفعى)
        const oldPos = activePlayer.position || 1;
        const startPos = result.eventTriggered.start;
        const steps = Math.abs(startPos - oldPos);
        const crawlDuration = steps * 80 + 100; // 80ms لكل خطوة + 100ms أمان

        // المرحلة الأولى: تحريك اللاعب لخانة البداية (قبل السلم/الأفعى)
        const playersWithStartPos = updatedPlayers.map(p => {
          if (p.id === currentAppliedPlayerId) {
            return { ...p, position: startPos };
          }
          return p;
        });

        setActivePlayers(playersWithStartPos);
        setActiveLogs(getLogs(selectedRoomId));
        setActiveRoom(result.room);

        // بعد انتهاء الزحف للخانة الأولى، نقوم بتفعيل السلم/الأفعى والتحريك للخانة النهائية
        setTimeout(() => {
          // تفعيل الرسوم المتحركة للصعود/الهبوط
          setAnimatingPlayerId(currentAppliedPlayerId);
          setAnimationType(result.eventTriggered.type);

          // تحديث اللاعب لموقعه النهائي
          setActivePlayers(updatedPlayers);
          const freshPlayer = updatedPlayers.find(p => p.id === currentAppliedPlayerId);
          setActivePlayer(freshPlayer);

          // إزالة حالة الأنيميشن بعد انتهاء صعود السلم أو هبوط الأفعى
          setTimeout(() => {
            setAnimatingPlayerId(null);
            setAnimationType(null);
          }, 1200); // مدة حركة السلم والأفعى

        }, crawlDuration);

      } else {
        // حرك اللاعب بشكل طبيعي إذا لم يكن هناك سلم أو أفعى
        setActivePlayers(updatedPlayers);
        setActiveLogs(getLogs(selectedRoomId));
        setActiveRoom(result.room);
        setActivePlayer(updatedPlayers.find(p => p.id === currentAppliedPlayerId));
      }

      // تفعيل احتفالية الفوز الكبيرة
      if (result.isNewWinner) {
        setWinnerName(result.player.name);
        setShowVictory(true);
      }
    }
  };

  // التراجع عن آخر حركة
  const handleUndo = () => {
    if (!selectedRoomId) return;
    const result = undoLastLog(selectedRoomId);
    if (result.success) {
      setActivePlayers(result.players);
      setActiveLogs(getLogs(selectedRoomId));
      
      const freshRoom = getRooms().find(r => r.id === selectedRoomId);
      setActiveRoom(freshRoom);

      if (activePlayer) {
        const freshPlayer = result.players.find(p => p.id === activePlayer.id);
        setActivePlayer(freshPlayer || result.players[0] || null);
      }
    } else {
      alert(result.message);
    }
  };

  // تعديل الغرفة من لوحة الغرف مباشرة
  const handleEditRoomClick = (room) => {
    setRoomModalData({ id: room.id, name: room.name, maxPlayers: room.maxPlayers, createdBy: room.createdBy });
    setIsEditingRoom(true);
    setIsRoomModalOpen(true);
  };

  // أرشفة وتنشيط الغرفة من الرئيسية
  const handleArchiveRoomClick = (roomId) => {
    archiveRoom(roomId);
    setRooms(getRooms());
  };

  // حفظ نموذج تعديل/إضافة الغرفة
  const handleRoomModalSubmit = (e) => {
    e.preventDefault();
    if (!roomModalData.name) return;

    saveRoom({
      id: isEditingRoom ? roomModalData.id : undefined,
      name: roomModalData.name,
      maxPlayers: Number(roomModalData.maxPlayers),
      createdBy: roomModalData.createdBy || 'المشرف'
    });

    setIsRoomModalOpen(false);
    setRoomModalData({ id: '', name: '', maxPlayers: 10, createdBy: '' });
    setIsEditingRoom(false);
    setRooms(getRooms());
  };

  if (currentScreen === 'parent-portal') {
    return <ParentPortal initialParentCode={initialParentCode} onExit={() => {
      window.location.href = window.location.pathname;
    }} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ================= الشريط العلوي (Navbar) ================= */}
      <header className="glass-panel" style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* شعار التطبيق باللغة العربية */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2rem' }}>🕌</span>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              لعبة سلم وحية طريق المسجد الأقصى
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              نظام تعليمي وتربوي متكامل لتتبع تقدم الطلاب
            </p>
          </div>
        </div>

        {/* أزرار التنقل الرئيسية والمظهر */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} 
            className="btn btn-secondary"
            style={{ fontWeight: 700, gap: '0.25rem' }}
          >
            {theme === 'dark' ? '💡 المظهر المضيء' : '🌙 المظهر الداكن'}
          </button>

          <button 
            onClick={handleBackToDashboard} 
            className={`btn ${currentScreen === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <HomeIcon /> الرئيسية (لوحة الغرف)
          </button>
          
          <button 
            onClick={() => setCurrentScreen('shop')} 
            className={`btn ${currentScreen === 'shop' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700, backgroundColor: currentScreen === 'shop' ? 'var(--primary)' : 'rgba(16, 185, 129, 0.1)', color: currentScreen === 'shop' ? '#fff' : '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            🎁 متجر الجوائز
          </button>

          <button 
            onClick={() => setCurrentScreen('leaderboard')} 
            className={`btn ${currentScreen === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700, backgroundColor: currentScreen === 'leaderboard' ? 'var(--primary)' : 'rgba(245, 158, 11, 0.1)', color: currentScreen === 'leaderboard' ? '#fff' : '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
          >
            🏆 لوحة الأبطال
          </button>

          <button 
            onClick={() => setCurrentScreen('parent-portal')} 
            className={`btn ${currentScreen === 'parent-portal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700, backgroundColor: currentScreen === 'parent-portal' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.1)', color: currentScreen === 'parent-portal' ? '#fff' : '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
          >
            👨‍👩‍👦 بوابة أولياء الأمور
          </button>

          <button 
            onClick={() => setCurrentScreen('admin')} 
            className={`btn ${currentScreen === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <SettingsIcon /> لوحة إدارة النظام
          </button>
        </div>
      </header>

      {/* ================= المحتوى الرئيسي للموقع ================= */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        
        {/* 1. شاشة لوحة الغرف الرئيسية */}
        {currentScreen === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)',
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📂 نسخ اللعبة النشطة والمؤرشفة</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  يمكنك إدارة عدد غير محدود من الغرف وحلقات التحفيظ. تحتوي كل نسخة على خرائط، نقاط، وتتبع طلاب خاص بها.
                </p>
              </div>
              <button 
                onClick={() => { setIsEditingRoom(false); setRoomModalData({ id: '', name: '', maxPlayers: 10, createdBy: '' }); setIsRoomModalOpen(true); }}
                className="btn btn-gold"
              >
                <PlusIcon /> إنشاء نسخة جديدة
              </button>
            </div>

            {/* شبكة الغرف */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <RoomSummary
                    key={room.id}
                    room={room}
                    onEnter={handleEnterRoom}
                    onEdit={handleEditRoomClick}
                    onArchive={handleArchiveRoomClick}
                  />
                ))
              ) : (
                <div className="glass-panel" style={{
                  padding: '4rem 2rem',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '3rem' }}>📁</span>
                  <h3 style={{ marginTop: '1rem' }}>لا توجد نسخ ألعاب حالية</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                    لم يتم العثور على أي نسخة لعبة نشطة. ابدأ بإنشاء أول نسخة الآن!
                  </p>
                  <button 
                    onClick={() => { setIsEditingRoom(false); setIsRoomModalOpen(true); }}
                    className="btn btn-gold"
                  >
                    <PlusIcon /> إنشاء نسخة أولى
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. شاشة اللعب والتحكم الحية */}
        {currentScreen === 'game' && activeRoom && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* رأس لوحة اللعب */}
            <div className="glass-panel" style={{
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>نسخة اللعبة المفتوحة حالياً:</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎮 {activeRoom.name} 
                  {activeRoom.status === 'finished' && <span style={{ fontSize: '0.85rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>منتهية</span>}
                </h2>
              </div>

              {/* أزرار التفاعل والإضافة السريعة للاعبين داخل الغرفة */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleBackToDashboard}
                  className="btn btn-secondary"
                >
                  🔙 الرجوع للرئيسية
                </button>
              </div>
            </div>

            {/* تخطيط شاشة اللعب: خريطة + تحكم باللاعبين والبطاقات */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(450px, 1fr) 380px', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* العمود الأيمن: لوحة الخريطة */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Board 
                  players={activePlayers}
                  boardEvents={boardEvents}
                  animatingPlayerId={animatingPlayerId}
                  animationType={animationType}
                  cards={cards}
                  activePlayer={activePlayer}
                  setActivePlayer={setActivePlayer}
                  onApplyCard={handleApplyCard}
                  onUndo={handleUndo}
                  logs={activeLogs}
                />
              </div>

              {/* العمود الأيسر: الطلاب والتحكم وتطبيق البطاقات */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* قائمة اختيار الطالب النشط */}
                <div className="glass-panel" style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    👥 اختر الطالب لتطبيق البطاقة عليه:
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {activePlayers.length > 0 ? (
                      activePlayers.map((p) => {
                        const isSelected = activePlayer && activePlayer.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setActivePlayer(p)}
                            className="btn"
                            style={{
                              justifyContent: 'space-between',
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                              border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.04)'}`,
                              color: isSelected ? '#fff' : 'var(--text-secondary)',
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.2rem' }}>{p.avatar}</span>
                              <span style={{ 
                                display: 'inline-block', 
                                width: '10px', 
                                height: '10px', 
                                borderRadius: '50%', 
                                backgroundColor: p.color 
                              }} />
                              <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                              <span style={{ color: '#93c5fd', fontWeight: 800 }}>📍 {p.points} ن</span>
                              <span style={{ color: '#6ee7b7', fontWeight: 800 }}>🎁 {p.rewardPoints || 0} ن</span>
                              <span style={{ color: 'var(--text-muted)' }}>(الخانة {p.position})</span>
                              <span>{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>
                        لا يوجد طلاب في هذه الغرفة. انتقل إلى لوحة الإدارة لإضافة طلاب في نسخة: {activeRoom.name}.
                      </div>
                    )}
                  </div>
                </div>

                {/* لوحة تطبيق البطاقات */}
                <CardSelector 
                  cards={cards}
                  activePlayer={activePlayer}
                  onApplyCard={handleApplyCard}
                />

                {/* سجل العمليات والتراجع */}
                <ActionLogs 
                  logs={activeLogs}
                  onUndo={handleUndo}
                />

              </div>
            </div>
          </div>
        )}

        {/* 3. شاشة لوحة الإدارة الموحدة والكاملة */}
        {currentScreen === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🛠️ لوحة إدارة النظام الكاملة والموحدة</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                هنا يمكنك التحكم الكامل في الغرف، إضافة وحذف الطلاب، تخصيص وتفعيل البطاقات، تعديل السلالم والأفاعي، ورفع وتحميل النسخ الاحتياطية.
              </p>
            </div>
            
            <AdminPanel onDataChange={handleDataChange} />
          </div>
        )}

        {/* 4. شاشة متجر الجوائز */}
        {currentScreen === 'shop' && (
          <ShopView onBack={handleBackToDashboard} />
        )}

        {/* 5. شاشة لوحة الأبطال */}
        {currentScreen === 'leaderboard' && (
          <LeaderboardView onBack={handleBackToDashboard} />
        )}

      </main>

      {/* ================= النوافذ المنبثقة (Modals) ================= */}
      
      {/* 1. نافذة إضافة وتعديل الغرفة السريعة من الرئيسية */}
      <Modal 
        isOpen={isRoomModalOpen} 
        onClose={() => setIsRoomModalOpen(false)}
        title={isEditingRoom ? '✏️ تعديل بيانات نسخة اللعبة' : '➕ إضافة نسخة لعبة (غرفة) جديدة'}
      >
        <form onSubmit={handleRoomModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>اسم نسخة اللعبة *</label>
            <input 
              type="text" 
              required 
              placeholder="مثال: حلقة الهمم العالية"
              value={roomModalData.name}
              onChange={(e) => setRoomModalData({...roomModalData, name: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>الحد الأقصى للطلاب</label>
            <input 
              type="number" 
              required 
              min="1"
              value={roomModalData.maxPlayers}
              onChange={(e) => setRoomModalData({...roomModalData, maxPlayers: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>اسم المشرف المسؤول</label>
            <input 
              type="text" 
              placeholder="المشرف التربوي"
              value={roomModalData.createdBy}
              onChange={(e) => setRoomModalData({...roomModalData, createdBy: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEditingRoom ? 'حفظ التعديلات' : 'إنشاء النسخة'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsRoomModalOpen(false)} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. شاشة الاحتفال الكبرى بالفوز (🏆 مكتمل) بملء الشاشة */}
      {showVictory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1.5rem',
          direction: 'rtl'
        }}>
          {/* تأثير الـ Confetti المصمم بـ CSS النقي */}
          {Array.from({ length: 120 }).map((_, i) => {
            const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 3;
            const randomDuration = 2 + Math.random() * 3;
            const randomSize = 6 + Math.random() * 8;
            
            return (
              <div 
                key={i} 
                className="confetti-piece"
                style={{
                  left: `${randomLeft}%`,
                  backgroundColor: randomColor,
                  animationDelay: `${randomDelay}s`,
                  animationDuration: `${randomDuration}s`,
                  width: `${randomSize}px`,
                  height: `${randomSize}px`
                }}
              />
            );
          })}

          <div 
            className="glass-panel winner-pulse"
            style={{
              maxWidth: '550px',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              border: '3px solid var(--gold)',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              boxShadow: '0 0 50px rgba(217, 119, 6, 0.5)'
            }}
          >
            <span style={{ fontSize: '4.5rem', animation: 'bounce 1s infinite' }}>🏆</span>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1.3 }}>
              مبارك الفوز والوصول للمسجد الأقصى!
            </h2>
            
            <p style={{ fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              نهنئ البطل المتميز <strong style={{ color: 'var(--primary-hover)', fontSize: '1.4rem' }}>{winnerName}</strong> <br />
              لوصوله للهدف واجتيازه <strong style={{ color: 'var(--gold)' }}>7000 نقطة</strong> بنجاح وتفوق.
            </p>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              تم تسجيل الفوز في هذه النسخة من اللعبة بنجاح.
            </p>

            <button 
              onClick={() => setShowVictory(false)} 
              className="btn btn-gold"
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              🎉 متابعة الرحلة لبقية الطلاب
            </button>
          </div>
          
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
          `}</style>
        </div>
      )}

      {/* ================= التذييل (Footer) ================= */}
      <footer className="glass-panel" style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginTop: 'auto'
      }}>
        جميع الحقوق محفوظة © {new Date().getFullYear()} - لعبة سلم وحية التعليمية نحو المسجد الأقصى المبارك
      </footer>

    </div>
  );
}
