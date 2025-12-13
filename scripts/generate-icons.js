/**
 * CoopManager App Icon Generator
 * 
 * This script generates app icons in all required sizes for Android and iOS.
 * Run with: node scripts/generate-icons.js
 * 
 * Requirements: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Installing...');
  require('child_process').execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

// Icon sizes for different platforms
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const iosSizes = [
  20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024
];

// SVG icon definition - CoopManager Logo
const createSvgIcon = (size, isAdaptive = false) => {
  const padding = isAdaptive ? size * 0.2 : 0;
  const innerSize = size - (padding * 2);
  const scale = innerSize / 100;
  
  // For adaptive icons, we need a larger canvas with the icon centered
  const viewBox = isAdaptive ? `-20 -20 140 140` : `0 0 100 100`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#3730a3"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="50" cy="50" r="48" fill="url(#primaryGrad)"/>
  
  <!-- Inner decorative ring -->
  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  
  <!-- Three connected people - top -->
  <g>
    <!-- Person 1 - Top -->
    <circle cx="50" cy="28" r="8" fill="#ffffff"/>
    <path d="M38 42 Q50 35 62 42" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>
    
    <!-- Person 2 - Bottom Left -->
    <circle cx="30" cy="58" r="7" fill="rgba(255,255,255,0.9)"/>
    <path d="M20 70 Q30 64 40 70" stroke="rgba(255,255,255,0.9)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    
    <!-- Person 3 - Bottom Right -->
    <circle cx="70" cy="58" r="7" fill="rgba(255,255,255,0.9)"/>
    <path d="M60 70 Q70 64 80 70" stroke="rgba(255,255,255,0.9)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    
    <!-- Connecting lines between people -->
    <path d="M42 36 L34 52" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M58 36 L66 52" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M38 62 L62 62" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  
  <!-- Small coin/naira symbol at bottom center -->
  <circle cx="50" cy="78" r="10" fill="#ffffff"/>
  <text x="50" y="83" font-size="13" font-weight="bold" fill="#4f46e5" text-anchor="middle" font-family="Arial, sans-serif">₦</text>
</svg>`;
};

// Create foreground SVG for adaptive icons (Android)
const createAdaptiveForeground = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
  </defs>
  
  <!-- Centered content for adaptive icon (safe zone is center 66x66) -->
  <g transform="translate(54, 54)">
    <!-- Three connected people - top -->
    <!-- Person 1 - Top -->
    <circle cx="0" cy="-22" r="8" fill="#ffffff"/>
    <path d="M-12 -8 Q0 -15 12 -8" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>
    
    <!-- Person 2 - Bottom Left -->
    <circle cx="-20" cy="8" r="7" fill="rgba(255,255,255,0.95)"/>
    <path d="M-30 20 Q-20 14 -10 20" stroke="rgba(255,255,255,0.95)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    
    <!-- Person 3 - Bottom Right -->
    <circle cx="20" cy="8" r="7" fill="rgba(255,255,255,0.95)"/>
    <path d="M10 20 Q20 14 30 20" stroke="rgba(255,255,255,0.95)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    
    <!-- Connecting lines -->
    <path d="M-8 -14 L-16 2" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 -14 L16 2" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M-12 12 L12 12" stroke="url(#accentGrad)" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Naira symbol -->
    <circle cx="0" cy="28" r="9" fill="#ffffff"/>
    <text x="0" y="32" font-size="11" font-weight="bold" fill="#4f46e5" text-anchor="middle" font-family="Arial, sans-serif">₦</text>
  </g>
</svg>`;
};

// Create background for adaptive icons
const createAdaptiveBackground = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#3730a3"/>
    </linearGradient>
  </defs>
  <rect width="108" height="108" fill="url(#bgGrad)"/>
</svg>`;
};

async function generateIcons() {
  const projectRoot = path.join(__dirname, '..');
  const assetsDir = path.join(projectRoot, 'assets');
  const androidResDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
  
  console.log('🎨 Generating CoopManager App Icons...\n');
  
  // Generate main icon (1024x1024 for assets)
  console.log('📱 Creating main icon...');
  const mainIconSvg = createSvgIcon(1024);
  const mainIconBuffer = await sharp(Buffer.from(mainIconSvg))
    .png()
    .toBuffer();
  
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), mainIconBuffer);
  console.log('   ✓ assets/icon.png (1024x1024)');
  
  // Generate adaptive icon
  const adaptiveIconSvg = createSvgIcon(1024);
  const adaptiveBuffer = await sharp(Buffer.from(adaptiveIconSvg))
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveBuffer);
  console.log('   ✓ assets/adaptive-icon.png (1024x1024)');
  
  // Generate favicon
  const faviconSvg = createSvgIcon(64);
  const faviconBuffer = await sharp(Buffer.from(faviconSvg))
    .resize(64, 64)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuffer);
  console.log('   ✓ assets/favicon.png (64x64)');
  
  // Generate splash icon
  const splashSvg = createSvgIcon(512);
  const splashBuffer = await sharp(Buffer.from(splashSvg))
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splashBuffer);
  console.log('   ✓ assets/splash-icon.png (512x512)');
  
  // Generate Android icons
  console.log('\n🤖 Creating Android icons...');
  for (const [folder, size] of Object.entries(androidSizes)) {
    const folderPath = path.join(androidResDir, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Standard launcher icon
    const iconSvg = createSvgIcon(size);
    const iconBuffer = await sharp(Buffer.from(iconSvg))
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(folderPath, 'ic_launcher.png'), iconBuffer);
    
    // Round launcher icon
    const roundBuffer = await sharp(Buffer.from(iconSvg))
      .resize(size, size)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_round.png'), roundBuffer);
    
    // Adaptive foreground (108dp with safe zone)
    const adaptiveSize = Math.round(size * 108 / 48);
    const fgSvg = createAdaptiveForeground(adaptiveSize);
    const fgBuffer = await sharp(Buffer.from(fgSvg))
      .resize(adaptiveSize, adaptiveSize)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(folderPath, 'ic_launcher_foreground.png'), fgBuffer);
    
    console.log(`   ✓ ${folder}/ic_launcher.png (${size}x${size})`);
    console.log(`   ✓ ${folder}/ic_launcher_round.png (${size}x${size})`);
    console.log(`   ✓ ${folder}/ic_launcher_foreground.png (${adaptiveSize}x${adaptiveSize})`);
  }
  
  console.log('\n✅ App icons generated successfully!');
  console.log('\n📝 Note: For iOS, you may need to add these icons through Xcode.');
  console.log('   The main 1024x1024 icon is available at assets/icon.png');
}

generateIcons().catch(console.error);
