const fs = require('fs');
let content = fs.readFileSync('src/components/SimulatePhase.jsx', 'utf8');

const newStation2 = `
/* ═══════════════ STATION 2: Dual Triangle Builder ═══════════════ */
const DUAL_PROMPTS = [
  {
    title: "Equilateral vs Scalene",
    leftCheck: (s, a) => s.label === 'Equilateral',
    rightCheck: (s, a) => s.label === 'Scalene',
    leftTarget: "Equilateral",
    rightTarget: "Scalene",
  },
  {
    title: "Right vs Obtuse",
    leftCheck: (s, a) => a.label === 'Right',
    rightCheck: (s, a) => a.label === 'Obtuse',
    leftTarget: "Right Angle",
    rightTarget: "Obtuse Angle",
  },
  {
    title: "Isosceles vs Equilateral",
    leftCheck: (s, a) => s.label === 'Isosceles',
    rightCheck: (s, a) => s.label === 'Equilateral',
    leftTarget: "Isosceles (Not Equil)",
    rightTarget: "Equilateral",
  }
];

function InteractiveTriangle({ title, target, pts, setPts, checkFunc, onMatch }) {
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);

  const sides = [
    Math.round(dist(pts[0], pts[1])),
    Math.round(dist(pts[1], pts[2])),
    Math.round(dist(pts[2], pts[0])),
  ];
  const anglesArr = [
    angleDeg(pts[0], pts[1], pts[2]),
    angleDeg(pts[1], pts[2], pts[0]),
    angleDeg(pts[2], pts[0], pts[1]),
  ];
  
  const sideClass = classifySides(...sides);
  const angleClass = classifyAngles(anglesArr);
  const collinear = isCollinear(pts);
  const isMatch = !collinear && checkFunc(sideClass, angleClass);

  useEffect(() => {
    onMatch(isMatch);
  }, [isMatch, onMatch]);

  const getPos = (e, el) => {
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const sx = 260 / r.width, sy = 240 / r.height;
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
  };

  return (
    <div style={{ flex: '1', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ 
        padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700,
        background: isMatch ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
        color: isMatch ? 'var(--green-light)' : 'var(--text-muted)',
        border: \`1px solid \${isMatch ? 'var(--green)' : 'rgba(255,255,255,0.1)'}\`
      }}>
        Target: {target} {isMatch ? '✅' : ''}
      </div>

      <div 
        ref={canvasRef}
        style={{ width: '100%', height: 240, background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', position: 'relative', touchAction: 'none' }}
        onPointerDown={e => {
          const el = canvasRef.current; if(!el) return;
          const pos = getPos(e, el);
          const idx = pts.findIndex(p => dist(p, pos) < 25);
          if (idx >= 0) { setDragging(idx); e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); }
        }}
        onPointerMove={e => {
          if (dragging === null) return;
          const el = canvasRef.current; if(!el) return;
          const pos = getPos(e, el);
          setPts(p => p.map((pt, i) => i === dragging ? { x: Math.max(15, Math.min(245, pos.x)), y: Math.max(15, Math.min(225, pos.y)) } : pt));
          e.preventDefault();
        }}
        onPointerUp={e => { setDragging(null); e.currentTarget.releasePointerCapture(e.pointerId); }}
        onPointerCancel={() => setDragging(null)}
      >
        <svg viewBox="0 0 260 240" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
          <polygon points={pts.map(p => \`\${p.x},\${p.y}\`).join(' ')} fill={\`\${sideClass.color}15\`} stroke={sideClass.color} strokeWidth="3" strokeLinejoin="round" />
          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={14} fill={dragging === i ? 'var(--amber)' : sideClass.color} stroke="white" strokeWidth="2" />
              <text x={p.x} y={p.y+4} textAnchor="middle" fill="white" fontSize="10" fontWeight="900">{['A','B','C'][i]}</text>
            </g>
          ))}
        </svg>
      </div>
      
      <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>Sides: {sideClass.label}</span>
        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>Angles: {angleClass.label}</span>
      </div>
    </div>
  );
}

function Station2({ onNext }) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [ptsLeft, setPtsLeft] = useState([{ x: 130, y: 40 }, { x: 50, y: 190 }, { x: 210, y: 190 }]);
  const [ptsRight, setPtsRight] = useState([{ x: 130, y: 40 }, { x: 50, y: 190 }, { x: 210, y: 190 }]);
  
  const [leftMatch, setLeftMatch] = useState(false);
  const [rightMatch, setRightMatch] = useState(false);
  const [locked, setLocked] = useState(false);

  const round = DUAL_PROMPTS[roundIdx];
  const bothMatch = leftMatch && rightMatch;

  const handleLockIn = () => {
    if (!bothMatch || locked) return;
    setLocked(true);
    playAudio('correct');
    setTimeout(() => {
      setLocked(false);
      if (roundIdx >= DUAL_PROMPTS.length - 1) {
        onNext();
      } else {
        setRoundIdx(r => r + 1);
        setPtsLeft([{ x: 130 + Math.random()*20, y: 50 }, { x: 60, y: 180 }, { x: 200, y: 180 }]);
        setPtsRight([{ x: 130 + Math.random()*20, y: 50 }, { x: 60, y: 180 }, { x: 200, y: 180 }]);
      }
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <div className="station-header">
        <h2>⚖️ Station B — Dual Triangle Builder</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6 }}>
          Round {roundIdx + 1} of {DUAL_PROMPTS.length}: Build BOTH triangles to meet the targets simultaneously!
        </p>
      </div>

      <div style={{ 
        display: 'flex', gap: 32, width: '100%', maxWidth: 800, background: 'rgba(255,255,255,0.02)',
        padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap'
      }}>
        <InteractiveTriangle 
          title="Left Triangle" 
          target={round.leftTarget} 
          pts={ptsLeft} 
          setPts={setPtsLeft} 
          checkFunc={round.leftCheck}
          onMatch={setLeftMatch}
        />
        
        <div style={{ width: 2, background: 'rgba(255,255,255,0.1)', minHeight: 200, display: 'none', '@media (min-width: 600px)': { display: 'block' } }} />

        <InteractiveTriangle 
          title="Right Triangle" 
          target={round.rightTarget} 
          pts={ptsRight} 
          setPts={setPtsRight} 
          checkFunc={round.rightCheck}
          onMatch={setRightMatch}
        />
      </div>

      <button
        className={\`btn \${bothMatch ? 'btn-green' : 'btn-outline'}\`}
        onClick={handleLockIn}
        disabled={!bothMatch || locked}
        style={{ minWidth: 220 }}
      >
        {locked ? '🎉 Perfect Match!' : bothMatch ? '🔒 Lock Both In!' : '🔒 Match both goals first'}
      </button>

    </div>
  );
}
`;

content = content.replace(/\/\* ═══════════════ STATION 2:.*?(?=\/\* ═══════════════ STATION 3)/s, newStation2 + '\n\n');

fs.writeFileSync('src/components/SimulatePhase.jsx', content);
console.log('Fixed Station2 with Advanced Builder!');
