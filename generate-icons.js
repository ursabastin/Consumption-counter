// Script to generate high-resolution SVG and manage icons for Consumption Counter
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate an SVG icon representing Consumption Counter (Time + Stopwatch Dial + Hands + Active Live Dot)
function createSvgIcon(size = 512) {
  const corner = size * 0.22;
  const cx = size * 0.50;
  const cy = size * 0.52;
  const radius = size * 0.30;
  const arcWidth = size * 0.085;
  const handWidth = size * 0.07;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#E11D48" />
    </linearGradient>
    <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Grounded Rounded Squircle -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${corner}" fill="url(#brandGrad)" />

  <!-- Stopwatch Top Pusher -->
  <rect x="${cx - (size * 0.07)}" y="${size * 0.10}" width="${size * 0.14}" height="${size * 0.07}" rx="${size * 0.02}" fill="#FFFFFF" fill-opacity="0.9" />

  <!-- Background Dial Ring -->
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="${size * 0.07}" />

  <!-- Active Counter Progress Arc -->
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#FFFFFF" stroke-width="${arcWidth}"
    stroke-dasharray="${radius * 2 * Math.PI}" stroke-dashoffset="${radius * 2 * Math.PI * 0.35}"
    stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" filter="url(#subtleGlow)" />

  <!-- Hour Hand (pointing towards 10 o'clock) -->
  <line x1="${cx}" y1="${cy}" x2="${cx - (radius * 0.52)}" y2="${cy - (radius * 0.35)}"
    stroke="#FFFFFF" stroke-width="${handWidth}" stroke-linecap="round" />

  <!-- Minute Hand (pointing towards 2 o'clock) -->
  <line x1="${cx}" y1="${cy}" x2="${cx + (radius * 0.58)}" y2="${cy - (radius * 0.45)}"
    stroke="#FFFFFF" stroke-width="${handWidth}" stroke-linecap="round" />

  <!-- Center Pivot Dot -->
  <circle cx="${cx}" cy="${cy}" r="${size * 0.065}" fill="#FFFFFF" />

  <!-- Live Pulse Dot at corner -->
  <circle cx="${size * 0.72}" cy="${size * 0.72}" r="${size * 0.10}" fill="#059669" stroke="#FFFFFF" stroke-width="${size * 0.035}" />
</svg>`;
}

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), createSvgIcon(512), 'utf8');
console.log('SVG icon generated at icons/icon.svg');
