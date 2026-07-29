import React, { useState, useEffect } from 'react';

export default function StudentQuiz({ quiz, student, onComplete }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [textAnswer, setTextAnswer] = useState('');

  // Puzzle state
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [showReference, setShowReference] = useState(false);

  useEffect(() => {
    const currentQ = quiz?.questions?.[currentQuestionIdx];
    if (currentQ && currentQ.type === 'puzzle') {
      const pieces = currentQ.options.map((src, idx) => ({ id: idx, src }));
      // Shuffle array securely
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      // Ensure it's not solved initially (very rare but possible for small grids)
      if (pieces.length > 1 && pieces.every((p, i) => p.id === i)) {
        [pieces[0], pieces[1]] = [pieces[1], pieces[0]];
      }
      setPuzzlePieces(pieces);
      setShowReference(false);
    }
  }, [currentQuestionIdx, quiz]);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
        <h3>لا توجد أسئلة في هذا التحدي.</h3>
        <button onClick={() => onComplete(0)} className="btn btn-primary" style={{ marginTop: '1rem' }}>دخول البوابة</button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];

  const handleAnswer = (answerValue) => {
    if (feedback !== null) return; // Prevent multiple clicks

    let isCorrect = false;
    if (currentQuestion.type === 'text') {
      isCorrect = answerValue.trim() === currentQuestion.correctAnswer.trim();
    } else if (currentQuestion.type === 'puzzle') {
      isCorrect = answerValue === true; // For puzzle, we pass true if they solved it
    } else {
      isCorrect = answerValue === currentQuestion.correctAnswer;
    }

    if (isCorrect) {
      setFeedback('correct');
      setEarnedPoints(prev => prev + currentQuestion.points);
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setTextAnswer('');
      if (currentQuestionIdx + 1 < quiz.questions.length) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 2000);
  };

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    // For Firefox
    e.dataTransfer.setData("text/plain", idx);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const newPieces = [...puzzlePieces];
    const temp = newPieces[draggedIdx];
    newPieces[draggedIdx] = newPieces[targetIdx];
    newPieces[targetIdx] = temp;
    
    setPuzzlePieces(newPieces);
    setDraggedIdx(null);

    // Check win condition
    const isWin = newPieces.every((p, i) => p.id === i);
    if (isWin) {
      handleAnswer(true);
    }
  };

  if (isFinished) {
    return (
      <div className="quiz-container" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', padding: '2rem',
        background: 'linear-gradient(135deg, var(--bg-dark) 0%, #1e1b4b 100%)',
        color: '#fff', textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
          padding: '3rem 2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '500px', width: '100%', animation: 'fadeIn 0.5s ease-out'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary-light)' }}>🎉 انتهى التحدي!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            أحسنت يا بطل! لقد أنهيت <strong>{quiz.title}</strong>
          </p>
          <div style={{
            fontSize: '3rem', fontWeight: 900, color: 'var(--success)', 
            textShadow: '0 0 20px rgba(16,185,129,0.5)', marginBottom: '2rem'
          }}>
            +{earnedPoints} نقطة
          </div>
          <button 
            onClick={() => onComplete(earnedPoints)} 
            className="btn btn-primary" 
            style={{ fontSize: '1.2rem', padding: '1rem 2rem', width: '100%', borderRadius: '50px' }}
          >
            🚀 الدخول إلى صفحتي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, var(--bg-dark) 0%, #0f172a 100%)',
      color: '#fff', padding: '1.5rem', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(13,148,136,0.1) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-light)' }}>{quiz.title}</h3>
        <div style={{ fontSize: '1rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '20px' }}>
          سؤال {currentQuestionIdx + 1} / {quiz.questions.length}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1,
        animation: 'slideUp 0.4s ease-out'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-glass)', border: '1px solid rgba(255,255,255,0.15)',
          padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '600px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.5, marginBottom: currentQuestion.imageUrl ? '1rem' : '2rem' }}>
            {currentQuestion.text}
          </h2>
          
          {currentQuestion.imageUrl && currentQuestion.type !== 'puzzle' && (
            <img 
              src={currentQuestion.imageUrl} 
              alt="صورة السؤال" 
              style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', marginBottom: '2rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.5rem' }} 
            />
          )}

          <div style={{ fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'right' }}>
            🎁 قيمة السؤال: {currentQuestion.points} نقطة
          </div>

          {currentQuestion.type === 'puzzle' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <p style={{ color: 'var(--text-secondary)' }}>اسحب القطع لتبديل أماكنها لترتيب الصورة بشكل صحيح!</p>
                {currentQuestion.imageUrl && (
                  <button onClick={() => setShowReference(!showReference)} className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>
                    {showReference ? 'إخفاء المرجع' : '👁️ عرض المرجع'}
                  </button>
                )}
              </div>
              
              {showReference && currentQuestion.imageUrl && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <img src={currentQuestion.imageUrl} alt="الشكل النهائي" style={{ maxHeight: '150px', borderRadius: '8px', border: '2px solid var(--primary-light)' }} />
                </div>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${currentQuestion.gridColumns || 2}, 1fr)`, 
                gap: '4px', 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                padding: '4px', 
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px'
              }}>
                {puzzlePieces.map((piece, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, idx)}
                    style={{
                      aspectRatio: '1',
                      border: draggedIdx === idx ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'grab',
                      opacity: draggedIdx === idx ? 0.5 : 1,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border 0.2s'
                    }}
                    onDragOverCapture={(e) => {
                      e.currentTarget.style.border = '2px dashed var(--primary)';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.border = draggedIdx === idx ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.2)';
                    }}
                  >
                    {piece.src ? (
                      <img src={piece.src} alt={`قطعة`} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>؟</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : currentQuestion.type === 'text' ? (
            <form onSubmit={(e) => { e.preventDefault(); handleAnswer(textAnswer); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                required 
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا..." 
                className="form-input" 
                style={{ fontSize: '1.2rem', padding: '1rem', textAlign: 'center' }}
                disabled={feedback !== null}
              />
              <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.8rem' }} disabled={feedback !== null}>
                إرسال الإجابة
              </button>
            </form>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: currentQuestion.type === 'choice_image' ? 'repeat(auto-fit, minmax(120px, 1fr))' : '1fr', 
              gap: '1rem' 
            }}>
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={feedback !== null}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: currentQuestion.type === 'choice_image' ? '0.5rem' : '1rem 1.5rem',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: feedback !== null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: currentQuestion.type === 'choice_image' ? '120px' : 'auto'
                  }}
                  onMouseOver={(e) => { if(!feedback) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; } }}
                  onMouseOut={(e) => { if(!feedback) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                >
                  {currentQuestion.type === 'choice_image' ? (
                    <img src={opt} alt="خيار" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    opt
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: feedback === 'correct' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
          zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ fontSize: '5rem', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            {feedback === 'correct' ? '✅' : '❌'}
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {feedback === 'correct' ? 'إجابة صحيحة!' : 'إجابة خاطئة!'}
          </h2>
          {feedback === 'correct' && (
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem' }}>
              +{currentQuestion.points} نقطة
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
