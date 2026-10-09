const fs = require('fs');
let content = fs.readFileSync('src/components/SimulatePhase.jsx', 'utf8');

const oldCode = `function classifySides(a, b, c) {
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
}`;

const newCode = `function classifySides(a, b, c) {
  const e = 4.5;
  if (Math.abs(a - b) <= e && Math.abs(b - c) <= e && Math.abs(a - c) <= e) return { label: 'Equilateral', color: '#2563eb' };
  if (Math.abs(a - b) <= e || Math.abs(b - c) <= e || Math.abs(a - c) <= e) return { label: 'Isosceles', color: '#0891b2' };
  return { label: 'Scalene', color: '#8b5cf6' };
}
function classifyAngles(angles) {
  const max = Math.max(...angles);
  if (max > 92) return { label: 'Obtuse', color: '#f97316' };
  if (max >= 88 && max <= 92) return { label: 'Right', color: '#f59e0b' };
  return { label: 'Acute', color: '#10b981' };
}`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/components/SimulatePhase.jsx', content);
console.log('Done!');
