import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = 'C:/Users/user/OneDrive/Desktop/AIM3 LAB';
const generated = 'C:/Users/user/.codex/generated_images/01a0669c-0b26-7f60-8085-7499009f1f8a';
const output = path.join(root, 'expo-assets');
await mkdir(output, { recursive: true });

const sources = {
  tall: path.join(generated, 'exec-2fd49897-5409-4d3d-a8b1-837ea126250d.png'),
  hero: path.join(generated, 'exec-7d4e6d7d-7703-414c-9a97-5a62eb1a55be.png'),
  vr: path.join(generated, 'exec-d9e3a97e-adc3-4d11-9b2b-726d82db2399.png'),
  panorama: path.join(generated, 'exec-960eae34-d4c4-4ec3-813d-d171f7ae0f14.png'),
};

const font = `'Malgun Gothic', 'Noto Sans CJK KR', sans-serif`;

function svg(width, height, content) {
  return Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .text { font-family: ${font}; letter-spacing: 0; }
      .heavy { font-weight: 900; }
      .bold { font-weight: 700; }
    </style>
    ${content}
  </svg>`);
}

async function render({ source, width, height, position = 'attention', overlay, filename }) {
  const background = await sharp(source)
    .resize(width, height, { fit: 'cover', position })
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: svg(width, height, overlay), top: 0, left: 0 }])
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(output, filename));
}

await render({
  source: sources.tall,
  width: 128,
  height: 288,
  position: 'centre',
  filename: '01-kongkong-vertical-128x288.png',
  overlay: `
    <defs>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#17324d" stop-opacity=".96"/><stop offset="1" stop-color="#17324d" stop-opacity=".78"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#17324d" flood-opacity=".32"/></filter>
    </defs>
    <rect x="0" y="0" width="128" height="70" fill="url(#top)"/>
    <text class="text heavy" x="64" y="24" text-anchor="middle" fill="#ffffff" font-size="19">콩콩</text>
    <text class="text heavy" x="64" y="45" text-anchor="middle" fill="#ffffff" font-size="16">과학실험실</text>
    <rect x="28" y="53" width="72" height="14" rx="7" fill="#ffd447"/>
    <text class="text bold" x="64" y="63" text-anchor="middle" fill="#17324d" font-size="8">오늘은 내가 과학자!</text>
    <rect x="10" y="260" width="108" height="20" rx="10" fill="#ffffff" fill-opacity=".92" filter="url(#shadow)"/>
    <text class="text heavy" x="64" y="274" text-anchor="middle" fill="#087a9b" font-size="10">18가지 직접 체험</text>
  `,
});

await render({
  source: sources.hero,
  width: 480,
  height: 256,
  position: 'top',
  filename: '02-kongkong-main-480x256.png',
  overlay: `
    <defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#17324d" flood-opacity=".24"/></filter></defs>
    <rect x="18" y="20" width="224" height="216" rx="8" fill="#ffffff" fill-opacity=".92" stroke="#17324d" stroke-width="2" filter="url(#shadow)"/>
    <rect x="34" y="36" width="86" height="22" rx="11" fill="#19b8ad"/>
    <text class="text heavy" x="77" y="51" text-anchor="middle" fill="#ffffff" font-size="11">KIDS SCIENCE</text>
    <text class="text heavy" x="34" y="91" fill="#17324d" font-size="29">콩콩 과학실험실</text>
    <text class="text bold" x="34" y="124" fill="#3c596a" font-size="17">누르고, 움직이고,</text>
    <text class="text heavy" x="34" y="148" fill="#087a9b" font-size="20">직접 발견해요!</text>
    <rect x="34" y="170" width="88" height="31" rx="6" fill="#fff1ae" stroke="#d6a900"/>
    <text class="text heavy" x="78" y="190" text-anchor="middle" fill="#715200" font-size="12">18가지 실험</text>
    <rect x="130" y="170" width="88" height="31" rx="6" fill="#ffd7de" stroke="#c84862"/>
    <text class="text heavy" x="174" y="190" text-anchor="middle" fill="#9c2941" font-size="12">12가지 VR</text>
    <text class="text bold" x="34" y="219" fill="#50697b" font-size="10">초등 3학년 맞춤형 과학 탐구</text>
  `,
});

await render({
  source: sources.vr,
  width: 160,
  height: 224,
  position: 'centre',
  filename: '03-kongkong-vr-160x224.png',
  overlay: `
    <defs><filter id="shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#132d55" flood-opacity=".32"/></filter></defs>
    <rect x="10" y="10" width="140" height="59" rx="8" fill="#ffffff" fill-opacity=".91" stroke="#166f9b" stroke-width="2" filter="url(#shadow)"/>
    <text class="text heavy" x="80" y="36" text-anchor="middle" fill="#17324d" font-size="21">VR 과학 탐험대</text>
    <text class="text bold" x="80" y="55" text-anchor="middle" fill="#087a9b" font-size="10">내 손으로 직접 실험!</text>
    <rect x="20" y="194" width="120" height="22" rx="11" fill="#ffdd55" stroke="#17324d" stroke-width="1.5"/>
    <text class="text heavy" x="80" y="209" text-anchor="middle" fill="#17324d" font-size="11">12가지 VR 체험</text>
  `,
});

await render({
  source: sources.panorama,
  width: 544,
  height: 224,
  position: 'centre',
  filename: '04-kongkong-panorama-544x224.png',
  overlay: `
    <defs><filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#17324d" flood-opacity=".28"/></filter></defs>
    <rect x="198" y="16" width="326" height="77" rx="8" fill="#ffffff" fill-opacity=".91" stroke="#17324d" stroke-width="2" filter="url(#shadow)"/>
    <text class="text heavy" x="361" y="47" text-anchor="middle" fill="#17324d" font-size="24">직접 움직이고 발견하는 과학!</text>
    <text class="text bold" x="361" y="72" text-anchor="middle" fill="#087a9b" font-size="14">18가지 실험 · 12가지 VR 체험</text>
    <rect x="18" y="176" width="164" height="34" rx="7" fill="#17324d" fill-opacity=".94"/>
    <text class="text heavy" x="100" y="198" text-anchor="middle" fill="#ffffff" font-size="17">콩콩 과학실험실</text>
  `,
});

const files = [
  '01-kongkong-vertical-128x288.png',
  '02-kongkong-main-480x256.png',
  '03-kongkong-vr-160x224.png',
  '04-kongkong-panorama-544x224.png',
];

for (const file of files) {
  const metadata = await sharp(path.join(output, file)).metadata();
  console.log(`${file}: ${metadata.width}x${metadata.height}, ${metadata.format}`);
}
