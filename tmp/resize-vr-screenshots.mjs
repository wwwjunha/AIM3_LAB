import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const outputDir = 'C:/Users/user/OneDrive/Desktop/AIM3 LAB/expo-assets';
await mkdir(outputDir, { recursive: true });

const images = [
  {
    source: 'C:/Users/user/AppData/Local/Temp/codex-clipboard-bf669ea3-e61c-47e9-a519-e2497f1b9918.png',
    output: '05-magnet-vr-160x224.png',
  },
  {
    source: 'C:/Users/user/AppData/Local/Temp/codex-clipboard-1f362d53-79bb-48df-969f-d1fc81e57026.png',
    output: '06-dissolve-vr-160x224.png',
  },
];

for (const image of images) {
  const background = await sharp(image.source)
    .resize(160, 224, { fit: 'cover', position: 'centre' })
    .blur(12)
    .modulate({ brightness: 0.82, saturation: 0.72 })
    .png()
    .toBuffer();

  const foreground = await sharp(image.source)
    .resize(156, 220, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: foreground, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, image.output));

  const metadata = await sharp(path.join(outputDir, image.output)).metadata();
  console.log(`${image.output}: ${metadata.width}x${metadata.height}`);
}
