/**
 * Generates MOBILE/assets/lottie/celebrate.json: falling confetti built from
 * the same primitives the working minimal test animation used (rect fills
 * inside groups, transform keyframes), so compatibility with this build of
 * lottie-react-native is guaranteed. Deterministic output via a seeded PRNG.
 *
 * Run: node scripts/generate-celebration.js
 */
const fs = require('fs');
const path = require('path');

// Seeded PRNG so every run produces the identical file
let seed = 20260826;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function randInt(min, max) {
  return Math.floor(min + rand() * (max - min + 1));
}

const FR = 30;
const OP = 90; // 3 seconds

// amber-400, green-400, blue-400, red-400, purple-400, pink-400, yellow-300
const PALETTE = [
  [0.984, 0.749, 0.141],
  [0.29, 0.87, 0.499],
  [0.376, 0.647, 0.98],
  [0.973, 0.436, 0.443],
  [0.753, 0.518, 0.988],
  [0.957, 0.447, 0.714],
  [0.99, 0.905, 0.28],
];

const PIECES = 40;
const layers = [];

for (let i = 0; i < PIECES; i++) {
  const color = PALETTE[i % PALETTE.length];
  const w = randInt(12, 22);
  const h = randInt(18, 32);
  const startX = randInt(-40, 440);
  const startY = randInt(-160, -40);
  const endY = randInt(880, 1040);
  // Slight horizontal drift as it falls
  const driftX = randInt(-80, 80);
  const startFrame = i < 24 ? 0 : randInt(0, 24);
  const spin = (rand() > 0.5 ? 1 : -1) * randInt(180, 540);

  layers.push({
    ddd: 0,
    ind: i + 1,
    ty: 4,
    nm: `piece-${i}`,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: {
        a: 1,
        k: [
          { t: 0, s: [randInt(0, 90)] },
          { t: OP, s: [spin] },
        ],
      },
      p: {
        a: 1,
        k: [
          { t: 0, s: [startX, startY] },
          { t: OP, s: [startX + driftX, endY] },
        ],
      },
      a: { a: 0, k: [0, 0] },
      s: { a: 0, k: [100, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: 'gr',
        nm: `group-${i}`,
        it: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [w, h] },
            p: { a: 0, k: [0, 0] },
            r: { a: 0, k: 2 },
          },
          {
            ty: 'fl',
            c: { a: 0, k: [...color, 1] },
            o: { a: 0, k: 100 },
          },
          {
            ty: 'tr',
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: startFrame,
    op: OP,
    st: 0,
  });
}

const animation = {
  v: '5.7.4',
  fr: FR,
  ip: 0,
  op: OP,
  w: 400,
  h: 860,
  nm: 'celebrate',
  ddd: 0,
  assets: [],
  layers,
};

const out = path.join(
  __dirname,
  '..',
  'MOBILE',
  'assets',
  'lottie',
  'celebrate.json'
);
fs.writeFileSync(out, JSON.stringify(animation));
console.log(
  `wrote ${out}: ${layers.length} layers, ${(OP / FR).toFixed(1)}s`
);
