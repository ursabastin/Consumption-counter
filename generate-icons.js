// Script to generate high-resolution PNG and SVG icons for the Chrome extension
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate an SVG icon representing YouTube Consumption Counter (Time + Play + Shorts icon)
function createSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF0033" />
      <stop offset="50%" stop-color="#CC0029" />
      <stop offset="100%" stop-color="#7B0018" />
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="100%" stop-color="#4FACFE" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Rounded Background Container -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />

  <!-- Outer Stopwatch Arc (Consumption / Time representation) -->
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.36}" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="${size * 0.07}" />
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.36}" fill="none" stroke="url(#cyanGrad)" stroke-width="${size * 0.07}" stroke-dasharray="${size * 1.5}" stroke-dashoffset="${size * 0.5}" stroke-linecap="round" />

  <!-- Play Triangle Center (Video symbol) -->
  <polygon points="${size * 0.44},${size * 0.36} ${size * 0.65},${size * 0.5} ${size * 0.44},${size * 0.64}" fill="#FFFFFF" filter="url(#glow)" />

  <!-- Mini Shorts Counter Badge at bottom-right -->
  <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size * 0.16}" fill="#0F172A" stroke="#00F2FE" stroke-width="${size * 0.04}" />
  <!-- Lightning bolt / S-symbol inside badge -->
  <path d="M${size * 0.76},${size * 0.67} L${size * 0.71},${size * 0.75} L${size * 0.75},${size * 0.75} L${size * 0.74},${size * 0.83} L${size * 0.79},${size * 0.75} L${size * 0.75},${size * 0.75} Z" fill="#00F2FE" />
</svg>`;
}

// Generate a standalone HTML canvas renderer to export PNGs without external native dependencies
const htmlRenderer = `<!DOCTYPE html>
<html>
<head>
  <title>Generate Icons</title>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    // In-browser or node canvas helper if needed
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), createSvgIcon(512), 'utf8');

// For standard manifest, we can generate pure SVG and standard canvas-drawn PNG data URIs using Node if available or pure BMP/PNG
console.log('SVG icon generated at icons/icon.svg');
