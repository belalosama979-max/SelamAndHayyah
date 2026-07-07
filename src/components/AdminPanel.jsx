import React, { useState, useEffect } from 'react';
import { 
  getRooms, saveRoom, deleteRoom, archiveRoom,
  getPlayers, savePlayer, deletePlayer,
  getCards, saveCard, deleteCard,
  getBoardEvents, saveBoardEvent, deleteBoardEvent,
  exportData, importData, generateId, migrateDataToFirebase 
} from '../db/database';
import { formatDate } from '../utils/helpers';
import AdminShopPanel from './AdminShopPanel';

export default function AdminPanel({ onDataChange }) {
  const [activeTab, setActiveTab] = useState('rooms');

  // حالات إدارة الغرف
  const [rooms, setRooms] = useState(getRooms());
  const [roomForm, setRoomForm] = useState({ id: '', name: '', maxPlayers: 10, createdBy: '' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  // حالات إدارة اللاعبين
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [players, setPlayers] = useState(selectedRoomId ? getPlayers(selectedRoomId) : []);
  const [playerForm, setPlayerForm] = useState({ id: '', name: '', avatar: '⭐', color: '#0d9488' });
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);

  // حالات إدارة البطاقات
  const [cards, setCards] = useState(getCards());
  const [cardForm, setCardForm] = useState({ id: '', name: '', category: 'تجويد', value: '', color: '#0d9488', isEnabled: true, displayOrder: 1 });
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isVariableValue, setIsVariableValue] = useState(false);

  // حالات إدارة السلالم والأفاعي
  const [events, setEvents] = useState(getBoardEvents());
  const [eventForm, setEventForm] = useState({ id: '', type: 'ladder', startPosition: '', endPosition: '', description: '' });
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // حالات النسخ الاحتياطي
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });

  // تحديث البيانات في التطبيق بالكامل
  const refreshData = () => {
    const updatedRooms = getRooms();
    setRooms(updatedRooms);
    setCards(getCards());
    setEvents(getBoardEvents());
    if (selectedRoomId) {
      setPlayers(getPlayers(selectedRoomId));
    }
    onDataChange(); // إشعار الأب لتحديث الشاشات
  };

  useEffect(() => {
    window.addEventListener('db_sync', refreshData);
    return () => window.removeEventListener('db_sync', refreshData);
  }, [selectedRoomId]);

  // تغيير الغرفة النشطة في تبويب اللاعبين
  const handleRoomSelect = (roomId) => {
    setSelectedRoomId(roomId);
    setPlayers(getPlayers(roomId));
    setPlayerForm({ id: '', name: '', avatar: '⭐', color: '#0d9488' });
    setIsEditingPlayer(false);
  };

  // --- دوال الغرف ---
  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (!roomForm.name) return;
    
    saveRoom({
      id: isEditingRoom ? roomForm.id : undefined,
      name: roomForm.name,
      maxPlayers: Number(roomForm.maxPlayers),
      createdBy: roomForm.createdBy || 'المشرف'
    });
    
    setRoomForm({ id: '', name: '', maxPlayers: 10, createdBy: '' });
    setIsEditingRoom(false);
    refreshData();
  };

  const handleEditRoom = (room) => {
    setRoomForm({ id: room.id, name: room.name, maxPlayers: room.maxPlayers, createdBy: room.createdBy });
    setIsEditingRoom(true);
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm("⚠️ هل أنت متأكد من حذف هذه النسخة بالكامل؟ سيؤدي ذلك لحذف جميع اللاعبين وسجل العمليات الخاص بها نهائياً!")) {
      deleteRoom(roomId);
      refreshData();
      if (selectedRoomId === roomId) {
        setSelectedRoomId('');
        setPlayers([]);
      }
    }
  };

  const handleArchiveRoom = (roomId) => {
    archiveRoom(roomId);
    refreshData();
  };

  // --- دوال اللاعبين ---
  const handlePlayerSubmit = (e) => {
    e.preventDefault();
    if (!playerForm.name || !selectedRoomId) return;

    const result = savePlayer({
      id: isEditingPlayer ? playerForm.id : undefined,
      roomId: selectedRoomId,
      name: playerForm.name,
      avatar: playerForm.avatar,
      color: playerForm.color
    });

    if (result && result.error) {
      alert(result.message);
      return;
    }

    setPlayerForm({ id: '', name: '', avatar: '⭐', color: '#0d9488' });
    setIsEditingPlayer(false);
    refreshData();
  };

  const handleEditPlayer = (player) => {
    setPlayerForm({ id: player.id, name: player.name, avatar: player.avatar, color: player.color });
    setIsEditingPlayer(true);
  };

  const handleDeletePlayer = (playerId) => {
    if (window.confirm("⚠️ هل تريد حذف هذا الطالب من النسخة؟ ستضيع جميع نقاطه وسجله.")) {
      deletePlayer(playerId, selectedRoomId);
      refreshData();
    }
  };

  // --- دوال البطاقات ---
  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (!cardForm.name) return;

    saveCard({
      id: isEditingCard ? cardForm.id : undefined,
      name: cardForm.name,
      category: cardForm.category,
      value: isVariableValue ? null : Number(cardForm.value),
      color: cardForm.color,
      isEnabled: cardForm.isEnabled,
      displayOrder: Number(cardForm.displayOrder)
    });

    setCardForm({ id: '', name: '', category: 'تجويد', value: '', color: '#0d9488', isEnabled: true, displayOrder: cards.length + 1 });
    setIsEditingCard(false);
    setIsVariableValue(false);
    refreshData();
  };

  const handleEditCard = (card) => {
    setCardForm({
      id: card.id,
      name: card.name,
      category: card.category,
      value: card.value === null ? '' : card.value,
      color: card.color,
      isEnabled: card.isEnabled,
      displayOrder: card.displayOrder || 1
    });
    setIsVariableValue(card.value === null);
    setIsEditingCard(true);
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm("⚠️ هل أنت متأكد من حذف هذه البطاقة نهائياً؟")) {
      deleteCard(cardId);
      refreshData();
    }
  };

  // --- دوال السلالم والأفاعي ---
  const handleEventSubmit = (e) => {
    e.preventDefault();
    const start = Number(eventForm.startPosition);
    const end = Number(eventForm.endPosition);

    if (start < 1 || start > 100 || end < 1 || end > 100) {
      alert("الخانات يجب أن تكون بين 1 و 100");
      return;
    }
    
    if (eventForm.type === 'ladder' && start >= end) {
      alert("في السلم، يجب أن تكون خانة البداية أقل من خانة النهاية (صعود)");
      return;
    }
    
    if (eventForm.type === 'snake' && start <= end) {
      alert("في الأفعى، يجب أن تكون خانة البداية أعلى من خانة النهاية (هبوط)");
      return;
    }

    saveBoardEvent({
      id: isEditingEvent ? eventForm.id : undefined,
      type: eventForm.type,
      startPosition: start,
      endPosition: end,
      description: eventForm.description || (eventForm.type === 'ladder' ? 'جسر سلم' : 'منزلق حية')
    });

    setEventForm({ id: '', type: 'ladder', startPosition: '', endPosition: '', description: '' });
    setIsEditingEvent(false);
    refreshData();
  };

  const handleEditEvent = (evt) => {
    setEventForm({
      id: evt.id,
      type: evt.type,
      startPosition: evt.startPosition,
      endPosition: evt.endPosition,
      description: evt.description
    });
    setIsEditingEvent(true);
  };

  const handleDeleteEvent = (evtId) => {
    if (window.confirm("⚠️ هل تريد إزالة هذا الحدث من الخريطة؟")) {
      deleteBoardEvent(evtId);
      refreshData();
    }
  };

  // --- دوال النسخ الاحتياطي ---
  const handleExport = () => {
    const dataStr = exportData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `نسخة_احتياطية_طريق_الأقصى_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const result = importData(event.target.result);
      if (result.success) {
        setImportStatus({ type: 'success', message: result.message });
        refreshData();
      } else {
        setImportStatus({ type: 'danger', message: result.message });
      }
    };
    fileReader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="admin-layout">
      <div className="glass-panel admin-sidebar">
        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          🛠️ لوحة إدارة النظام
        </h4>
        <button 
          onClick={() => setActiveTab('rooms')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'rooms' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'rooms' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          🏢 نسخ اللعبة (الغرف)
        </button>
        <button 
          onClick={() => setActiveTab('players')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'players' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'players' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          👥 الطلاب واللاعبين
        </button>
        <button 
          onClick={() => setActiveTab('cards')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'cards' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'cards' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          🎴 إدارة البطاقات
        </button>
        <button 
          onClick={() => setActiveTab('events')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'events' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'events' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          🪜 السلالم والأفاعي
        </button>
        <button 
          onClick={() => setActiveTab('shop')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'shop' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'shop' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          🎁 متجر الجوائز
        </button>
        <button 
          onClick={() => setActiveTab('backup')} 
          className="btn" 
          style={{ 
            justifyContent: 'flex-start',
            backgroundColor: activeTab === 'backup' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'backup' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          💾 النسخ الاحتياطي
        </button>
      </div>

      <div className="glass-panel admin-content">
        
        {/* ================= تبويب إدارة الغرف ================= */}
        {activeTab === 'rooms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🏢 إدارة نسخ اللعبة (الغرف)</h3>
            
            <form onSubmit={handleRoomSubmit} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
              backgroundColor: 'var(--bg-glass)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اسم نسخة اللعبة *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: حلقة عثمان بن عفان" 
                  value={roomForm.name} 
                  onChange={(e) => setRoomForm({...roomForm, name: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>الحد الأقصى للطلاب</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  value={roomForm.maxPlayers} 
                  onChange={(e) => setRoomForm({...roomForm, maxPlayers: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اسم المشرف</label>
                <input 
                  type="text" 
                  placeholder="المشرف التربوي" 
                  value={roomForm.createdBy} 
                  onChange={(e) => setRoomForm({...roomForm, createdBy: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {isEditingRoom ? 'حفظ التعديلات' : 'إضافة نسخة جديدة'}
                </button>
                {isEditingRoom && (
                  <button 
                    type="button" 
                    onClick={() => { setRoomForm({ id: '', name: '', maxPlayers: 10, createdBy: '' }); setIsEditingRoom(false); }} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                  <th style={{ padding: '0.75rem' }}>اسم النسخة</th>
                  <th style={{ padding: '0.75rem' }}>المشرف</th>
                  <th style={{ padding: '0.75rem' }}>الحد الأقصى</th>
                  <th style={{ padding: '0.75rem' }}>تاريخ الإنشاء</th>
                  <th style={{ padding: '0.75rem' }}>الحالة</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <tr key={room.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{room.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{room.createdBy}</td>
                      <td style={{ padding: '0.75rem' }}>{room.maxPlayers} طلاب</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(room.createdAt)}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: room.status === 'finished' ? 'var(--danger-light)' : 'var(--success-light)',
                          color: room.status === 'finished' ? 'var(--danger)' : 'var(--success)'
                        }}>
                          {room.status === 'finished' ? 'منتهية/مؤرشفة' : 'نشطة'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditRoom(room)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>تعديل</button>
                        <button onClick={() => handleArchiveRoom(room.id)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                          {room.status === 'finished' ? 'تنشيط' : 'أرشفة'}
                        </button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>حذف</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد نسخ ألعاب حالية. أنشئ نسخة للبدء!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= تبويب إدارة الطلاب ================= */}
        {activeTab === 'players' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>👥 إدارة الطلاب واللاعبين</h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اختر نسخة اللعبة المراد إدارتها:</label>
              <select 
                value={selectedRoomId} 
                onChange={(e) => handleRoomSelect(e.target.value)} 
                className="form-input"
                style={{ maxWidth: '300px' }}
              >
                <option value="">-- اختر نسخة --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.status === 'finished' ? 'مؤرشفة' : 'نشطة'})</option>
                ))}
              </select>
            </div>

            {selectedRoomId ? (
              <>
                <form onSubmit={handlePlayerSubmit} style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-glass)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اسم الطالب *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="اسم الطالب الثلاثي" 
                      value={playerForm.name} 
                      onChange={(e) => setPlayerForm({...playerForm, name: e.target.value})} 
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>رمز الصورة (Emoji)</label>
                    <select 
                      value={playerForm.avatar} 
                      onChange={(e) => setPlayerForm({...playerForm, avatar: e.target.value})} 
                      className="form-input"
                    >
                      {['⭐', '🌙', '🕌', '🦅', '🦁', '🛡️', '🔥', '💧', '⚡', '🍀', '🏹', '🎨', '📚', '🏆'].map(emoji => (
                        <option key={emoji} value={emoji}>{emoji}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اللون المميز على الخريطة</label>
                    <select 
                      value={playerForm.color} 
                      onChange={(e) => setPlayerForm({...playerForm, color: e.target.value})} 
                      className="form-input"
                    >
                      <option value="#0d9488">تيل (أخضر مزرق)</option>
                      <option value="#3b82f6">أزرق</option>
                      <option value="#10b981">أخضر</option>
                      <option value="#d97706">ذهبي/برتقالي</option>
                      <option value="#8b5cf6">بنفسجي</option>
                      <option value="#ef4444">أحمر</option>
                      <option value="#ec4899">وردي</option>
                      <option value="#06b6d4">سماوي</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      {isEditingPlayer ? 'حفظ التعديل' : 'إضافة الطالب'}
                    </button>
                    {isEditingPlayer && (
                      <button 
                        type="button" 
                        onClick={() => { setPlayerForm({ id: '', name: '', avatar: '⭐', color: '#0d9488' }); setIsEditingPlayer(false); }} 
                        className="btn btn-secondary" 
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                      <th style={{ padding: '0.75rem' }}>الرمز</th>
                      <th style={{ padding: '0.75rem' }}>اسم الطالب</th>
                      <th style={{ padding: '0.75rem' }}>النقاط</th>
                      <th style={{ padding: '0.75rem' }}>بوابة الولي</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.length > 0 ? (
                      players.map((player) => {
                        const portalUrl = `${window.location.origin}${window.location.pathname}?parentCode=${player.parentCode}`;
                        return (
                        <tr key={player.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: player.parentPortalEnabled === false ? 0.6 : 1 }}>
                          <td style={{ padding: '0.75rem', fontSize: '1.25rem' }}>{player.avatar}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: player.color, marginLeft: '0.5rem' }} />
                            {player.name}
                          </td>
                          <td style={{ padding: '0.75rem' }}>{player.points} نقطة</td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>{player.parentCode}</span>
                              <button 
                                onClick={() => navigator.clipboard.writeText(portalUrl).then(() => alert('تم نسخ رابط ولي الأمر بنجاح'))}
                                title="نسخ الرابط المباشر"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                              >🔗</button>
                              <a href={portalUrl} target="_blank" rel="noreferrer" title="معاينة كولي أمر" style={{ textDecoration: 'none', fontSize: '1.2rem' }}>👁️</a>
                              <button 
                                onClick={() => {
                                  if (window.confirm(player.parentPortalEnabled !== false ? 'هل تريد تعطيل البوابة لهذا الطالب؟' : 'هل تريد إعادة تفعيل البوابة؟')) {
                                    savePlayer({ ...player, parentPortalEnabled: player.parentPortalEnabled === false ? true : false });
                                    refreshData();
                                    setPlayers(getPlayers(selectedRoomId));
                                  }
                                }}
                                title={player.parentPortalEnabled !== false ? 'تعطيل البوابة' : 'تفعيل البوابة'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                              >
                                {player.parentPortalEnabled !== false ? '✅' : '⛔'}
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button onClick={() => handleEditPlayer(player)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>تعديل</button>
                            <button onClick={() => handleDeletePlayer(player.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>حذف</button>
                          </td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا يوجد طلاب مضافين لهذه النسخة بعد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>💡 يرجى اختيار أو إنشاء نسخة لعبة أولاً لإضافة الطلاب وإدارتهم.</div>
            )}
          </div>
        )}

        {/* ================= تبويب إدارة البطاقات ================= */}
        {activeTab === 'cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🎴 إدارة بطاقات الحركة والتقدم</h3>

            <form onSubmit={handleCardSubmit} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
              backgroundColor: 'var(--bg-glass)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>اسم البطاقة *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: حفظ سورة" 
                  value={cardForm.name} 
                  onChange={(e) => setCardForm({...cardForm, name: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>التصنيف</label>
                <select 
                  value={cardForm.category} 
                  onChange={(e) => setCardForm({...cardForm, category: e.target.value})} 
                  className="form-input"
                >
                  <option value="تجويد">تجويد</option>
                  <option value="حفظ">حفظ</option>
                  <option value="متابعة تربوية">متابعة تربوية</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>نوع القيمة</label>
                <div style={{ display: 'flex', gap: '0.5rem', height: '40px', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={!isVariableValue} 
                      onChange={() => setIsVariableValue(false)}
                    />
                    ثابتة
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      checked={isVariableValue} 
                      onChange={() => { setIsVariableValue(true); setCardForm({...cardForm, value: ''}); }}
                    />
                    متغيرة
                  </label>
                </div>
              </div>

              {!isVariableValue && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>قيمة النقاط (ثابتة)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="مثال: 20 أو -10" 
                    value={cardForm.value} 
                    onChange={(e) => setCardForm({...cardForm, value: e.target.value})} 
                    className="form-input"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>ترتيب العرض</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  value={cardForm.displayOrder} 
                  onChange={(e) => setCardForm({...cardForm, displayOrder: e.target.value})} 
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>لون البطاقة (HEX)</label>
                <input 
                  type="color" 
                  value={cardForm.color} 
                  onChange={(e) => setCardForm({...cardForm, color: e.target.value})} 
                  style={{ width: '100%', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={cardForm.isEnabled} 
                    onChange={(e) => setCardForm({...cardForm, isEnabled: e.target.checked})}
                  />
                  بطاقة مفعلة
                </label>
              </div>

              <div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {isEditingCard ? 'حفظ التعديل' : 'إضافة البطاقة'}
                </button>
                {isEditingCard && (
                  <button 
                    type="button" 
                    onClick={() => { setCardForm({ id: '', name: '', category: 'تجويد', value: '', color: '#0d9488', isEnabled: true, displayOrder: cards.length + 1 }); setIsEditingCard(false); setIsVariableValue(false); }} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                  <th style={{ padding: '0.75rem' }}>ترتيب الظهور</th>
                  <th style={{ padding: '0.75rem' }}>اللون</th>
                  <th style={{ padding: '0.75rem' }}>اسم البطاقة</th>
                  <th style={{ padding: '0.75rem' }}>التصنيف</th>
                  <th style={{ padding: '0.75rem' }}>القيمة</th>
                  <th style={{ padding: '0.75rem' }}>الحالة</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: card.isEnabled ? 1 : 0.5 }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{card.displayOrder}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ display: 'inline-block', width: '24px', height: '14px', borderRadius: '4px', backgroundColor: card.color, border: '1px solid #fff' }} />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{card.name}</td>
                    <td style={{ padding: '0.75rem' }}>{card.category}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {card.value === null ? <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>متغيرة</span> : (card.value > 0 ? `+${card.value}` : card.value)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.15rem 0.5rem', 
                        display: 'flex',
                        backgroundColor: card.isEnabled ? 'var(--success-light)' : 'var(--bg-glass-hover)',
                        border: `1px solid ${card.isEnabled ? 'var(--success)' : 'var(--border-light)'}`,
                      }}>
                        {card.isEnabled ? 'نشطة' : 'معطلة'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                      <button onClick={() => handleEditCard(card)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>تعديل</button>
                      {card.isCustom && (
                        <button onClick={() => handleDeleteCard(card.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>حذف</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= تبويب إدارة السلالم والأفاعي ================= */}
        {activeTab === 'events' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🪜 إدارة السلالم والأفاعي (حواجز الخريطة)</h3>

            <form onSubmit={handleEventSubmit} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
              backgroundColor: 'var(--bg-glass)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>النوع</label>
                <select 
                  value={eventForm.type} 
                  onChange={(e) => setEventForm({...eventForm, type: e.target.value})} 
                  className="form-input"
                >
                  <option value="ladder">🪜 سلم (صعود للأعلى)</option>
                  <option value="snake">🐍 أفعى (هبوط للأسفل)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>خانة البداية (1 - 100)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max="100"
                  placeholder="مثال: 12" 
                  value={eventForm.startPosition} 
                  onChange={(e) => setEventForm({...eventForm, startPosition: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>خانة النهاية (1 - 100)</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max="100"
                  placeholder="مثال: 38" 
                  value={eventForm.endPosition} 
                  onChange={(e) => setEventForm({...eventForm, endPosition: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>الوصف التربوي المرافق</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: المحافظة على صلاة الفجر" 
                  value={eventForm.description} 
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})} 
                  className="form-input"
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {isEditingEvent ? 'حفظ التعديل' : 'إضافة الحدث'}
                </button>
                {isEditingEvent && (
                  <button 
                    type="button" 
                    onClick={() => { setEventForm({ id: '', type: 'ladder', startPosition: '', endPosition: '', description: '' }); setIsEditingEvent(false); }} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>
                  <th style={{ padding: '0.75rem' }}>النوع</th>
                  <th style={{ padding: '0.75rem' }}>خانة البداية</th>
                  <th style={{ padding: '0.75rem' }}>خانة النهاية</th>
                  <th style={{ padding: '0.75rem' }}>فرق التقدم</th>
                  <th style={{ padding: '0.75rem' }}>الوصف والسبب التربوي</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>العمليات</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const stepDiff = Math.abs(evt.endPosition - evt.startPosition);
                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: evt.type === 'ladder' ? 'var(--success)' : 'var(--danger)' }}>
                        {evt.type === 'ladder' ? '🪜 سلم (صعود)' : '🐍 أفعى (هبوط)'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{evt.startPosition}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{evt.endPosition}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: evt.type === 'ladder' ? 'var(--success)' : 'var(--danger)' }}>
                        {evt.type === 'ladder' ? `+${stepDiff} خانة` : `-${stepDiff} خانة`}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{evt.description}</td>
                      <td style={{ padding: '0.75rem', display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditEvent(evt)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>تعديل</button>
                        <button onClick={() => handleDeleteEvent(evt.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>حذف</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= تبويب متجر الجوائز ================= */}
        {activeTab === 'shop' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>🎁 لوحة تحكم المتجر والطلبات</h3>
            <AdminShopPanel onDataChange={refreshData} />
          </div>
        )}

        {/* ================= تبويب النسخ الاحتياطي ================= */}
        {activeTab === 'backup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>💾 النسخ الاحتياطي ونقل البيانات</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              يحفظ هذا النظام جميع بياناتك (نسخ اللعبة، الطلاب، البطاقات المعدلة، السلالم والأفاعي، وسجلات النقاط) في متصفحك الحالي.
              لحماية بياناتك من الضياع أو لنقلها لمتصفح آخر أو جهاز كمبيوتر آخر للمشرفين، يمكنك تصدير الملف أو استيراده في أي وقت.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-glass)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginTop: '1rem'
            }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>☁️ الترحيل إلى السحابة (Firebase)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>اضغط هذا الزر مرة واحدة لرفع بيانات حاسوبك إلى السحابة لتظهر على موقع Vercel.</p>
                <button onClick={() => migrateDataToFirebase()} className="btn btn-primary" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                  🚀 رفع البيانات للسحابة
                </button>
                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', my: '1rem' }} />
                
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', marginTop: '1rem' }}>📤 تصدير البيانات بالكامل</h4>
                <button onClick={handleExport} className="btn btn-gold" style={{ gap: '0.5rem' }}>
                  📥 تحميل ملف البيانات احتياطياً (JSON)
                </button>
              </div>

              <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', my: '1rem' }} />

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>📥 استيراد بيانات سابقة</h4>
                <label className="btn btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer', gap: '0.5rem' }}>
                  📁 اختر ملف البيانات واستورده
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImport} 
                    style={{ display: 'none' }}
                  />
                </label>

                {importStatus.message && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: importStatus.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
                    color: importStatus.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${importStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`
                  }}>
                    {importStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
