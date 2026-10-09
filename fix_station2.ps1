$content = Get-Content 'src\components\SimulatePhase.jsx' -Raw
$newStation2 = @"
/* ═══════════════ STATION 2: Triangle Card Match ═══════════════ */
const CARD_SET = [
  { id: 0, pts: '50,8 92,82 8,82',  sides: [60, 60, 60], angles: [60, 60, 60],  sideCls: 'Equilateral', angleCls: 'Acute',  color: '#2563eb', hint: 'All three sides look equal. All angles look the same!' },
  { id: 1, pts: '10,82 90,82 10,8',  sides: [40, 80, 57], angles: [90, 63, 27], sideCls: 'Scalene',     angleCls: 'Right',   color: '#f59e0b', hint: 'That square corner means one angle is exactly 90°!' },
  { id: 2, pts: '50,8  82,82 18,82', sides: [55, 55, 40], angles: [63, 63, 54], sideCls: 'Isosceles',   angleCls: 'Acute',   color: '#0891b2', hint: 'Two equal sides — like a tent. All angles are less than 90°.' },
  { id: 3, pts: '8,82  92,82 72,8',  sides: [50, 36, 72], angles: [40, 110, 30],sideCls: 'Scalene',     angleCls: 'Obtuse',  color: '#e11d48', hint: 'All different sides, and one angle is bigger than 90° — very wide!' },
  { id: 4, pts: '50,8  88,82 12,82', sides: [60, 60, 60], angles: [60, 60, 60], sideCls: 'Equilateral', angleCls: 'Acute',   color: '#7c3aed', hint: 'Looks like the first card — perfectly balanced in every way!' },
  { id: 5, pts: '20,82 80,82 50,8',  sides: [46, 46, 60], angles: [70, 70, 40], sideCls: 'Isosceles',   angleCls: 'Acute',   color: '#059669', hint: 'Two equal sides and a different base. All angles are sharp!' },
  { id: 6, pts: '8,82  92,82 25,8',  sides: [35, 68, 78], angles: [30, 55, 95], sideCls: 'Scalene',     angleCls: 'Obtuse',  color: '#dc2626', hint: 'No equal sides. One angle is just over 90° — slightly obtuse.' },
  { id: 7, pts: '8,82  92,82 8,18',  sides: [64, 84, 64], angles: [90, 45, 45], sideCls: 'Isosceles',   angleCls: 'Right',   color: '#d97706', hint: '2 equal sides AND a right angle — the classic 45-45-90!' },
];

const SIDE_LABELS   = ['Equilateral', 'Isosceles', 'Scalene'];
const ANGLE_LABELS  = ['Acute', 'Right', 'Obtuse'];
const SIDE_COLORS   = { Equilateral: '#2563eb', Isosceles: '#0891b2', Scalene: '#8b5cf6' };
const ANGLE_COLORS  = { Acute: '#10b981', Right: '#f59e0b', Obtuse: '#f97316' };

