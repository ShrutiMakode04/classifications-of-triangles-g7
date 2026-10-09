import { useEffect, useState } from 'react';

const TRIANGLES = [
  { type: 'equilateral', pts: '50,10 90,80 10,80', color: '#2563eb' },
  { type: 'isosceles', pts: '50,8 82,80 18,80', color: '#0891b2' },
  { type: 'scalene', pts: '15,78 70,78 85,15', color: '#8b5cf6' },
  { type: 'right', pts: '10,80 80,80 10,15', color: '#f59e0b' },
  { type: 'obtuse', pts: '0,70 95,70 20,10', color: '#10b981' },
  { type: 'acute', pts: '50,5 88,85 12,85', color: '#f97316' },
];

export default function FloatingTriangles() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const arr = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      tri: TRIANGLES[i % TRIANGLES.length],
      x: Math.random() * 100,
      delay: Math.random() * 18,
      duration: 18 + Math.random() * 14,
      size: 50 + Math.random() * 70,
    }));
    setItems(arr);
  }, []);

  return (
    <div className="floating-triangles">
      {items.map(item => (
        <div
          key={item.id}
          className="floating-triangle"
          style={{
            left: `${item.x}%`,
            bottom: '-100px',
            width: item.size,
            height: item.size,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          <svg viewBox="0 0 100 90" width={item.size} height={item.size}>
            <polygon points={item.tri.pts} fill={item.tri.color} />
          </svg>
        </div>
      ))}
    </div>
  );
}
