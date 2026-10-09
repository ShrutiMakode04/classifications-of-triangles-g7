import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { playAudio } from '../utils/audio';

/* ═══════════════ UTILITY: Triangle Geometry ═══════════════ */
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function angleDeg(A, B, C) {
  const ab = dist(A, B), ac = dist(A, C), bc = dist(B, C);
  const cos = (ab * ab + ac * ac - bc * bc) / (2 * ab * ac);
  return Math.round(Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI));
}
function classifySides(a, b, c) {
  const e = 1.5;
  if (Math.abs(a - b) < e && Math.abs(b - c) < e) return { label: 'Equilateral', color: '#2563eb' };
  if (Math.abs(a - b) < e || Math.abs(b - c) < e || Math.abs(a - c) < e) return { label: 'Isosceles', color: '#0891b2' };
  return { label: 'Scalene', color: '#8b5cf6' };
}
function classifyAngles(angles) {
  const max = Math.max(...angles);
  if (max > 91) return { label: 'Obtuse', color: '#f97316' };
  if (max >= 89 && max <= 91) return { label: 'Right', color: '#f59e0b' };
  return { label: 'Acute', color: '#10b981' };
}
function isCollinear(pts) {
  const [A, B, C] = pts;
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y));
  return area < 200;
}

/* ═══════════════ STATION 1: Triangle Architect ═══════════════ */
const PROMPTS = [
  {
    label: 'Make it Equilateral',
    desc: 'All 3 sides must be equal in length',
    tip: 'Drag vertices until all 3 sides show the same number!',
    check: (s) => s.label === 'Equilateral',
  },
  {
    label: 'Make it Right + Scalene',
    desc: 'One angle must be exactly 90° AND all 3 sides must be different',
    tip: 'Make one corner a perfect L-shape! The square icon appears when you nail 90°.',
    check: (s, a) => s.label === 'Scalene' && a.label === 'Right',
  },
  {
    label: 'Make it Obtuse',
    desc: 'One angle must be greater than 90°',
    tip: 'Flatten the triangle — push one vertex far to the side so one angle opens up wide!',
    check: (s, a) => a.label === 'Obtuse',
  },
  {
    label: 'Make it Isosceles (not Equilateral)',
    desc: 'Exactly 2 sides must be equal — the third must be different',
    tip: 'Think of a tent shape! Two legs are equal, the base is different.',
    check: (s, a) => s.label === 'Isosceles',
  },
];

