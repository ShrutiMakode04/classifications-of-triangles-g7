const https = require('https');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.VITE_ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("API Key not found!");
  process.exit(1);
}

const voiceId = "Xb7hH8MSUJpSbSDYk0k2"; // Alice
const audioDir = path.join(__dirname, 'public', 'audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const linesToGenerate = [
  { id: 'welcome', text: "Welcome to the junior engineers club! Today we will learn about the classifications of triangles and how they help build strong structures." },
  { id: 'wonder', text: "Three bridge trusses collapsed in testing. Three held. Same wood, same glue — the ONLY difference was the triangle. Can you spot the pattern? The Secret is in the triangle! Not all triangles are equal. The strong trusses used equilateral triangles — all sides and angles equal, distributing force perfectly. Let's learn to classify every triangle like a junior engineer!" },
  { id: 'story_0', text: "John, Mike, and Sarah were thrilled — their school just entered the Global Bridge Challenge! Their mission: build a craft-stick bridge strong enough to hold 500g. Their first truss wobbled dangerously. 'Something is wrong with these triangles,' said Mike, pressing on the shaky structure." },
  { id: 'story_1', text: "Mike pointed at the whiteboard. 'Look — some triangles look pointy, some are super wide, and some look... perfectly balanced.' Sarah grabbed a ruler. 'There has to be a SYSTEM for this!' John's eyes lit up: 'What if we can classify every triangle by its sides AND angles?'" },
  { id: 'story_2', text: "LearnFlow, their AI companion, projected three triangles on the wall. 'Meet the side-based family! An equilateral triangle has all 3 sides equal — like a perfect snowflake. Isosceles has exactly 2 equal sides — like a tent. Scalene has all 3 sides different — totally unique.' Sarah quickly labeled each one on her model." },
  { id: 'story_3', text: "Suddenly, a video call! Yuki from their Kyoto partner school was on screen. 'We classify by ANGLES too!' she said. 'Acute triangles have all angles under 90 degrees — sharp and strong. Right triangles have exactly one 90 degree corner — perfect for corners. Obtuse triangles have one angle over 90 degrees — wide and flat.'" },
  { id: 'story_4', text: "Sarah grabbed a paper triangle and tore off all three corners. She placed them side by side along a ruler. 'Look!' she gasped — they made a perfect straight line! John's calculator confirmed: 60 plus 60 plus 60 equals 180. Tried again with a scalene: 37 plus 83 plus 60 equals 180. Always 180! 'This changes everything for our bridge!' Mike shouted." },
  { id: 'sim_1', text: "Station A. Drag the vertices to match the target triangle." },
  { id: 'sim_2', text: "Station B. Build both triangles to meet the targets simultaneously!" },
  { id: 'sim_3', text: "Station C. Use the sliders to cut sticks of different lengths. Can you figure out the rule for when they successfully close to form a triangle?" },
  { id: 'very_good', text: "Very good!" },
  { id: 'incorrect', text: "Incorrect." },
  { id: 'practice_intro', text: "Let's test what you've learned. Match the correct classification to the triangle." },
  { id: 'reflect_0', text: "What does 'Isosceles' mean in terms of triangle sides?" },
  { id: 'reflect_1', text: "The interior angles of any triangle always sum to what?" },
  { id: 'reflect_2', text: "Which of these CAN form a valid triangle?" },
  { id: 'reflect_3', text: "Every equilateral triangle is secretly also what?" }
];

async function generateAudio(item) {
  const filePath = path.join(audioDir, `${item.id}.mp3`);
  if (fs.existsSync(filePath)) {
    console.log(`Skipping ${item.id}.mp3, already exists.`);
    return;
  }

  const postData = JSON.stringify({
    text: item.text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    port: 443,
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Error for ${item.id}: Status Code ${res.statusCode}`);
        res.on('data', d => process.stdout.write(d));
        resolve(); // Continue even if one fails
        return;
      }
      const file = fs.createWriteStream(filePath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Generated ${item.id}.mp3`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Error for ${item.id}: ${e.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  for (const item of linesToGenerate) {
    await generateAudio(item);
    // Add small delay to avoid rate limit issues
    await new Promise(r => setTimeout(r, 500)); 
  }
  console.log("All audio generation complete!");
}

run();
