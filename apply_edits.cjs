const fs = require('fs');

// 1. WonderPhase.jsx
let wonder = fs.readFileSync('src/components/WonderPhase.jsx', 'utf8');
wonder = wonder.replace(/const \[revealed, setRevealed\] = useState\(false\);/, '');
wonder = wonder.replace(/\{stage >= 3 && !revealed.*?<\/div>\s*\)}/s, '');
wonder = wonder.replace(/\{revealed && \(/, '{stage >= 3 && (');
fs.writeFileSync('src/components/WonderPhase.jsx', wonder);

// 2. StoryPhase.jsx
let story = fs.readFileSync('src/components/StoryPhase.jsx', 'utf8');
story = story.replace(/playAudio\('story'\)/, 'playAudio(`story_${slideIdx}`)');
story = story.replace(/<img src=\{slide\.image\} alt="Slide" style=\{\{.*?\}\} \/>/s, 
  `<img src={slide.image} alt="Slide" style={{ width: '100%', maxHeight: '45vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />`
);
fs.writeFileSync('src/components/StoryPhase.jsx', story);

// 3. SimulatePhase.jsx
let sim = fs.readFileSync('src/components/SimulatePhase.jsx', 'utf8');
sim = sim.replace(/function Station1\(\{ onNext \}\) \{/, 'function Station1({ onNext }) {\n  useEffect(() => { playAudio("sim_1"); }, []);');
sim = sim.replace(/playAudio\('correct'\)/g, 'playAudio("very_good")');
sim = sim.replace(/playAudio\('wrong'\)/g, 'playAudio("incorrect")');
sim = sim.replace(/function Station2\(\{ onNext \}\) \{/, 'function Station2({ onNext }) {\n  useEffect(() => { playAudio("sim_2"); }, []);');
sim = sim.replace(/function Station3\(\{ onNext \}\) \{/, 'function Station3({ onNext }) {\n  useEffect(() => { playAudio("sim_3"); }, []);');
fs.writeFileSync('src/components/SimulatePhase.jsx', sim);

// 4. PracticePhase.jsx
let play = fs.readFileSync('src/components/PlayPhase.jsx', 'utf8');
play = play.replace(/Play Phase/g, 'Practice Phase');
play = play.replace(/Let's Play!/g, "Let's Practice!");
play = play.replace(/playAudio\('correct'\)/g, 'playAudio("very_good")');
play = play.replace(/playAudio\('wrong'\)/g, 'playAudio("incorrect")');
play = play.replace(/const handleStart = \(\) => \{/, 'const handleStart = () => { playAudio("practice_intro"); ');
fs.writeFileSync('src/components/PlayPhase.jsx', play);

// 5. ReflectPhase.jsx
let reflect = fs.readFileSync('src/components/ReflectPhase.jsx', 'utf8');
reflect = reflect.replace(/const \[qIdx, setQIdx\] = useState\(0\);/, 'const [qIdx, setQIdx] = useState(0);\n  useEffect(() => { playAudio(`reflect_${qIdx}`); }, [qIdx]);');
reflect = reflect.replace(/playAudio\('correct'\)/g, 'playAudio("very_good")');
reflect = reflect.replace(/playAudio\('wrong'\)/g, 'playAudio("incorrect")');
fs.writeFileSync('src/components/ReflectPhase.jsx', reflect);

console.log("Applied all edits!");
