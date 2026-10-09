const fs = require('fs');
let content = fs.readFileSync('src/components/SimulatePhase.jsx', 'utf8');

const newStation3 = `
/* ═══════════════ STATION 3: Triangle Builder Lab ═══════════════ */
function Station3({ onNext }) {
  const [a, setA] = useState(8);
  const [b, setB] = useState(6);
  const [c, setC] = useState(10);

  // Check inequality
  const valid = a + b > c && a + c > b && b + c > a;

  // Math for drawing
  const scale = 16; // px per unit
  const ptA = { x: 70, y: 190 };
  const ptB = { x: 70 + a * scale, y: 190 };
  
  let ptC_left, ptC_right;
  let gap = false;

  if (valid) {
    // Law of cosines to find coordinates
    const x = (a*a + b*b - c*c) / (2*a);
    const y = Math.sqrt(b*b - x*x);
    ptC_left = { x: ptA.x + x * scale, y: ptA.y - y * scale };
    ptC_right = ptC_left; 
  } else {
    // If not valid, angle them slightly so they don't fully overlap
    gap = true;
    const ang = Math.PI / 8; // 22.5 degrees
    ptC_left = { x: ptA.x + b * scale * Math.cos(ang), y: ptA.y - b * scale * Math.sin(ang) };
    ptC_right = { x: ptB.x - c * scale * Math.cos(ang), y: ptB.y - c * scale * Math.sin(ang) };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
      <div className="station-header">
        <h2>📏 Station C — Triangle Builder Lab</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6, maxWidth: 600, textAlign: 'center' }}>
          Use the sliders to cut sticks of different lengths. Can you figure out the rule for when they successfully close to form a triangle?
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Sliders */}
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '24px', borderRadius: 'var(--radius-lg)', flex: '1', minWidth: 280, maxWidth: 350, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f97316', fontWeight: 800 }}>
              <span>Base Stick (a)</span><span>{a}</span>
            </div>
            <input type="range" min="2" max="18" value={a} onChange={e => setA(Number(e.target.value))} style={{ accentColor: '#f97316', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b5cf6', fontWeight: 800 }}>
              <span>Left Stick (b)</span><span>{b}</span>
            </div>
            <input type="range" min="2" max="18" value={b} onChange={e => setB(Number(e.target.value))} style={{ accentColor: '#8b5cf6', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 800 }}>
              <span>Right Stick (c)</span><span>{c}</span>
            </div>
            <input type="range" min="2" max="18" value={c} onChange={e => setC(Number(e.target.value))} style={{ accentColor: '#10b981', cursor: 'pointer' }} />
          </div>

          <div style={{ marginTop: 10, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase' }}>Triangle Inequality Check</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: a + b > c ? 'var(--green-light)' : 'var(--red-light)' }}>
                <span>a + b = {a+b}</span>
                <span>{a+b > c ? '>' : '≤'} {c} {a+b > c ? '✅' : '❌'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: a + c > b ? 'var(--green-light)' : 'var(--red-light)' }}>
                <span>a + c = {a+c}</span>
                <span>{a+c > b ? '>' : '≤'} {b} {a+c > b ? '✅' : '❌'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: b + c > a ? 'var(--green-light)' : 'var(--red-light)' }}>
                <span>b + c = {b+c}</span>
                <span>{b+c > a ? '>' : '≤'} {a} {b+c > a ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ 
          background: 'rgba(0,0,0,0.25)', border: \`2px solid \${valid ? 'var(--green)' : 'var(--red)'}44\`,
          padding: '20px', borderRadius: 'var(--radius-lg)', flex: '1', minWidth: 320, 
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{ 
            padding: '6px 16px', borderRadius: 20, fontWeight: 800, marginBottom: 12,
            background: valid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: valid ? 'var(--green-light)' : 'var(--red-light)',
            transition: 'all 0.3s'
          }}>
            {valid ? '🎉 Perfect! Triangle Closed' : '💥 Gap! The sides cannot close'}
          </div>

          <svg viewBox="0 0 420 240" style={{ width: '100%', maxWidth: 420, overflow: 'visible' }}>
            {/* Base */}
            <line x1={ptA.x} y1={ptA.y} x2={ptB.x} y2={ptB.y} stroke="#f97316" strokeWidth="10" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
            
            {/* Left */}
            <line x1={ptA.x} y1={ptA.y} x2={ptC_left.x} y2={ptC_left.y} stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
            
            {/* Right */}
            <line x1={ptB.x} y1={ptB.y} x2={ptC_right.x} y2={ptC_right.y} stroke="#10b981" strokeWidth="10" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />

            {/* Gap indicator if not valid */}
            {gap && (
              <line x1={ptC_left.x} y1={ptC_left.y} x2={ptC_right.x} y2={ptC_right.y} stroke="rgba(239,68,68,0.8)" strokeWidth="4" strokeDasharray="6 4" />
            )}

            {/* Labels */}
            <text x={ptA.x + (ptB.x - ptA.x)/2} y={ptA.y + 24} textAnchor="middle" fill="#f97316" fontWeight="800">a = {a}</text>
            <text x={ptA.x + (ptC_left.x - ptA.x)/2 - 16} y={ptA.y + (ptC_left.y - ptA.y)/2} fill="#8b5cf6" fontWeight="800">b = {b}</text>
            <text x={ptB.x + (ptC_right.x - ptB.x)/2 + 8} y={ptB.y + (ptC_right.y - ptB.y)/2} fill="#10b981" fontWeight="800">c = {c}</text>
          </svg>
        </div>
      </div>

      <button className="btn btn-primary" onClick={onNext} style={{ marginTop: 10, minWidth: 200 }} id="station3-next-btn">
        Next Station →
      </button>

    </div>
  );
}
`;

// Now replace from /* ═══════════════ STATION 3: Inequality & Angle Lab ═══════════════ */ to /* ═══════════════ STATION 4
content = content.replace(/\/\* ═══════════════ STATION 3:.*?(?=\/\* ═══════════════ STATION 4)/s, newStation3 + '\n\n');

fs.writeFileSync('src/components/SimulatePhase.jsx', content);
console.log('Fixed Station3!');
