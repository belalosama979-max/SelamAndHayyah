import React, { useState, useEffect } from 'react';
import { getRewards, saveReward, deleteReward, getAllPrizeRequests, updatePrizeRequestStatus, getRooms } from '../db/database';

export default function AdminShopPanel({ onDataChange }) {
  const [activeTab, setActiveTab] = useState('manageRewards'); // 'manageRewards' | 'requests'
  
  // Rewards State
  const [rewards, setRewards] = useState([]);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsCost: 0,
    stock: 1,
    remainingStock: 1,
    images: '',
    isFeatured: false
  });

  // Requests State
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);

  const loadData = () => {
    setRewards(getRewards());
    setRequests(getAllPrizeRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    setRooms(getRooms());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRewardSubmit = (e) => {
    e.preventDefault();
    if (!rewardForm.name) return;

    const imagesArray = rewardForm.images.split('\n').map(s => s.trim()).filter(s => s);
    
    saveReward({
      id: editingRewardId || undefined,
      name: rewardForm.name,
      description: rewardForm.description,
      pointsCost: Number(rewardForm.pointsCost),
      stock: Number(rewardForm.stock),
      remainingStock: Number(rewardForm.remainingStock),
      images: imagesArray,
      isFeatured: rewardForm.isFeatured
    });

    setRewardForm({ name: '', description: '', pointsCost: 0, stock: 1, remainingStock: 1, images: '', isFeatured: false });
    setEditingRewardId(null);
    loadData();
    if (onDataChange) onDataChange();
  };

  const handleEditReward = (reward) => {
    setEditingRewardId(reward.id);
    setRewardForm({
      name: reward.name,
      description: reward.description || '',
      pointsCost: reward.pointsCost || 0,
      stock: reward.stock || 1,
      remainingStock: reward.remainingStock || 1,
      images: (reward.images || []).join('\n'),
      isFeatured: reward.isFeatured || false
    });
  };

  const handleDeleteReward = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجائزة؟')) {
      deleteReward(id);
      loadData();
      if (onDataChange) onDataChange();
    }
  };

  const handleRequestAction = (requestId, newStatus) => {
    const actionName = newStatus === 'approved' ? 'موافقة' : newStatus === 'rejected' ? 'رفض وإرجاع النقاط' : 'تسليم';
    if (window.confirm(`هل أنت متأكد من تنفيذ: ${actionName}؟`)) {
      updatePrizeRequestStatus(requestId, newStatus);
      loadData();
      if (onDataChange) onDataChange();
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return <span style={{ color: '#f59e0b', fontWeight: 800 }}>⏳ قيد الانتظار</span>;
      case 'approved': return <span style={{ color: '#3b82f6', fontWeight: 800 }}>✅ مقبول (جاهز للتسليم)</span>;
      case 'delivered': return <span style={{ color: '#10b981', fontWeight: 800 }}>📦 تم التسليم</span>;
      case 'rejected': return <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ مرفوض (تم إرجاع النقاط)</span>;
      default: return status;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('manageRewards')}
          className={`btn ${activeTab === 'manageRewards' ? 'btn-primary' : 'btn-secondary'}`}
        >
          🎁 إدارة الجوائز والمخزون
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
        >
          📝 سجل الطلبات والموافقات ({requests.filter(r => r.status === 'pending').length} جديد)
        </button>
      </div>

      {activeTab === 'manageRewards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
          {/* Add/Edit Form */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>{editingRewardId ? '✏️ تعديل جائزة' : '➕ إضافة جائزة جديدة'}</h3>
            <form onSubmit={handleRewardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>اسم الجائزة *</label>
                <input type="text" className="form-input" required value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} />
              </div>
              
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>الوصف</label>
                <textarea className="form-input" rows="2" value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>التكلفة (نقاط)</label>
                  <input type="number" className="form-input" min="0" required value={rewardForm.pointsCost} onChange={e => setRewardForm({...rewardForm, pointsCost: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>جائزة مميزة؟</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', height: '42px' }}>
                    <input type="checkbox" checked={rewardForm.isFeatured} onChange={e => setRewardForm({...rewardForm, isFeatured: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                    <span style={{ color: 'var(--gold)', fontWeight: 800 }}>⭐ تبرز في المتجر</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>المخزون الكلي</label>
                  <input type="number" className="form-input" min="1" required value={rewardForm.stock} onChange={e => setRewardForm({...rewardForm, stock: e.target.value, remainingStock: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>المتبقي</label>
                  <input type="number" className="form-input" min="0" required value={rewardForm.remainingStock} onChange={e => setRewardForm({...rewardForm, remainingStock: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>روابط الصور (كل رابط في سطر)</label>
                <textarea className="form-input" rows="3" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" value={rewardForm.images} onChange={e => setRewardForm({...rewardForm, images: e.target.value})} style={{ direction: 'ltr' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingRewardId ? 'حفظ التعديلات' : 'إضافة للجائزة'}</button>
                {editingRewardId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingRewardId(null); setRewardForm({ name: '', description: '', pointsCost: 0, stock: 1, remainingStock: 1, images: '', isFeatured: false }); }}>
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Rewards List */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>الجائزة</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>التكلفة</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>المخزون</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>الحالة</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                      {r.isFeatured && <span style={{ color: 'var(--gold)', marginLeft: '0.5rem' }}>⭐</span>}
                      {r.name}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#34d399', fontWeight: 800 }}>{r.pointsCost} ن</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ color: r.remainingStock > 0 ? 'var(--text-primary)' : 'var(--danger)', fontWeight: 800 }}>{r.remainingStock}</span> / {r.stock}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {r.remainingStock > 0 ? <span style={{ color: '#10b981' }}>متاح</span> : <span style={{ color: '#ef4444' }}>نفد</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEditReward(r)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>تعديل</button>
                        <button onClick={() => handleDeleteReward(r.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rewards.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد جوائز مضافة حالياً.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>تاريخ الطلب</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>الطالب (الغرفة)</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>الجائزة (صورة تاريخية)</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>النقاط</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>الحالة</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const roomName = rooms.find(r => r.id === req.roomId)?.name || 'غرفة محذوفة';
                const prizeName = req.rewardSnapshot ? req.rewardSnapshot.name : 'جائزة غير معروفة';
                const dateStr = new Date(req.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
                
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: req.status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{dateStr}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{req.playerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{roomName}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800 }}>{prizeName}</td>
                    <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: 800 }}>{req.pointsUsed} ن</td>
                    <td style={{ padding: '1rem' }}>{getStatusLabel(req.status)}</td>
                    <td style={{ padding: '1rem' }}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleRequestAction(req.id, 'approved')} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>موافقة</button>
                          <button onClick={() => handleRequestAction(req.id, 'rejected')} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>رفض (إرجاع)</button>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleRequestAction(req.id, 'delivered')} className="btn btn-gold" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>تحديد كمسلّمة 📦</button>
                        </div>
                      )}
                      {(req.status === 'delivered' || req.status === 'rejected') && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>مكتمل التحديث</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد طلبات حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