function Station1({ onNext }) {
  useEffect(() => { playAudio("sim_1"); }, []);
  const canvasRef = useRef(null);
  const [pts, setPts] = useState([
    { x: 210, y: 70 }, { x: 90, y: 280 }, { x: 330, y: 280 },
  ]);
  const [dragging, setDragging] = useState(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [locked, setLocked] = useState(false);

  const sides = useMemo(() => [
    Math.round(dist(pts[0], pts[1])),
    Math.round(dist(pts[1], pts[2])),
    Math.round(dist(pts[2], pts[0])),
  ], [pts]);

  const angles = useMemo(() => [
    angleDeg(pts[0], pts[1], pts[2]),
    angleDeg(pts[1], pts[2], pts[0]),
    angleDeg(pts[2], pts[0], pts[1]),
  ], [pts]);

  const sideClass  = useMemo(() => classifySides(...sides), [sides]);
  const angleClass = useMemo(() => classifyAngles(angles), [angles]);
  const collinear  = useMemo(() => isCollinear(pts), [pts]);

  const prompt  = PROMPTS[promptIdx % PROMPTS.length];
  const isMatch = !collinear && prompt.check(sideClass, angleClass);
  const allDone = completed.length >= PROMPTS.length;

  /* ── pointer events ── */
  const getPos = (e, el) => {
    const r = el.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const sx = 420 / r.width, sy = 320 / r.height;
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy };
  };
  const onPointerDown = useCallback((e) => {
    const el = canvasRef.current; if (!el) return;
    const pos = getPos(e, el);
    const idx = pts.findIndex(p => dist(p, pos) < 30);
    if (idx >= 0) { setDragging(idx); e.preventDefault(); }
  }, [pts]);
  const onPointerMove = useCallback((e) => {
    if (dragging === null) return;
    const el = canvasRef.current; if (!el) return;
    const pos = getPos(e, el);
    setPts(p => p.map((pt, i) => i === dragging
      ? { x: Math.max(20, Math.min(400, pos.x)), y: Math.max(20, Math.min(300, pos.y)) }
      : pt));
    e.preventDefault();
  }, [dragging]);
  const onPointerUp = useCallback(() => setDragging(null), []);

  const handleLockIn = useCallback(() => {
    if (!isMatch || collinear || locked) return;
    const idx = promptIdx % PROMPTS.length;
    if (!completed.includes(idx)) {
      setCompleted(c => [...c, idx]);
      playAudio("very_good");
    }
    setLocked(true);
    setTimeout(() => { setLocked(false); setPromptIdx(i => i + 1); }, 1600);
  }, [isMatch, collinear, promptIdx, completed, locked]);

  /* ── helpers for SVG angle arc ── */
  const arcPath = (vertex, p1, p2, r = 22) => {
    const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    const x1 = vertex.x + r * Math.cos(a1), y1 = vertex.y + r * Math.sin(a1);
    const x2 = vertex.x + r * Math.cos(a2), y2 = vertex.y + r * Math.sin(a2);
    // determine sweep
    let diff = a2 - a1;
    if (diff < 0) diff += 2 * Math.PI;
    const sweep = diff < Math.PI ? 0 : 1;
    return `M ${x1} ${y1} A ${r} ${r} 0 0 ${1 - sweep} ${x2} ${y2}`;
  };

  /* ── side equality markers (tick marks) ── */
  const sideTickMarks = () => {
    if (collinear) return null;
    const pairs = [[0, 1], [1, 2], [2, 0]];
    const groups = {};
    sides.forEach((s, i) => {
      if (!groups[s]) groups[s] = [];
      groups[s].push(i);
    });
    return pairs.map(([a, b], i) => {
      const mid = { x: (pts[a].x + pts[b].x) / 2, y: (pts[a].y + pts[b].y) / 2 };
      const ang = Math.atan2(pts[b].y - pts[a].y, pts[b].x - pts[a].x) + Math.PI / 2;
      const sameGroup = Object.values(groups).find(g => g.includes(i) && g.length > 1);
      const ticks = sameGroup ? sameGroup.length : 1;
      const spacing = 5;
      return Array.from({ length: ticks }, (_, t) => {
        const offset = (t - (ticks - 1) / 2) * spacing;
        const dx = Math.cos(ang) * 7, dy = Math.sin(ang) * 7;
        const cx = mid.x + Math.cos(ang) * offset;
        const cy = mid.y + Math.sin(ang) * offset;
        return (
          <line key={`tick-${i}-${t}`}
            x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy}
            stroke={sideClass.color} strokeWidth="2.5" strokeLinecap="round" />
        );
      });
    });
  };

  /* ── live rule callout ── */
  const sideRules = !collinear && (() => {
    const e = 1.5;
    const ab = Math.abs(sides[0] - sides[1]) < e;
    const bc = Math.abs(sides[1] - sides[2]) < e;
    const ac = Math.abs(sides[0] - sides[2]) < e;
    if (ab && bc) return { text: `AB=${sides[0]} = BC=${sides[1]} = CA=${sides[2]} → all equal`, type: 'Equilateral', color: '#2563eb' };
    if (ab) return { text: `AB=${sides[0]} = BC=${sides[1]} (2 equal sides)`, type: 'Isosceles', color: '#0891b2' };
    if (bc) return { text: `BC=${sides[1]} = CA=${sides[2]} (2 equal sides)`, type: 'Isosceles', color: '#0891b2' };
    if (ac) return { text: `AB=${sides[0]} = CA=${sides[2]} (2 equal sides)`, type: 'Isosceles', color: '#0891b2' };
    return { text: `AB=${sides[0]}, BC=${sides[1]}, CA=${sides[2]} — all different`, type: 'Scalene', color: '#8b5cf6' };
  })();

  const angleRules = !collinear && (() => {
    const max = Math.max(...angles);
    const maxIdx = angles.indexOf(max);
    const name = ['A', 'B', 'C'][maxIdx];
    if (max > 91) return { text: `∠${name} = ${max}° > 90° → Obtuse`, color: '#f97316' };
    if (max >= 89 && max <= 91) return { text: `∠${name} = ${max}° = 90° → Right`, color: '#f59e0b' };
    return { text: `Largest angle ∠${name} = ${max}° < 90° → Acute`, color: '#10b981' };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div className="station-header">
        <h2>⚙️ Station A — Triangle Architect</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6 }}>
          Drag the <strong>coloured vertex handles (A, B, C)</strong> to reshape the triangle.
          Watch the live panel explain the classification in real time!
        </p>
      </div>

      {/* Challenge progress chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PROMPTS.map((p, i) => (
          <div key={i} style={{
            padding: '5px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800,
            border: '2px solid',
            borderColor: completed.includes(i) ? 'var(--green)' : i === promptIdx % PROMPTS.length ? 'var(--amber)' : 'rgba(255,255,255,0.15)',
            background: completed.includes(i) ? 'rgba(16,185,129,0.15)' : i === promptIdx % PROMPTS.length ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: completed.includes(i) ? 'var(--green-light)' : i === promptIdx % PROMPTS.length ? 'var(--amber)' : 'var(--text-muted)',
          }}>
            {completed.includes(i) ? '✅' : i === promptIdx % PROMPTS.length ? '🎯' : `${i + 1}`} {p.label}
          </div>
        ))}
      </div>

      {/* Current prompt banner */}
      {!allDone && (
        <div style={{
          background: isMatch ? 'rgba(16,185,129,0.2)' : 'rgba(37,99,235,0.12)',
          border: `2px solid ${isMatch ? 'var(--green)' : 'rgba(37,99,235,0.4)'}`,
          borderRadius: 'var(--radius-md)', padding: '14px 28px',
          textAlign: 'center', transition: 'all 0.3s', minWidth: 340, maxWidth: 600,
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Your Goal
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: isMatch ? 'var(--green-light)' : 'var(--amber)' }}>
            {isMatch ? '✅ ' : '🎯 '}{prompt.label}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
            📌 <em>{prompt.desc}</em>
          </div>
          {!isMatch && (
            <div style={{ fontSize: '0.82rem', color: 'var(--teal-light)', marginTop: 4, fontStyle: 'italic' }}>
              💡 {prompt.tip}
            </div>
          )}
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>

        {/* SVG Canvas */}
        <div style={{ flex: '1', minWidth: 300, maxWidth: 460, position: 'relative' }}>
          <svg
            ref={canvasRef}
            viewBox="0 0 420 320"
            style={{
              width: '100%', userSelect: 'none', touchAction: 'none',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
            }}
            onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp}
            onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
          >
            {/* Dot grid */}
            {Array.from({ length: 8 }, (_, r) => Array.from({ length: 11 }, (_, c) => (
              <circle key={`${r}-${c}`} cx={c * 42 + 8} cy={r * 42 + 8} r={1.5} fill="rgba(255,255,255,0.07)" />
            )))}

            {collinear ? (
              <text x="210" y="160" textAnchor="middle" fill="rgba(239,68,68,0.85)" fontSize="14" fontWeight="700">
                ⚠️ Points are in a line — spread them out to form a triangle!
              </text>
            ) : (
              <>
                {/* Filled triangle */}
                <polygon
                  points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={`${sideClass.color}18`}
                  stroke={sideClass.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Angle arcs */}
                {pts.map((p, i) => {
                  const p1 = pts[(i + 1) % 3], p2 = pts[(i + 2) % 3];
                  const isRight = angles[i] >= 89 && angles[i] <= 91;
                  const isObtuse = angles[i] > 91;
                  const arcColor = isObtuse ? '#f97316' : isRight ? '#f59e0b' : '#10b981';
                  if (isRight) {
                    // draw square corner marker
                    const v1 = { x: (p1.x - p.x), y: (p1.y - p.y) };
                    const v2 = { x: (p2.x - p.x), y: (p2.y - p.y) };
                    const l1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
                    const l2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
                    const sq = 16;
                    const u1 = { x: v1.x / l1 * sq, y: v1.y / l1 * sq };
                    const u2 = { x: v2.x / l2 * sq, y: v2.y / l2 * sq };
                    return (
                      <polygon key={`right-${i}`}
                        points={`${p.x + u1.x},${p.y + u1.y} ${p.x + u1.x + u2.x},${p.y + u1.y + u2.y} ${p.x + u2.x},${p.y + u2.y}`}
                        fill="none" stroke={arcColor} strokeWidth="2" />
                    );
                  }
                  return (
                    <path key={`arc-${i}`}
                      d={arcPath(p, p1, p2, isObtuse ? 26 : 22)}
                      fill={`${arcColor}25`}
                      stroke={arcColor}
                      strokeWidth="1.8"
                    />
                  );
                })}

                {/* Angle degree labels near each vertex */}
                {pts.map((p, i) => {
                  const isObtuse = angles[i] > 91;
                  const isRight = angles[i] >= 89 && angles[i] <= 91;
                  const col = isObtuse ? '#f97316' : isRight ? '#f59e0b' : '#10b981';
                  const cx = pts[(i + 1) % 3], cy2 = pts[(i + 2) % 3];
                  const avgX = (cx.x + cy2.x) / 2;
                  const push = { x: p.x + (p.x < avgX ? -24 : 24), y: p.y + (p.y < 160 ? -14 : 20) };
                  return (
                    <text key={`ang-label-${i}`} x={push.x} y={push.y}
                      textAnchor="middle" fill={col} fontSize="12" fontWeight="900"
                      style={{ pointerEvents: 'none' }}>
                      {angles[i]}°
                    </text>
                  );
                })}

                {/* Side length labels with equality ticks */}
                {[[0, 1], [1, 2], [2, 0]].map(([a, b], i) => {
                  const mid = { x: (pts[a].x + pts[b].x) / 2, y: (pts[a].y + pts[b].y) / 2 };
                  const off = -14;
                  const ang2 = Math.atan2(pts[b].y - pts[a].y, pts[b].x - pts[a].x);
                  const lx = mid.x + Math.cos(ang2 + Math.PI / 2) * off;
                  const ly = mid.y + Math.sin(ang2 + Math.PI / 2) * off;
                  return (
                    <text key={`side-${i}`} x={lx} y={ly}
                      textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontWeight="800"
                      style={{ pointerEvents: 'none' }}>
                      {sides[i]}
                    </text>
                  );
                })}

                {/* Equality tick marks on sides */}
                {sideTickMarks()}
              </>
            )}

            {/* Vertex handles */}
            {pts.map((p, i) => (
              <g key={i} style={{ cursor: dragging === i ? 'grabbing' : 'grab' }}
                onMouseDown={onPointerDown} onTouchStart={onPointerDown}>
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={13}
                  fill={dragging === i ? 'var(--amber)' : (collinear ? '#666' : sideClass.color)}
                  stroke="white" strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 10px ${collinear ? '#666' : sideClass.color})`, transition: 'fill 0.2s' }}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="900"
                  style={{ pointerEvents: 'none' }}>
                  {['A', 'B', 'C'][i]}
                </text>
              </g>
            ))}
          </svg>

          {/* Drag hint overlay */}
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            👆 Drag vertices A, B, or C to reshape the triangle
          </div>
        </div>

        {/* Understanding Panel */}
        <div style={{ flex: '0 0 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* By Sides section */}
          <div style={{
            background: `${sideClass.color}12`, border: `2px solid ${sideClass.color}55`,
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: sideClass.color, marginBottom: 8 }}>
              📏 Classification by Sides
            </div>
            {/* Side values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {['AB', 'BC', 'CA'].map((label, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>Side {label}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 'var(--radius-full)',
                    background: `${sideClass.color}25`, fontSize: '0.85rem', fontWeight: 900,
                    color: sideClass.color,
                  }}>{collinear ? '—' : sides[i]}</span>
                </div>
              ))}
            </div>
            {/* Rule explanation */}
            {sideRules && (
              <div style={{ fontSize: '0.8rem', color: sideClass.color, fontWeight: 700, lineHeight: 1.5, background: `${sideClass.color}15`, borderRadius: 6, padding: '6px 10px' }}>
                {sideRules.text}
              </div>
            )}
            {/* Badge */}
            <div style={{
              marginTop: 10, textAlign: 'center', padding: '8px', borderRadius: 'var(--radius-sm)',
              background: sideClass.color, color: 'white', fontWeight: 800, fontSize: '1rem',
              fontFamily: 'var(--font-display)',
            }}>
              {collinear ? '—' : sideClass.label}
            </div>
          </div>

          {/* By Angles section */}
          <div style={{
            background: `${angleClass.color}12`, border: `2px solid ${angleClass.color}55`,
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: angleClass.color, marginBottom: 8 }}>
              📐 Classification by Angles
            </div>
            {/* Angle values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {['A', 'B', 'C'].map((label, i) => {
                const a = collinear ? null : angles[i];
                const isMax = !collinear && a === Math.max(...angles);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: isMax ? angleClass.color : 'var(--text-muted)', fontWeight: isMax ? 800 : 700 }}>
                      ∠{label} {isMax ? '← max' : ''}
                    </span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem',
                      fontWeight: 900, background: isMax ? `${angleClass.color}30` : 'rgba(255,255,255,0.08)',
                      color: isMax ? angleClass.color : 'var(--text-secondary)',
                    }}>{a === null ? '—' : `${a}°`}</span>
                  </div>
                );
              })}
            </div>
            {/* Rule explanation */}
            {angleRules && (
              <div style={{ fontSize: '0.8rem', color: angleClass.color, fontWeight: 700, lineHeight: 1.5, background: `${angleClass.color}15`, borderRadius: 6, padding: '6px 10px' }}>
                {angleRules.text}
              </div>
            )}
            {/* Badge */}
            <div style={{
              marginTop: 10, textAlign: 'center', padding: '8px', borderRadius: 'var(--radius-sm)',
              background: angleClass.color, color: 'white', fontWeight: 800, fontSize: '1rem',
              fontFamily: 'var(--font-display)',
            }}>
              {collinear ? '—' : angleClass.label}
            </div>
          </div>

          {/* Angle sum check */}
          {!collinear && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)',
            }}>
              ∠A + ∠B + ∠C = <strong style={{ color: 'var(--green-light)' }}>{angles.reduce((s, a) => s + a, 0)}°</strong>
              {' '}(always 180°!)
            </div>
          )}
        </div>
      </div>

      {/* Lock + Next */}
      {!allDone ? (
        <button
          className={`btn ${isMatch && !collinear ? 'btn-green' : 'btn-outline'}`}
          onClick={handleLockIn}
          disabled={!isMatch || collinear || locked}
          style={{ minWidth: 220 }}
          id="station1-lock-btn"
        >
          {locked ? '🎉 Locked In!' : isMatch ? '🔒 Lock It In!' : '🔒 Match the goal first'}
        </button>
      ) : (
        <div style={{ animation: 'scaleIn 0.5s ease', textAlign: 'center' }}>
          <div style={{ color: 'var(--green-light)', fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>
            🏅 All 4 challenges complete!
          </div>
          <button className="btn btn-primary" onClick={onNext} id="station1-next-btn">
            Next Station →
          </button>
        </div>
      )}
    </div>
  );
}



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
        border: `1px solid ${isMatch ? 'var(--green)' : 'rgba(255,255,255,0.1)'}`
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
          <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={`${sideClass.color}15`} stroke={sideClass.color} strokeWidth="3" strokeLinejoin="round" />
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
  useEffect(() => { playAudio("sim_2"); }, []);
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
    playAudio("very_good");
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
        className={`btn ${bothMatch ? 'btn-green' : 'btn-outline'}`}
        onClick={handleLockIn}
        disabled={!bothMatch || locked}
        style={{ minWidth: 220 }}
      >
        {locked ? '🎉 Perfect Match!' : bothMatch ? '🔒 Lock Both In!' : '🔒 Match both goals first'}
      </button>

    </div>
  );
}


/* ═══════════════ STATION 3: Triangle Builder Lab ═══════════════ */
function Station3({ onNext }) {
  useEffect(() => { playAudio("sim_3"); }, []);
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
          background: 'rgba(0,0,0,0.25)', border: `2px solid ${valid ? 'var(--green)' : 'var(--red)'}44`,
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


/* ═══════════════ STATION 4: Free-Draw Triangle Builder ═══════════════ */
function Station4({ onNext }) {
  const svgRef = useRef(null);
  const [pts, setPts]         = useState([]);          // tapped/clicked points
  const [dragging, setDragging] = useState(null);
  const [challenges, setChallenges] = useState([
    { label: 'Draw ANY triangle', check: () => true, done: false, color: '#2563eb' },
    { label: 'Draw an Equilateral triangle', check: (s) => s === 'Equilateral', done: false, color: '#10b981' },
    { label: 'Draw a Right triangle', check: (_, a) => a === 'Right', done: false, color: '#f59e0b' },
    { label: 'Draw an Obtuse triangle', check: (_, a) => a === 'Obtuse', done: false, color: '#f97316' },
    { label: 'Draw an Isosceles + Acute triangle', check: (s, a) => s === 'Isosceles' && a === 'Acute', done: false, color: '#8b5cf6' },
  ]);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [locked, setLocked]   = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [totalDone, setTotalDone] = useState(0);

  const W = 440, H = 320;

  // Helper: get SVG coordinates
  const getSVGPos = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: Math.round(Math.max(10, Math.min(W - 10, (touch.clientX - rect.left) * scaleX))),
      y: Math.round(Math.max(10, Math.min(H - 10, (touch.clientY - rect.top)  * scaleY))),
    };
  }, []);

  // Click/tap to add point (up to 3)
  const handleSVGClick = useCallback((e) => {
    if (locked || dragging !== null) return;
    if (pts.length >= 3) return;
    const pos = getSVGPos(e);
    setPts(prev => [...prev, pos]);
  }, [pts.length, locked, dragging, getSVGPos]);

  // Drag existing points
  const handlePointerDown = useCallback((e, idx) => {
    e.stopPropagation();
    setDragging(idx);
    e.preventDefault();
  }, []);
  const handlePointerMove = useCallback((e) => {
    if (dragging === null) return;
    const pos = getSVGPos(e);
    setPts(prev => prev.map((p, i) => i === dragging ? pos : p));
    e.preventDefault();
  }, [dragging, getSVGPos]);
  const handlePointerUp = useCallback(() => setDragging(null), []);

  // Live classification
  const sides = useMemo(() => {
    if (pts.length < 3) return null;
    return [
      Math.round(dist(pts[0], pts[1])),
      Math.round(dist(pts[1], pts[2])),
      Math.round(dist(pts[2], pts[0])),
    ];
  }, [pts]);

  const angles = useMemo(() => {
    if (pts.length < 3 || isCollinear(pts)) return null;
    return [
      angleDeg(pts[0], pts[1], pts[2]),
      angleDeg(pts[1], pts[2], pts[0]),
      angleDeg(pts[2], pts[0], pts[1]),
    ];
  }, [pts]);

  const sideClass  = sides && !isCollinear(pts)  ? classifySides(...sides).label  : null;
  const angleClass = angles ? classifyAngles(angles).label : null;
  const sideColor  = sides && !isCollinear(pts)  ? classifySides(...sides).color  : '#fff';

  const chal = challenges[challengeIdx];
  const isMatch = pts.length === 3 && !isCollinear(pts) && chal.check(sideClass, angleClass);

  // Lock in this triangle
  const handleLock = () => {
    if (!isMatch || locked) return;
    setLocked(true);
    playAudio("very_good");
    const updated = challenges.map((c, i) => i === challengeIdx ? { ...c, done: true } : c);
    setChallenges(updated);
    setTotalDone(t => t + 1);
    setFeedback({ success: true, side: sideClass, angle: angleClass });
  };

  const handleNext = () => {
    if (challengeIdx >= challenges.length - 1) {
      onNext();
    } else {
      setChallengeIdx(i => i + 1);
      setPts([]);
      setLocked(false);
      setFeedback(null);
    }
  };

  const handleReset = () => {
    setPts([]);
    setLocked(false);
    setFeedback(null);
  };

  // Grid dots
  const gridDots = useMemo(() => {
    const dots = [];
    for (let r = 0; r <= 7; r++) for (let c = 0; c <= 10; c++)
      dots.push({ x: c * (W / 10), y: r * (H / 7) });
    return dots;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div className="station-header">
        <h2>✏️ Station D — Triangle Builder</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 6 }}>
          <strong>Tap three dots</strong> on the grid to place triangle vertices. Drag to adjust. Get classified instantly!
        </p>
      </div>

      {/* Challenge cards */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {challenges.map((c, i) => (
          <div key={i} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-md)', border: `2px solid`,
            borderColor: c.done ? 'var(--green)' : i === challengeIdx ? c.color : 'rgba(255,255,255,0.12)',
            background: c.done ? 'rgba(16,185,129,0.15)' : i === challengeIdx ? `${c.color}22` : 'rgba(255,255,255,0.04)',
            fontSize: '0.78rem', fontWeight: 800, transition: 'all 0.25s',
            color: c.done ? 'var(--green-light)' : i === challengeIdx ? c.color : 'var(--text-muted)',
          }}>
            {c.done ? '✅' : i === challengeIdx ? '🎯' : `${i + 1}`} {c.label}
          </div>
        ))}
      </div>

      {/* Current challenge banner */}
      <div style={{
        background: isMatch ? 'rgba(16,185,129,0.2)' : `${chal.color}18`,
        border: `2px solid ${isMatch ? 'var(--green)' : chal.color}`,
        borderRadius: 'var(--radius-md)', padding: '12px 24px', textAlign: 'center', minWidth: 320,
        animation: locked ? 'correctBounce 0.5s ease' : 'none', transition: 'all 0.3s',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Current Challenge
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: isMatch ? 'var(--green-light)' : chal.color, marginTop: 2 }}>
          {isMatch ? '✅ Perfect match! Lock it in!' : `🎯 ${chal.label}`}
        </div>
        {pts.length < 3 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Tap {3 - pts.length} more point{pts.length === 2 ? '' : 's'} on the canvas
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {/* SVG Canvas */}
        <div style={{ position: 'relative', flex: '1 1 400px', maxWidth: 500 }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)',
              cursor: pts.length < 3 && !locked ? 'crosshair' : 'default',
              userSelect: 'none', touchAction: 'none',
            }}
            onClick={handleSVGClick}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {/* Grid dots */}
            {gridDots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={2} fill="rgba(255,255,255,0.1)" />
            ))}

            {/* Triangle fill + edges */}
            {pts.length === 3 && !isCollinear(pts) && (
              <>
                <polygon
                  points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={`${sideColor}18`}
                  stroke={sideColor}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Side length labels */}
                {[[0,1],[1,2],[2,0]].map(([a, b], i) => {
                  const mid = { x: (pts[a].x + pts[b].x) / 2, y: (pts[a].y + pts[b].y) / 2 };
                  return (
                    <text key={i} x={mid.x} y={mid.y - 8} textAnchor="middle"
                      fill="rgba(255,255,255,0.7)" fontSize="12" fontWeight="700">
                      {sides[i]}
                    </text>
                  );
                })}
                {/* Angle labels */}
                {angles && pts.map((p, i) => (
                  <text key={i}
                    x={p.x + (p.x < W / 2 ? -18 : 6)}
                    y={p.y + (p.y < H / 2 ? -8 : 20)}
                    fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="700">
                    {angles[i]}°
                  </text>
                ))}
              </>
            )}

            {/* In-progress lines */}
            {pts.length === 2 && (
              <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y}
                stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="6 3" />
            )}

            {/* Vertex handles */}
            {pts.map((p, i) => (
              <g key={i}
                onMouseDown={(e) => handlePointerDown(e, i)}
                onTouchStart={(e) => handlePointerDown(e, i)}
                style={{ cursor: 'grab' }}
              >
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={12}
                  fill={dragging === i ? 'var(--amber)' : (sideColor || '#2563eb')}
                  stroke="white" strokeWidth="2.5"
                  style={{ filter: `drop-shadow(0 0 8px ${sideColor || '#2563eb'})` }}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fill="white" fontSize="10" fontWeight="900" style={{ pointerEvents: 'none' }}>
                  {['A','B','C'][i]}
                </text>
              </g>
            ))}

            {/* Instruction when empty */}
            {pts.length === 0 && (
              <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="16" fontWeight="700">
                Tap to place 3 points →
              </text>
            )}
          </svg>
        </div>

        {/* Live Readout Panel */}
        <div className="live-stats-panel" style={{ flex: '0 0 200px', minWidth: 180 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Live Readout
          </div>
          {pts.length < 3 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Place all 3 vertices to see classification...
            </div>
          ) : isCollinear(pts) ? (
            <div style={{ color: 'var(--red-light)', fontSize: '0.85rem', fontWeight: 700 }}>
              ⚠️ Points are collinear — not a triangle! Move a point.
            </div>
          ) : (
            <>
              {sides.map((s, i) => (
                <div className="stat-row" key={i}>
                  <span className="stat-label">Side {['AB','BC','CA'][i]}</span>
                  <span className="stat-value">{s}</span>
                </div>
              ))}
              {angles && angles.map((a, i) => (
                <div className="stat-row" key={i}>
                  <span className="stat-label">∠{['A','B','C'][i]}</span>
                  <span className="stat-value">{a}°</span>
                </div>
              ))}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="triangle-badge" style={{ background: `${sideColor}22`, border: `1.5px solid ${sideColor}`, color: sideColor }}>
                  {sideClass}
                </div>
                {angleClass && (
                  <div className="triangle-badge" style={{ background: `${classifyAngles(angles).color}22`, border: `1.5px solid ${classifyAngles(angles).color}`, color: classifyAngles(angles).color }}>
                    {angleClass}
                  </div>
                )}
              </div>
            </>
          )}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={handleReset}
              style={{ fontSize: '0.8rem' }}
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* Lock in / Next buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!locked ? (
          <button
            className={`btn ${isMatch ? 'btn-green' : 'btn-outline'}`}
            onClick={handleLock}
            disabled={!isMatch}
            id="builder-lock-btn"
          >
            {isMatch ? '🔒 Lock It In!' : '🔒 Match the challenge first'}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleNext} id="builder-next-btn">
            {challengeIdx >= challenges.length - 1 ? '🎮 Go to Practice →' : `Next Challenge (${challengeIdx + 2}/${challenges.length}) →`}
          </button>
        )}
      </div>

      {/* Feedback box */}
      {feedback && (
        <div style={{
          animation: 'scaleIn 0.4s ease', textAlign: 'center', maxWidth: 480,
          background: 'rgba(16,185,129,0.15)', border: '1px solid var(--green)',
          borderRadius: 'var(--radius-md)', padding: '16px 24px',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--green-light)', marginBottom: 4 }}>
            {feedback.side} + {feedback.angle} Triangle!
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Great job! {totalDone}/{challenges.length} challenges complete.
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ SIMULATE PHASE CONTAINER ═══════════════ */
const STATIONS = [
  { id: 0, title: 'Triangle Architect', subtitle: 'Drag & classify live', icon: '⚙️' },
  { id: 1, title: 'Card Match',         subtitle: 'Identify triangle types', icon: '🗂️' },
  { id: 2, title: 'Inequality & Angles',subtitle: 'Predict & prove',        icon: '🧪' },
  { id: 3, title: 'Triangle Builder',   subtitle: 'Draw your own triangles', icon: '✏️' },
];

export default function SimulatePhase({ onComplete }) {
  const [activeStation, setActiveStation] = useState(0);
  const [completed, setCompleted] = useState([]);

  const markComplete = useCallback((stationId) => {
    setCompleted(c => c.includes(stationId) ? c : [...c, stationId]);
    if (stationId < STATIONS.length - 1) {
      setActiveStation(stationId + 1);
    } else {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="simulate-screen">
      <h1 className="simulate-title">
        <span style={{ color: 'var(--teal-light)' }}>🔬</span> Simulation Lab
      </h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20, maxWidth: 600 }}>
        Complete all 4 stations to earn your Triangle Architect badge! Each station deepens your understanding.
      </p>

      {/* Station nav */}
      <div className="stations-nav">
        {STATIONS.map(s => (
          <button
            key={s.id}
            className={`station-nav-btn ${activeStation === s.id ? 'active' : ''} ${completed.includes(s.id) ? 'completed' : ''}`}
            onClick={() => setActiveStation(s.id)}
            id={`station-nav-${s.id}`}
          >
            {completed.includes(s.id) ? '✅' : s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Station body */}
      <div className="station-body glass-card" style={{ padding: '28px' }}>
        {activeStation === 0 && <Station1 onNext={() => markComplete(0)} />}
        {activeStation === 1 && <Station2 onNext={() => markComplete(1)} />}
        {activeStation === 2 && <Station3 onNext={() => markComplete(2)} />}
        {activeStation === 3 && <Station4 onNext={() => markComplete(3)} />}
      </div>
    </div>
  );
}

