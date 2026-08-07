const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_LOGO = path.join(__dirname, '../public/assets/logo.png');
const OUT_DIR = path.join(__dirname, '../public/icons');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons from logo.png using sharp...\n');
  
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error(`Error: Source logo file not found at ${SOURCE_LOGO}`);
    process.exit(1);
  }

  // 1. Generate standard square PWA icons (with transparency)
  for (const size of SIZES) {
    const file = path.join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE_LOGO)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(file);
    console.log(`  ✓ icon-${size}x${size}.png generated.`);
  }

  // 2. Generate maskable icon (logo padded inside solid background #F8FAFC)
  const maskableFile = path.join(OUT_DIR, 'icon-512x512-maskable.png');
  // Safe zone for maskable icon is 80% (which is 409.6px of 512px). We resize logo to 384px to be safe.
  const logoBuffer = await sharp(SOURCE_LOGO)
    .resize(384, 384, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 } // #F8FAFC
    }
  })
  .composite([{ input: logoBuffer, gravity: 'center' }])
  .toFile(maskableFile);
  
  console.log('  ✓ icon-512x512-maskable.png generated.');
  console.log('\nAll PWA icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