function Station2({ onNext }) {
  const [cardIdx, setCardIdx]       = useState(0);
  const [sidePick, setSidePick]     = useState(null);
  const [anglePick, setAnglePick]   = useState(null);
  const [submitted, setSubmitted]   = useState(false);
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);

  const card = CARD_SET[cardIdx];
  const sideCorrect  = sidePick  === card.sideCls;
  const angleCorrect = anglePick === card.angleCls;
  const bothCorrect  = sideCorrect && angleCorrect;

  const handleSubmit = () => {
    if (!sidePick || !anglePick) return;
    setSubmitted(true);
    if (bothCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playAudio('correct');
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (cardIdx >= CARD_SET.length - 1) {
      onNext();
    } else {
      setCardIdx(i => i + 1);
      setSidePick(null);
      setAnglePick(null);
      setSubmitted(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div className="station-header">
        <h2>🗂️ Station B — Triangle Card Match</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6 }}>
          Look at each triangle card closely. Classify it <strong>by sides</strong> AND <strong>by angles</strong>!
        </p>
      </div>

      {/* Progress & Score */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {CARD_SET.map((_, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 6,
              background: i < cardIdx ? 'var(--green)' : i === cardIdx ? 'var(--amber)' : 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: i <= cardIdx ? 'white' : 'var(--text-muted)',
              transition: 'all 0.3s',
            }}>{i < cardIdx ? '✓' : i + 1}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.15)', border: '1px solid var(--amber)', fontSize: '0.82rem', fontWeight: 800, color: 'var(--amber)' }}>
            ✨ Score: {score}/{CARD_SET.length}
          </span>
          {streak >= 2 && (
            <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--red)', fontSize: '0.82rem', fontWeight: 800, color: 'var(--red-light)' }}>
              🔥 Streak: {streak}
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {/* Triangle Card */}
        <div style={{
          background: 'rgba(0,0,0,0.25)', border: `2px solid `$card.color`55`,
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          minWidth: 200, flex: '0 0 auto',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Card {cardIdx + 1} of {CARD_SET.length}
          </div>
          <svg viewBox="0 0 100 90" width={160} height={140}>
            <polygon points={card.pts} fill={`$card.color`22`} stroke={card.color} strokeWidth="2.5" strokeLinejoin="round" />
            {submitted && card.angleCls === 'Right' && (
              <rect x="8" y="70" width="12" height="12" fill="none" stroke={card.color} strokeWidth="1.5" />
            )}
          </svg>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {card.sides.map((s, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)',
              }}>Side {['a','b','c'][i]}: {s}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {card.angles.map((a, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)',
              }}>∠{['A','B','C'][i]}: {a}°</span>
            ))}
          </div>
        </div>

        {/* Classification controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1', minWidth: 260, maxWidth: 320 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              📏 Classify by Sides
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SIDE_LABELS.map(opt => {
                const isSelected = sidePick === opt;
                const isCorrect  = submitted && opt === card.sideCls;
                const isWrong    = submitted && isSelected && opt !== card.sideCls;
                return (
                  <button key={opt} onClick={() => !submitted && setSidePick(opt)} style={{
                    padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '2px solid',
                    fontWeight: 700, fontSize: '0.95rem', cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.25s', minWidth: 110,
                    borderColor: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : isSelected ? SIDE_COLORS[opt] : 'rgba(255,255,255,0.15)',
                    background: isCorrect ? 'rgba(16,185,129,0.2)' : isWrong ? 'rgba(239,68,68,0.2)' : isSelected ? `$SIDE_COLORS[opt]`22` : 'rgba(255,255,255,0.05)',
                    color: isCorrect ? 'var(--green-light)' : isWrong ? 'var(--red-light)' : isSelected ? SIDE_COLORS[opt] : 'var(--text-secondary)',
                    transform: isSelected && !submitted ? 'scale(1.04)' : 'scale(1)',
                  }}>
                    {isCorrect ? '✅ ' : isWrong ? '❌ ' : ''}{opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              📐 Classify by Angles
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ANGLE_LABELS.map(opt => {
                const isSelected = anglePick === opt;
                const isCorrect  = submitted && opt === card.angleCls;
                const isWrong    = submitted && isSelected && opt !== card.angleCls;
                return (
                  <button key={opt} onClick={() => !submitted && setAnglePick(opt)} style={{
                    padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '2px solid',
                    fontWeight: 700, fontSize: '0.95rem', cursor: submitted ? 'default' : 'pointer',
                    transition: 'all 0.25s', minWidth: 110,
                    borderColor: isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : isSelected ? ANGLE_COLORS[opt] : 'rgba(255,255,255,0.15)',
                    background: isCorrect ? 'rgba(16,185,129,0.2)' : isWrong ? 'rgba(239,68,68,0.2)' : isSelected ? `$ANGLE_COLORS[opt]`22` : 'rgba(255,255,255,0.05)',
                    color: isCorrect ? 'var(--green-light)' : isWrong ? 'var(--red-light)' : isSelected ? ANGLE_COLORS[opt] : 'var(--text-secondary)',
                    transform: isSelected && !submitted ? 'scale(1.04)' : 'scale(1)',
                  }}>
                    {isCorrect ? '✅ ' : isWrong ? '❌ ' : ''}{opt}
                  </button>
                );
              })}
            </div>
          </div>

          {submitted && (
            <div style={{
              padding: '16px 20px', borderRadius: 'var(--radius-md)', animation: 'fadeIn 0.3s ease',
              background: bothCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
              border: `1px solid `$bothCorrect ? 'var(--green)' : 'var(--amber)'``,
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: bothCorrect ? 'var(--green-light)' : 'var(--amber)', marginBottom: 6 }}>
                {bothCorrect ? '🎯 Perfect! Both correct!' : `📚 Answer: `$card.sideCls` + `$card.angleCls``}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {card.hint}
              </div>
            </div>
          )}

          {!submitted ? (
            <button className="btn btn-blue" onClick={handleSubmit} disabled={!sidePick || !anglePick} style={{ opacity: (!sidePick || !anglePick) ? 0.5 : 1 }}>
              ✅ Check My Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              {cardIdx >= CARD_SET.length - 1 ? '🧪 Next Station →' : `Next Card (`$cardIdx + 2`}/`$CARD_SET.length`) →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
"@ -replace '`\$', '$' -replace '`\$', '$' -replace '`\$', '$'

# It's better to just replace the blocks regex
$content = $content -replace '(?s)/\* ═══════════════ STATION 2.*?(?=/\* ═══════════════ STATION 3)', $newStation2

# And handleLockIn replace:
$oldHandleLockIn = @"
  const handleLockIn = useCallback(() => {
    if (!isMatch || collinear || locked) return;
    const idx = promptIdx % PROMPTS.length;
    if (!completed.includes(idx)) {
      setCompleted(c => [...c, idx]);
      playAudio('correct');
    }
    setLocked(true);
    setTimeout(() => { setLocked(false); setPromptIdx(i => i + 1); }, 1600);
  }, [isMatch, collinear, promptIdx, completed, locked]);
"@

$newHandleLockIn = @"
  const handleLockIn = useCallback(() => {
    if (!isMatch || collinear || locked) return;
    const idx = promptIdx % PROMPTS.length;
    if (!completed.includes(idx)) {
      setCompleted(c => [...c, idx]);
      playAudio('correct');
    }
    setLocked(true);
    setTimeout(() => { 
      setLocked(false); 
      setPromptIdx(i => i + 1); 
      // Force user to move points again for next prompt!
      setPts([
        { x: 190 + Math.random() * 40, y: 70 },
        { x: 110, y: 270 },
        { x: 310, y: 270 }
      ]);
    }, 1600);
  }, [isMatch, collinear, promptIdx, completed, locked]);
"@

$content = $content.Replace($oldHandleLockIn, $newHandleLockIn)

$content | Set-Content 'src\components\SimulatePhase.jsx'
Write-Host "Done"
