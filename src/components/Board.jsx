import AvatarDisplay from './AvatarDisplay';
import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generatePathCoordinates } from '../utils/helpers';

export default function Board({ 
  players = [], 
  boardEvents = [], 
  animatingPlayerId = null, 
  animationType = null,
  cards = [],
  activePlayer = null,
  setActivePlayer = () => {},
  onApplyCard = () => {},
  onUndo = () => {},
  logs = [],
  showYouAreHere = false
}) {
  // أبعاد الخريطة الافتراضية
  const width = 850;
  const height = 900;

  // وضع ملء الشاشة المحلي
  const [isFullscreen, setIsFullscreen] = useState(false);

  // حالة المواقع المرئية لحركة انسيابية خطوة بخطوة
  const [visualPositions, setVisualPositions] = useState({});

  // توليد إحداثيات الـ 100 خانة
  const pathCoordinates = useMemo(() => generatePathCoordinates(width, height), []);

  // المظهر الفرعي النشط لملء الشاشة
  const [fullscreenTab, setFullscreenTab] = useState('تجويد');
  const [selectedFullscreenCard, setSelectedFullscreenCard] = useState(null);
  const [fullscreenCustomValue, setFullscreenCustomValue] = useState('');

  // حالات أوضاع العرض الجديدة
  // حالات أوضاع العرض الجديدة
  const [isPlayersCollapsed, setIsPlayersCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // حالات تحريك نافذة البطاقات
  const [drawerPos, setDrawerPos] = useState({ x: 180, y: 100 });
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // تهيئة ومزامنة المواقع المرئية للطلاب
  useEffect(() => {
    const newVisuals = { ...visualPositions };
    let hasChanges = false;
    players.forEach(p => {
      if (newVisuals[p.id] === undefined) {
        newVisuals[p.id] = p.position || 1;
        hasChanges = true;
      }
    });
    if (hasChanges) {
      setVisualPositions(newVisuals);
    }
  }, [players]);

  // التحريك التدريجي خطوة بخطوة للطلاب
  useEffect(() => {
    // التحقق مما إذا كان أي لاعب يحتاج إلى تحريك
    const playersToAnimate = players.filter(p => {
      const current = visualPositions[p.id];
      return current !== undefined && current !== p.position;
    });

    if (playersToAnimate.length === 0) return;

    // استخدام مؤقت واحد لتحديث كافة اللاعبين بخطوة واحدة
    const timer = setTimeout(() => {
      setVisualPositions(prev => {
        const next = { ...prev };
        let updated = false;
        players.forEach(p => {
          const current = prev[p.id];
          const target = p.position || 1;
          if (current !== undefined && current !== target) {
            // إذا كان اللاعب يمر بأنيميشن صعود سلم أو هبوط أفعى نشط، فإنه يقفز فورياً لخانة النهاية
            // حتى تتولى تأثيرات الانتقال البصرية CSS تحريكه بخط مستقيم
            if (animatingPlayerId === p.id && (animationType === 'ladder' || animationType === 'snake')) {
              next[p.id] = target;
            } else {
              // الزحف والتحريك الطبيعي خطوة بخطوة
              const step = target > current ? 1 : -1;
              next[p.id] = current + step;
            }
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 80); // سرعة انسيابية 80 ميلي ثانية لكل خانة

    return () => clearTimeout(timer);
  }, [players, visualPositions, animatingPlayerId, animationType]);

  // إغلاق ملء الشاشة بمفتاح Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // تجميع اللاعبين حسب الخانة المرئية لتفادي التداخل
  const playersByCell = useMemo(() => {
    const map = {};
    players.forEach((p) => {
      const pos = visualPositions[p.id] || p.position || 1;
      if (!map[pos]) map[pos] = [];
      map[pos].push(p);
    });
    return map;
  }, [players, visualPositions]);

  // إيجاد إحداثيات السلالم والأفاعي
  const renderedEvents = useMemo(() => {
    return boardEvents.map((evt) => {
      const startNode = pathCoordinates[evt.startPosition - 1];
      const endNode = pathCoordinates[evt.endPosition - 1];
      if (!startNode || !endNode) return null;
      return {
        ...evt,
        x1: startNode.x,
        y1: startNode.y,
        x2: endNode.x,
        y2: endNode.y
      };
    }).filter(Boolean);
  }, [boardEvents, pathCoordinates]);

  // قائمة المعالم الفلسطينية والقدس المباركة
  const landmarks = useMemo(() => {
    return [
      { cell: 1, label: "رفح الصمود (البداية)", emoji: "🏕️", align: 'bottom' },
      { cell: 10, label: "خانيونس الخير", emoji: "🏘️", align: 'top' },
      { cell: 20, label: "غزة العزة", emoji: "🍉", align: 'bottom' },
      { cell: 30, label: "دير البلح", emoji: "🌴", align: 'top' },
      { cell: 40, label: "جباليا الجبل", emoji: "🏔️", align: 'bottom' },
      { cell: 50, label: "بيت حانون", emoji: "🛡️", align: 'top' },
      { cell: 60, label: "باب السلسلة", emoji: "🔑", align: 'bottom' },
      { cell: 70, label: "باب الأسباط", emoji: "🦁", align: 'top' },
      { cell: 80, label: "باب الحديد", emoji: "⚔️", align: 'bottom' },
      { cell: 90, label: "باب المغاربة", emoji: "🚪", align: 'top' },
      { cell: 98, label: "7 أكتوبر", emoji: "🔻", align: 'bottom' },
      { cell: 100, label: "المسجد الأقصى المبارك", emoji: "🕌", align: 'top' }
    ];
  }, []);

  // دالة تحديد لون وتصميم البطاقة العمودية (sports cards style)
  const getVerticalCardStyle = (card, customValueInput = null) => {
    const isBehaviorOrInteraction = card.name === 'بطاقة سلوك' || card.name === 'بطاقة تفاعل ومشاركة';
    let baseColor = card.color;
    if (!baseColor) {
      if (card.category === 'تجويد') baseColor = 'var(--blue)';
      else if (card.category === 'حفظ') baseColor = 'var(--success)';
      else if (card.category === 'متابعة تربوية') baseColor = 'var(--gold)';
      else baseColor = 'var(--bg-tertiary)';
    }
    let border = '1px solid rgba(255,255,255,0.1)';
    let boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
    
    if (isBehaviorOrInteraction) {
      const val = customValueInput !== null ? Number(customValueInput) : null;
      if (val !== null && !isNaN(val)) {
        if (val < 0) {
          baseColor = 'var(--danger)';
          boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
        } else if (val > 0) {
          baseColor = 'var(--success)';
          boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
        }
      }
    }
    
    return {
      backgroundColor: baseColor,
      border,
      boxShadow,
      color: '#fff'
    };
  };

  const handleCardClick = (card) => {
    if (card.value !== null) {
      onApplyCard(card.id, null);
      setSelectedFullscreenCard(null);
      setFullscreenCustomValue('');
    } else {
      setSelectedFullscreenCard(card);
      setFullscreenCustomValue('');
    }
  };

  const handleApplyCustomValue = (e) => {
    e.preventDefault();
    if (!selectedFullscreenCard || fullscreenCustomValue === '') return;
    onApplyCard(selectedFullscreenCard.id, Number(fullscreenCustomValue));
    setSelectedFullscreenCard(null);
    setFullscreenCustomValue('');
  };

  const activeTabCards = useMemo(() => {
    return cards
      .filter(c => c.isEnabled && c.category === fullscreenTab)
      .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
  }, [cards, fullscreenTab]);

  const scaleFactor = isFullscreen ? 1.25 : 1;

  // محتوى اللوحة SVG
  const boardContent = (
    <svg 
      viewBox="0 0 850 900"
      width="100%"
      height="100%"
      style={{
        display: 'block',
        backgroundColor: '#0a0d14',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #111a2e 0%, #06080e 100%)',
        borderRadius: isFullscreen ? '0' : 'var(--radius-md)',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)',
        maxHeight: isFullscreen ? 'none' : '75vh',
        maxWidth: isFullscreen ? 'none' : '100%',
        minWidth: isFullscreen ? 'auto' : '0',
        margin: '0 auto',
        flex: isFullscreen ? 1 : 'none'
      }}
    >
      {/* 1. رسم الطريق العريض كخلفية للمسار */}
      <path
        d={`M ${pathCoordinates.map(p => `${p.x} ${p.y}`).join(' L ')}`}
        fill="none"
        stroke="rgba(31, 41, 55, 0.45)"
        strokeWidth={32 * scaleFactor}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. رسم مسار القافلة المنقط داخل الطريق */}
      <path
        d={`M ${pathCoordinates.map(p => `${p.x} ${p.y}`).join(' L ')}`}
        fill="none"
        stroke="rgba(217, 119, 6, 0.35)"
        strokeWidth={8 * scaleFactor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8,10"
      />

      {/* 3. رسم السلالم (الجسور الخشبية الذهبية) */}
      {renderedEvents.filter(e => e.type === 'ladder').map((evt) => (
        <g key={evt.id}>
          <line 
            x1={evt.x1} y1={evt.y1} x2={evt.x2} y2={evt.y2} 
            stroke="rgba(217, 119, 6, 0.85)" strokeWidth="6" strokeLinecap="round"
          />
          <line 
            x1={evt.x1 - 6} y1={evt.y1} x2={evt.x2 - 6} y2={evt.y2} 
            stroke="rgba(16, 185, 129, 0.9)" strokeWidth="2" strokeLinecap="round"
          />
          <line 
            x1={evt.x1 + 6} y1={evt.y1} x2={evt.x2 + 6} y2={evt.y2} 
            stroke="rgba(16, 185, 129, 0.9)" strokeWidth="2" strokeLinecap="round"
          />
          <line 
            x1={evt.x1} y1={evt.y1} x2={evt.x2} y2={evt.y2} 
            stroke="#fff" strokeWidth="4" strokeDasharray="2,12" strokeLinecap="round"
          />
        </g>
      ))}

      {/* 4. رسم الأفاعي (أحمر متموج بجلد أصفر) */}
      {renderedEvents.filter(e => e.type === 'snake').map((evt) => {
        const dx = evt.x2 - evt.x1;
        const dy = evt.y2 - evt.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;
        
        const cp1x = evt.x1 + dx * 0.3 + nx * 50;
        const cp1y = evt.y1 + dy * 0.3 + ny * 50;
        const cp2x = evt.x1 + dx * 0.7 - nx * 50;
        const cp2y = evt.y1 + dy * 0.7 - ny * 50;
        const pathD = `M ${evt.x1} ${evt.y1} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${evt.x2} ${evt.y2}`;
        
        return (
          <g key={evt.id}>
            <path
              d={pathD}
              fill="none"
              stroke="#dc2626"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={pathD}
              fill="none"
              stroke="#eab308"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4, 12"
            />
            <circle cx={evt.x1} cy={evt.y1} r="9" fill="#991b1b" stroke="#dc2626" strokeWidth="2" />
            <circle cx={evt.x1 - 3} cy={evt.y1 - 2} r="2" fill="#fff" />
            <circle cx={evt.x1 - 3} cy={evt.y1 - 2} r="0.8" fill="#000" />
            <circle cx={evt.x1 + 3} cy={evt.y1 - 2} r="2" fill="#fff" />
            <circle cx={evt.x1 + 3} cy={evt.y1 - 2} r="0.8" fill="#000" />
            <line x1={evt.x1} y1={evt.y1 - 9} x2={evt.x1 - 3} y2={evt.y1 - 15} stroke="#ef4444" strokeWidth="2.5" />
            <line x1={evt.x1} y1={evt.y1 - 9} x2={evt.x1 + 3} y2={evt.y1 - 15} stroke="#ef4444" strokeWidth="2.5" />
          </g>
        );
      })}

      {/* 5. رسم الخانات المعلمية وأرقامها */}
      {pathCoordinates.map((node) => {
        const hasLandmark = landmarks.find(l => l.cell === node.number);
        const isFinishedCell = node.number === 100;
        
        return (
          <g key={node.number}>
            <circle
              cx={node.x}
              cy={node.y}
              r={(isFinishedCell ? 28 : 17) * scaleFactor}
              fill={isFinishedCell ? 'var(--gold)' : (node.number % 2 === 0 ? '#1f2937' : '#111827')}
              stroke={isFinishedCell ? '#fff' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isFinishedCell ? 3 : 1}
              style={{ filter: isFinishedCell ? 'drop-shadow(0 0 10px var(--gold))' : 'none' }}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize={(isFinishedCell ? 24 : 11) * scaleFactor}
              fontWeight="800"
            >
              {isFinishedCell ? "🕌" : node.number}
            </text>

            {hasLandmark && (
              <g>
                <rect
                  x={node.x - (65 * scaleFactor)}
                  y={node.y + (hasLandmark.align === 'bottom' ? 22 * scaleFactor : -44 * scaleFactor)}
                  width={130 * scaleFactor}
                  height={22 * scaleFactor}
                  rx="4"
                  fill="rgba(11, 15, 25, 0.95)"
                  stroke={isFinishedCell ? 'var(--gold)' : '#374151'}
                  strokeWidth="1"
                />
                <text
                  x={node.x}
                  y={node.y + (hasLandmark.align === 'bottom' ? 33 * scaleFactor : -33 * scaleFactor)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isFinishedCell ? '#fff' : '#f9fafb'}
                  fontSize={9.5 * scaleFactor}
                  fontWeight="800"
                >
                  {hasLandmark.emoji} {hasLandmark.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* 6. رموز الطلاب مع عرض أسمائهم عائمةً فوق الرمز مباشرة */}
      {Object.entries(playersByCell).map(([cellStr, cellPlayers]) => {
        const cellNum = Number(cellStr);
        const node = pathCoordinates[cellNum - 1];
        if (!node) return null;
        const total = cellPlayers.length;

        return cellPlayers.map((player, idx) => {
          const angle = (idx / total) * 2 * Math.PI;
          const radius = total > 1 ? 14 * scaleFactor : 0;
          const xOffset = Math.sin(angle) * radius;
          const yOffset = Math.cos(angle) * radius;
          const isAnimating = animatingPlayerId === player.id;
          const isLadder = animationType === 'ladder';

          return (
            <g
              key={player.id}
              transform={`translate(${node.x + xOffset}, ${node.y + yOffset})`}
              style={{
                transition: isAnimating 
                  ? (isLadder ? 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)')
                  : 'transform 0.25s ease-out'
              }}
            >
              {/* نقوم بتحريك العناصر الداخلية فقط بالاهتزاز لتفادي تشويه إحداثيات الحركة */}
              <g className={isAnimating ? (isLadder ? 'climbing-anim-inner' : 'sliding-anim-inner') : ''}>
                {/* مؤشر أنت هنا */}
                {showYouAreHere && activePlayer && activePlayer.id === player.id && (
                  <text
                    x="0"
                    y={-45 * scaleFactor}
                    textAnchor="middle"
                    fill="var(--gold)"
                    fontSize={11 * scaleFactor}
                    fontWeight="900"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))', animation: 'bounceHere 1.5s infinite' }}
                  >
                    أنت هنا 🔽
                  </text>
                )}
                {/* اسم اللاعب عائماً فوق الرمز مباشرة */}
                <rect 
                  x={-35 * scaleFactor} 
                  y={-30 * scaleFactor} 
                  width={70 * scaleFactor} 
                  height={14 * scaleFactor} 
                  rx={3 * scaleFactor} 
                  fill={showYouAreHere && activePlayer && activePlayer.id === player.id ? "rgba(217, 119, 6, 0.95)" : "rgba(0, 0, 0, 0.75)"} 
                  stroke={showYouAreHere && activePlayer && activePlayer.id === player.id ? "var(--gold)" : "rgba(255, 255, 255, 0.2)"}
                  strokeWidth={showYouAreHere && activePlayer && activePlayer.id === player.id ? "1.5" : "0.5"}
                />
                <text
                  x="0"
                  y={-23 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={8.5 * scaleFactor}
                  fontWeight="800"
                >
                  {player.name}
                </text>

                {/* دائرة الرمز المميز */}
                <circle
                  r={13.5 * scaleFactor}
                  fill={player.color || '#3b82f6'}
                  stroke="#fff"
                  strokeWidth={1.5 * scaleFactor}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                />
                <text
                  dy={0.5 * scaleFactor}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#fff"
                  fontSize={11 * scaleFactor}
                  fontWeight="900"
                >
                  <AvatarDisplay avatar={player.avatar || player.name.charAt(0)} size="1em" />
                </text>
              </g>
            </g>
          );
        });
      })}
    </svg>
  );

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      border: '1px solid var(--border-color)',
      position: 'relative'
    }}>
      {/* عنوان الخريطة وزر التكبير */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🕌 خريطة الرحلة نحو المسجد الأقصى المبارك
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            النقاط تنقل الطلاب على المسار. السلالم تصعد بهم، والأفاعي تعيدهم للأسفل (الهدف: 7000 نقطة).
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="btn btn-gold"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            🖥️ تكبير وملء الشاشة
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
              <span style={{ width: '10px', height: '4px', backgroundColor: 'var(--success)' }} />
              سلم (صعود)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
              <span style={{ width: '10px', height: '4px', backgroundColor: 'var(--danger)' }} />
              أفعى (هبوط)
            </span>
          </div>
        </div>
      </div>

      {/* عرض الخريطة العادي */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        {boardContent}
      </div>

      {/* نافذة التكبير بملء الشاشة */}
      {isFullscreen && typeof document !== 'undefined' ? createPortal(
        <div 
          onMouseMove={(e) => {
            if (isDraggingDrawer) {
              setDrawerPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            }
          }}
          onMouseUp={() => setIsDraggingDrawer(false)}
          onMouseLeave={() => setIsDraggingDrawer(false)}
          className="force-landscape-mobile"
          style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#070a13',
          zIndex: 1600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: 0,
          direction: 'rtl',
          overflow: 'hidden'
        }}>
          
          {/* إغلاق الخريطة إذا كانت لوحة المعلم مخفية (كما في بوابة الأولياء) */}
          {cards.length === 0 && (
            <button onClick={() => setIsFullscreen(false)} title="إغلاق العرض" className="btn btn-danger" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 2000, padding: '0.6rem 1rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>❌ إغلاق</button>
          )}

          {/* ====== شريط علوي للموبايل ====== */}
          {cards.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(11,15,25,0.95)', borderBottom: '1px solid var(--border-color)',
              flexShrink: 0, flexWrap: 'wrap'
            }} className="fullscreen-topbar">
              <button onClick={() => setIsFullscreen(false)} className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>❌</button>
              {activePlayer && <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.9rem' }}><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><AvatarDisplay avatar={activePlayer.avatar} size="1.2rem" /> <span>{activePlayer.name}</span></div></span>}
              <div style={{ display: 'flex', gap: '0.4rem', flex: 1, justifyContent: 'flex-end' }}>
                {['تجويد', 'حفظ', 'متابعة تربوية'].map((tab) => (
                  <button key={tab} onClick={() => { setFullscreenTab(tab); setIsDrawerOpen(true); }} className="btn" style={{
                    fontSize: '0.75rem', padding: '0.35rem 0.6rem',
                    backgroundColor: fullscreenTab === tab && isDrawerOpen ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: fullscreenTab === tab && isDrawerOpen ? '#fff' : 'var(--text-secondary)',
                  }}>{tab}</button>
                ))}
              </div>
            </div>
          )}

          {/* ====== المنتصف: خريطة + لاعبون (Desktop Row) ====== */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minHeight: 0 }}>
            
            {/* الفئات على اليسار - Desktop فقط */}
            {cards.length > 0 && (
              <div className="fullscreen-side-players" style={{ 
                width: '160px', flexDirection: 'column', gap: '1rem', flexShrink: 0,
                padding: '1rem 0.5rem', alignItems: 'stretch', backgroundColor: 'rgba(11,15,25,0.9)', 
                borderLeft: '1px solid var(--border-color)'
              }}>
                <button onClick={() => setIsFullscreen(false)} className="btn btn-danger" style={{ marginBottom: '1rem', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 800 }}>❌ إغلاق</button>
                {['تجويد', 'حفظ', 'متابعة تربوية'].map((tab) => (
                  <button key={tab} onClick={() => { setFullscreenTab(tab); setIsDrawerOpen(true); }} className="btn" style={{
                    height: '55px', fontSize: '1rem', fontWeight: 800, padding: '0.5rem',
                    backgroundColor: fullscreenTab === tab && isDrawerOpen ? 'var(--primary)' : 'var(--bg-secondary)', 
                    color: fullscreenTab === tab && isDrawerOpen ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${fullscreenTab === tab && isDrawerOpen ? 'var(--primary-light)' : 'var(--border-color)'}`
                  }}>{tab}</button>
                ))}
              </div>
            )}

            {/* بطاقات Drawer العائمة */}
            {isDrawerOpen && activePlayer && (
              <div className="glass-panel fade-in" style={{
                position: 'absolute', left: `${drawerPos.x}px`, top: `${drawerPos.y}px`, width: 'min(340px, 90vw)', zIndex: 1700,
                display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '2px solid var(--primary)'
              }}>
                <div 
                  onMouseDown={(e) => { setIsDraggingDrawer(true); setDragOffset({ x: e.clientX - drawerPos.x, y: e.clientY - drawerPos.y }); }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: fullscreenTab === 'تجويد' ? 'var(--blue)' : fullscreenTab === 'حفظ' ? 'var(--success)' : 'var(--gold)', cursor: 'move' }}
                >
                  <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0, userSelect: 'none' }}>{fullscreenTab} - {activePlayer.name}</h3>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>
                
                <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
                  {!selectedFullscreenCard ? (
                    activeTabCards.map(card => (
                      <button key={card.id} onClick={() => { handleCardClick(card); }} className="referee-card" style={{ ...getVerticalCardStyle(card, null) }}>
                        <span className="referee-card-category">{card.category}</span>
                        <strong className="referee-card-name">{card.name}</strong>
                        <span className="referee-card-value">{card.value !== null ? (card.value > 0 ? `+${card.value}` : card.value) : '؟'}</span>
                      </button>
                    ))
                  ) : (
                    <form onSubmit={(e) => { handleApplyCustomValue(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="referee-card" style={{ ...getVerticalCardStyle(selectedFullscreenCard, fullscreenCustomValue) }}>
                          <span className="referee-card-category">{selectedFullscreenCard.category}</span>
                          <strong className="referee-card-name">{selectedFullscreenCard.name}</strong>
                          <span className="referee-card-value">{fullscreenCustomValue !== '' ? (Number(fullscreenCustomValue) > 0 ? `+${fullscreenCustomValue}` : fullscreenCustomValue) : '؟'}</span>
                        </div>
                      </div>
                      <input type="number" required placeholder="أدخل القيمة" value={fullscreenCustomValue} onChange={(e) => setFullscreenCustomValue(e.target.value)} className="form-input" style={{ textAlign: 'center', fontSize: '1.1rem', padding: '0.75rem' }} autoFocus />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '0.95rem' }}>تطبيق</button>
                      <button type="button" onClick={() => setSelectedFullscreenCard(null)} className="btn btn-secondary" style={{ padding: '0.75rem', fontSize: '0.95rem' }}>عودة</button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* الخريطة في المنتصف */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {boardContent}
            </div>

            {/* شريط اللاعبين على اليمين - Desktop */}
            <div style={{ 
              width: isPlayersCollapsed ? '55px' : '260px', flexShrink: 0, transition: 'width 0.3s ease',
              backgroundColor: 'rgba(11,15,25,0.9)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }} className="fullscreen-side-players">
              <button onClick={() => setIsPlayersCollapsed(!isPlayersCollapsed)} className="btn" style={{ margin: '0.4rem', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }}>
                {isPlayersCollapsed ? '👥' : '← إخفاء'}
              </button>
              {!isPlayersCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.4rem', overflowY: 'auto', flex: 1 }}>
                  {players.length > 0 ? players.map((p) => {
                    const isSelected = activePlayer && activePlayer.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setActivePlayer(p)} className="btn" style={{
                        justifyContent: 'space-between', backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.03)'}`, color: isSelected ? '#fff' : 'var(--text-secondary)',
                        padding: '0.5rem 0.6rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', minHeight: 'auto'
                      }}>
                        <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{p.rank}. <AvatarDisplay avatar={p.avatar} size="1.2rem" /> {p.name}</span>
                        <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>{p.points}</span>
                      </button>
                    );
                  }) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem' }}>لا يوجد طلاب</div>}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}

{/* أنيميشن دخول ملء الشاشة */}
      <style>{`
        @keyframes fullscreenEnter {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceHere {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .vertical-game-card:hover {
          transform: translateY(-5px) scale(1.03);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4) !important;
        }
        /* Desktop: side panel layout */
        @media (min-width: 900px) {
          .fullscreen-topbar { display: none !important; }
          .fullscreen-side-players { display: flex !important; }
        }
        /* Mobile: topbar + hide side panels */
        @media (max-width: 899px) {
          .fullscreen-topbar { display: flex !important; }
          .fullscreen-side-players { display: none !important; }
        }
      `}</style>
    </div>
  );
}
