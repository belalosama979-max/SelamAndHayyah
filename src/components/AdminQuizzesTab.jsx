import React, { useState } from 'react';
import { getQuizzes, saveQuiz, deleteQuiz } from '../db/database';

export default function AdminQuizzesTab({ onDataChange }) {
  const [quizzes, setQuizzes] = useState(getQuizzes());
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  // States for new/editing quiz
  const [quizForm, setQuizForm] = useState({ 
    title: '', 
    startDate: '', startTime: '', 
    endDate: '', endTime: '' 
  });
  
  // States for new question
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    id: '', text: '', imageUrl: '', type: 'choice_text', points: 10,
    options: ['', '', '', ''], correctAnswer: 0
  });

  const refreshData = () => {
    const updated = getQuizzes();
    setQuizzes(updated);
    if (editingQuiz) {
      setEditingQuiz(updated.find(q => q.id === editingQuiz.id));
    }
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    if (!quizForm.title || !quizForm.startDate || !quizForm.startTime || !quizForm.endDate || !quizForm.endTime) {
      alert('الرجاء إكمال جميع الحقول');
      return;
    }
    
    // Combine date and time
    const startDateTime = new Date(`${quizForm.startDate}T${quizForm.startTime}`);
    const endDateTime = new Date(`${quizForm.endDate}T${quizForm.endTime}`);

    // Validate times
    if (endDateTime <= startDateTime) {
      alert('وقت النهاية يجب أن يكون بعد وقت البداية');
      return;
    }

    saveQuiz({
      title: quizForm.title,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      questions: []
    });
    
    setQuizForm({ title: '', startDate: '', startTime: '', endDate: '', endTime: '' });
    refreshData();
  };

  const handleDeleteQuiz = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التحدي بالكامل؟')) {
      deleteQuiz(id);
      if (editingQuiz?.id === id) setEditingQuiz(null);
      refreshData();
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!editingQuiz) return;
    
    if (!questionForm.text) {
      alert('الرجاء إدخال نص السؤال');
      return;
    }

    const newQuestion = {
      id: Date.now().toString(),
      text: questionForm.text,
      imageUrl: questionForm.imageUrl,
      type: questionForm.type,
      points: Number(questionForm.points),
      options: questionForm.type === 'text' ? [] : questionForm.options.filter(o => o.trim() !== ''),
      correctAnswer: questionForm.type === 'text' ? questionForm.options[0] : Number(questionForm.correctAnswer)
    };

    if (questionForm.type !== 'text' && newQuestion.options.length < 2) {
      alert('الرجاء إدخال خيارين على الأقل');
      return;
    }

    const updatedQuiz = {
      ...editingQuiz,
      questions: [...(editingQuiz.questions || []), newQuestion]
    };

    saveQuiz(updatedQuiz);
    setShowQuestionForm(false);
    
    // Reset question form
    setQuestionForm({
      id: '', text: '', imageUrl: '', type: 'choice_text', points: 10,
      options: ['', '', '', ''], correctAnswer: 0
    });
    refreshData();
  };

  const handleDeleteQuestion = (questionId) => {
    if (!editingQuiz || !window.confirm('حذف هذا السؤال؟')) return;
    
    const updatedQuiz = {
      ...editingQuiz,
      questions: editingQuiz.questions.filter(q => q.id !== questionId)
    };
    saveQuiz(updatedQuiz);
    refreshData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {!editingQuiz ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>➕ إنشاء تحدي أو لغز جديد</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              سيظهر هذا التحدي للطلاب تلقائياً عند دخولهم البوابة خلال الوقت المحدد.
            </p>
            <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">عنوان التحدي</label>
                <input type="text" required value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} className="form-input" placeholder="مثال: لغز يوم الجمعة" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <label className="form-label">📅 تاريخ البداية</label>
                  <input type="date" required value={quizForm.startDate} onChange={e => setQuizForm({...quizForm, startDate: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="form-label">⏰ وقت البداية (الساعة والدقيقة)</label>
                  <input type="time" required value={quizForm.startTime} onChange={e => setQuizForm({...quizForm, startTime: e.target.value})} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <label className="form-label">📅 تاريخ النهاية</label>
                  <input type="date" required value={quizForm.endDate} onChange={e => setQuizForm({...quizForm, endDate: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="form-label">⏰ وقت النهاية (الساعة والدقيقة)</label>
                  <input type="time" required value={quizForm.endTime} onChange={e => setQuizForm({...quizForm, endTime: e.target.value})} className="form-input" />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem' }}>إضافة التحدي</button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📋 التحديات الحالية والسابقة</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {quizzes.length === 0 && <p style={{ color: 'var(--text-muted)' }}>لا توجد تحديات حالياً.</p>}
              {quizzes.map(quiz => {
                const now = new Date();
                const start = new Date(quiz.startTime);
                const end = new Date(quiz.endTime);
                const isActive = now >= start && now <= end;
                const isPast = now > end;
                
                return (
                  <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}` }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {quiz.title}
                        {isActive && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '1rem' }}>نشط الآن</span>}
                        {isPast && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)', borderRadius: '1rem' }}>منتهي</span>}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        من: {start.toLocaleString('ar-EG')} <br/>
                        إلى: {end.toLocaleString('ar-EG')}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        الأسئلة: {quiz.questions?.length || 0}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditingQuiz(quiz)} className="btn btn-secondary">إدارة الأسئلة</button>
                      <button onClick={() => handleDeleteQuiz(quiz.id)} className="btn btn-danger">حذف</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        // ================= إدارة أسئلة التحدي =================
        <div>
          <button onClick={() => setEditingQuiz(null)} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
            🔙 العودة لقائمة التحديات
          </button>
          
          <div style={{ backgroundColor: 'var(--bg-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>إدارة أسئلة: {editingQuiz.title}</h3>
            
            {/* قائمة الأسئلة الحالية */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(!editingQuiz.questions || editingQuiz.questions.length === 0) && (
                <p style={{ color: 'var(--text-muted)' }}>لم يتم إضافة أي أسئلة بعد.</p>
              )}
              {editingQuiz.questions?.map((q, idx) => (
                <div key={q.id} style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', marginLeft: '0.5rem' }}>س{idx + 1}:</span>
                      <span style={{ fontWeight: 600 }}>{q.text}</span>
                      {q.imageUrl && <img src={q.imageUrl} alt="مرفق" style={{ display: 'block', maxHeight: '100px', marginTop: '0.5rem', borderRadius: '4px' }} />}
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>حذف</button>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {q.type === 'text' ? (
                      <p>📝 إجابة كتابية: <strong style={{ color: 'var(--success)' }}>{q.correctAnswer}</strong></p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} style={{ 
                            padding: '0.5rem', 
                            backgroundColor: q.correctAnswer === optIdx ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-dark)',
                            color: q.correctAnswer === optIdx ? 'var(--success)' : 'inherit',
                            border: `1px solid ${q.correctAnswer === optIdx ? 'var(--success)' : 'transparent'}`,
                            borderRadius: '4px'
                          }}>
                            {optIdx + 1}- {q.type === 'choice_image' ? <img src={opt} alt="خيار" style={{ maxHeight: '40px' }} /> : opt}
                            {q.correctAnswer === optIdx && ' ✓'}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>النقاط: {q.points}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* إضافة سؤال جديد */}
            {!showQuestionForm ? (
              <button onClick={() => setShowQuestionForm(true)} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                ➕ إضافة سؤال جديد
              </button>
            ) : (
              <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>سؤال جديد</h4>
                <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div>
                    <label className="form-label">نص السؤال *</label>
                    <textarea required value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})} className="form-input" rows="2" placeholder="اكتب اللغز أو السؤال هنا..." />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">صورة مرفقة مع السؤال (اختياري)</label>
                      <input type="text" value={questionForm.imageUrl} onChange={e => setQuestionForm({...questionForm, imageUrl: e.target.value})} className="form-input" placeholder="رابط صورة (URL)" />
                    </div>
                    <div>
                      <label className="form-label">نقاط السؤال *</label>
                      <input type="number" required min="1" value={questionForm.points} onChange={e => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 0})} className="form-input" />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">نوع الإجابة *</label>
                    <select value={questionForm.type} onChange={e => setQuestionForm({...questionForm, type: e.target.value})} className="form-input">
                      <option value="choice_text">خيارات متعددة (نص)</option>
                      <option value="choice_image">خيارات متعددة (صور)</option>
                      <option value="text">إجابة كتابية (يكتبها الطالب)</option>
                    </select>
                  </div>

                  {/* Options Input */}
                  {questionForm.type !== 'text' ? (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
                      <label className="form-label" style={{ marginBottom: '1rem' }}>الخيارات (املأ خيارين على الأقل)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="radio" 
                              name="correctAnswer" 
                              checked={questionForm.correctAnswer === i} 
                              onChange={() => setQuestionForm({...questionForm, correctAnswer: i})}
                              style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            <input 
                              type={questionForm.type === 'choice_image' ? 'url' : 'text'}
                              value={questionForm.options[i]}
                              onChange={e => {
                                const newOpts = [...questionForm.options];
                                newOpts[i] = e.target.value;
                                setQuestionForm({...questionForm, options: newOpts});
                              }}
                              className="form-input" 
                              placeholder={questionForm.type === 'choice_image' ? `رابط صورة الخيار ${i+1}` : `الخيار ${i+1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>اختر الدائرة بجانب الإجابة الصحيحة.</p>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
                      <label className="form-label">الإجابة الصحيحة بالضبط *</label>
                      <input 
                        type="text" 
                        required 
                        value={questionForm.options[0]} 
                        onChange={e => {
                          const newOpts = [...questionForm.options];
                          newOpts[0] = e.target.value;
                          setQuestionForm({...questionForm, options: newOpts});
                        }} 
                        className="form-input" 
                        placeholder="الإجابة التي يجب أن يكتبها الطالب" 
                      />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>ملاحظة: الإجابات النصية قد تُظلم بسبب الأخطاء الإملائية، يفضل استخدام الخيارات إن أمكن.</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>حفظ السؤال</button>
                    <button type="button" onClick={() => setShowQuestionForm(false)} className="btn btn-secondary">إلغاء</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
