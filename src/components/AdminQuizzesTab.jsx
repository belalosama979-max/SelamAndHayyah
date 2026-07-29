import React, { useState } from 'react';
import { getQuizzes, saveQuiz, deleteQuiz } from '../db/database';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// دالة مساعدة لرفع الصور كـ Base64 مع ضغط الصورة لتجنب مشكلة سعة التخزين
const handleImageUpload = (e, callback) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // ضغط بجودة 70%
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

export default function AdminQuizzesTab({ onDataChange }) {
  const [quizzes, setQuizzes] = useState(getQuizzes());
  const [editingQuiz, setEditingQuiz] = useState(null); // When managing a quiz's questions
  const [editingQuizDetailsId, setEditingQuizDetailsId] = useState(null); // When editing quiz title/dates

  // States for new/editing quiz details
  const [quizForm, setQuizForm] = useState({ 
    title: '', 
    startDate: new Date(), 
    endDate: new Date() 
  });
  
  // States for new/editing question
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    id: '', text: '', imageUrl: '', type: 'choice_text', points: 10,
    options: ['', '', '', ''], correctAnswer: 0, gridColumns: 2
  });

  const refreshData = () => {
    const updated = getQuizzes();
    setQuizzes(updated);
    if (editingQuiz) {
      setEditingQuiz(updated.find(q => q.id === editingQuiz.id));
    }
  };

  const handleCreateOrUpdateQuiz = (e) => {
    e.preventDefault();
    if (!quizForm.title || !quizForm.startDate || !quizForm.endDate) {
      alert('الرجاء إكمال جميع الحقول');
      return;
    }
    
    // Validate times
    if (quizForm.endDate <= quizForm.startDate) {
      alert('وقت النهاية يجب أن يكون بعد وقت البداية');
      return;
    }

    if (editingQuizDetailsId) {
      const existingQuiz = quizzes.find(q => q.id === editingQuizDetailsId);
      saveQuiz({
        ...existingQuiz,
        title: quizForm.title,
        startTime: quizForm.startDate.toISOString(),
        endTime: quizForm.endDate.toISOString()
      });
      setEditingQuizDetailsId(null);
    } else {
      saveQuiz({
        title: quizForm.title,
        startTime: quizForm.startDate.toISOString(),
        endTime: quizForm.endDate.toISOString(),
        questions: []
      });
    }
    
    setQuizForm({ title: '', startDate: new Date(), endDate: new Date() });
    refreshData();
  };

  const handleEditQuizDetails = (quiz) => {
    setEditingQuizDetailsId(quiz.id);
    setQuizForm({
      title: quiz.title,
      startDate: new Date(quiz.startTime),
      endDate: new Date(quiz.endTime)
    });
  };

  const cancelEditQuizDetails = () => {
    setEditingQuizDetailsId(null);
    setQuizForm({ title: '', startDate: new Date(), endDate: new Date() });
  };

  const handleDeleteQuiz = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التحدي بالكامل؟')) {
      deleteQuiz(id);
      if (editingQuiz?.id === id) setEditingQuiz(null);
      if (editingQuizDetailsId === id) cancelEditQuizDetails();
      refreshData();
    }
  };

  const handleEditQuestion = (question) => {
    setShowQuestionForm(true);
    setEditingQuestionId(question.id);
    
    // إذا كان نوع السؤال نصي، الخيار الصحيح يكون في options[0]، لكننا نجهزه ليكون متوافقاً مع الفورم
    setQuestionForm({
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl || '',
      type: question.type,
      points: question.points,
      options: question.type === 'text' 
        ? [question.correctAnswer, '', '', ''] 
        : (question.type === 'puzzle' ? question.options : [...question.options, '', '', '', ''].slice(0, 4)),
      correctAnswer: question.type === 'text' ? 0 : question.correctAnswer,
      gridColumns: question.gridColumns || 2
    });
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!editingQuiz) return;
    
    if (!questionForm.text) {
      alert('الرجاء إدخال نص السؤال');
      return;
    }

    const newQuestion = {
      id: editingQuestionId || Date.now().toString(),
      text: questionForm.text,
      imageUrl: questionForm.imageUrl,
      type: questionForm.type,
      points: Number(questionForm.points),
      options: questionForm.type === 'text' ? [] : questionForm.options.filter(o => o.trim() !== ''),
      correctAnswer: questionForm.type === 'text' ? questionForm.options[0] : Number(questionForm.correctAnswer),
      gridColumns: Number(questionForm.gridColumns)
    };

    if (questionForm.type !== 'text' && questionForm.type !== 'puzzle' && newQuestion.options.length < 2) {
      alert('الرجاء إدخال خيارين على الأقل');
      return;
    }
    
    if (questionForm.type === 'puzzle' && newQuestion.options.length < 4) {
      alert('الرجاء إضافة 4 قطع على الأقل للعبة التركيب');
      return;
    }

    let updatedQuestions = editingQuiz.questions || [];
    
    if (editingQuestionId) {
      updatedQuestions = updatedQuestions.map(q => q.id === editingQuestionId ? newQuestion : q);
    } else {
      updatedQuestions = [...updatedQuestions, newQuestion];
    }

    const updatedQuiz = {
      ...editingQuiz,
      questions: updatedQuestions
    };

    saveQuiz(updatedQuiz);
    setShowQuestionForm(false);
    setEditingQuestionId(null);
    
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {editingQuizDetailsId ? '✏️ تعديل بيانات التحدي' : '➕ إنشاء تحدي أو لغز جديد'}
            </h3>
            {!editingQuizDetailsId && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                سيظهر هذا التحدي للطلاب تلقائياً عند دخولهم البوابة خلال الوقت المحدد.
              </p>
            )}
            
            <form onSubmit={handleCreateOrUpdateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">عنوان التحدي</label>
                <input type="text" required value={quizForm.title} onChange={e => setQuizForm({...quizForm, title: e.target.value})} className="form-input" placeholder="مثال: لغز يوم الجمعة" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div>
                  <label className="form-label">📅 وقت وتاريخ البداية</label>
                  <DatePicker
                    selected={quizForm.startDate}
                    onChange={(date) => setQuizForm({ ...quizForm, startDate: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="الوقت"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="form-input custom-datepicker"
                  />
                </div>
                <div>
                  <label className="form-label">📅 وقت وتاريخ النهاية</label>
                  <DatePicker
                    selected={quizForm.endDate}
                    onChange={(date) => setQuizForm({ ...quizForm, endDate: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="الوقت"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="form-input custom-datepicker"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
                  {editingQuizDetailsId ? 'حفظ التعديلات' : 'إضافة التحدي'}
                </button>
                {editingQuizDetailsId && (
                  <button type="button" onClick={cancelEditQuizDetails} className="btn btn-secondary">إلغاء التعديل</button>
                )}
              </div>
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
                  <div key={quiz.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}`, flexWrap: 'wrap', gap: '1rem' }}>
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
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setEditingQuiz(quiz)} className="btn btn-primary">إدارة الأسئلة</button>
                      <button onClick={() => handleEditQuizDetails(quiz)} className="btn btn-secondary">تعديل الموعد</button>
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
          <button onClick={() => { setEditingQuiz(null); setShowQuestionForm(false); setEditingQuestionId(null); }} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
            🔙 العودة لقائمة التحديات
          </button>
          
          <div style={{ backgroundColor: 'var(--bg-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>إدارة أسئلة: {editingQuiz.title}</h3>
            
            {/* قائمة الأسئلة الحالية */}
            {!showQuestionForm && (
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEditQuestion(q)} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>تعديل</button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>حذف</button>
                      </div>
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
            )}

            {/* إضافة سؤال جديد */}
            {!showQuestionForm ? (
              <button onClick={() => {
                setEditingQuestionId(null);
                setQuestionForm({
                  id: '', text: '', imageUrl: '', type: 'choice_text', points: 10,
                  options: ['', '', '', ''], correctAnswer: 0
                });
                setShowQuestionForm(true);
              }} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                ➕ إضافة سؤال جديد
              </button>
            ) : (
              <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                  {editingQuestionId ? 'تعديل السؤال' : 'سؤال جديد'}
                </h4>
                <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div>
                    <label className="form-label">نص السؤال *</label>
                    <textarea required value={questionForm.text} onChange={e => setQuestionForm({...questionForm, text: e.target.value})} className="form-input" rows="2" placeholder="اكتب اللغز أو السؤال هنا..." />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="form-label">صورة مرفقة مع السؤال (اختياري)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" value={questionForm.imageUrl} onChange={e => setQuestionForm({...questionForm, imageUrl: e.target.value})} className="form-input" placeholder="رابط صورة أو ارفع صورة" />
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          رفع 📁
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (base64) => setQuestionForm({...questionForm, imageUrl: base64}))} />
                        </label>
                      </div>
                      {questionForm.imageUrl && <img src={questionForm.imageUrl} alt="preview" style={{ maxHeight: '50px', marginTop: '0.5rem' }} />}
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
                      <option value="puzzle">لعبة تركيب صور (Jigsaw)</option>
                    </select>
                  </div>

                  {/* Options Input */}
                  {questionForm.type === 'puzzle' ? (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
                      <label className="form-label" style={{ marginBottom: '1rem' }}>قطع التركيب (ارفع القطع بالترتيب الصحيح)</label>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>عدد الأعمدة في الشبكة:</label>
                        <select value={questionForm.gridColumns} onChange={e => setQuestionForm({...questionForm, gridColumns: e.target.value})} className="form-input" style={{ width: '150px' }}>
                          <option value="2">2 أعمدة (شبكة 2×2 مثلاً)</option>
                          <option value="3">3 أعمدة (شبكة 3×3 مثلاً)</option>
                          <option value="4">4 أعمدة (شبكة 4×4 مثلاً)</option>
                        </select>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {questionForm.options.map((opt, i) => (
                          <div key={i} style={{ position: 'relative', border: '1px dashed var(--border-light)', borderRadius: '4px', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {opt ? (
                              <>
                                <img src={opt} alt={`قطعة ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => {
                                  const newOpts = [...questionForm.options];
                                  newOpts.splice(i, 1);
                                  setQuestionForm({...questionForm, options: newOpts});
                                }} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>X</button>
                              </>
                            ) : (
                              <input type="text" value={opt} onChange={e => {
                                const newOpts = [...questionForm.options];
                                newOpts[i] = e.target.value;
                                setQuestionForm({...questionForm, options: newOpts});
                              }} placeholder="رابط" style={{ width: '100%', border: 'none', background: 'transparent', color: '#fff', padding: '5px' }} />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                          ➕ رفع قطعة جديدة
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (base64) => {
                            setQuestionForm({...questionForm, options: [...questionForm.options.filter(o => o.trim() !== ''), base64]});
                          })} />
                        </label>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>سيقوم النظام ببعثرة القطع عشوائياً للطالب، وسيتعين عليه إعادتها لهذا الترتيب.</p>
                    </div>
                  ) : questionForm.type !== 'text' ? (
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
                      <label className="form-label" style={{ marginBottom: '1rem' }}>الخيارات (املأ خيارين على الأقل)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <input 
                              type="radio" 
                              name="correctAnswer" 
                              checked={questionForm.correctAnswer === i} 
                              onChange={() => setQuestionForm({...questionForm, correctAnswer: i})}
                              style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <input 
                                type={questionForm.type === 'choice_image' ? 'text' : 'text'}
                                value={questionForm.options[i]}
                                onChange={e => {
                                  const newOpts = [...questionForm.options];
                                  newOpts[i] = e.target.value;
                                  setQuestionForm({...questionForm, options: newOpts});
                                }}
                                className="form-input" 
                                placeholder={questionForm.type === 'choice_image' ? `رابط الصورة ${i+1}` : `الخيار ${i+1}`}
                              />
                              {questionForm.type === 'choice_image' && (
                                <label className="btn btn-secondary" style={{ cursor: 'pointer', textAlign: 'center', fontSize: '0.8rem', padding: '0.3rem' }}>
                                  أو ارفع صورة 📁
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (base64) => {
                                    const newOpts = [...questionForm.options];
                                    newOpts[i] = base64;
                                    setQuestionForm({...questionForm, options: newOpts});
                                  })} />
                                </label>
                              )}
                              {questionForm.type === 'choice_image' && questionForm.options[i] && (
                                <img src={questionForm.options[i]} alt="preview" style={{ maxHeight: '40px', objectFit: 'contain' }} />
                              )}
                            </div>
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
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingQuestionId ? 'حفظ التعديلات' : 'حفظ السؤال'}</button>
                    <button type="button" onClick={() => { setShowQuestionForm(false); setEditingQuestionId(null); }} className="btn btn-secondary">إلغاء</button>
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
