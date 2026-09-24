/**
 * Social Media & Video Consumption Counter - Popup Script
 * Multi-platform real-time stats display, platform breakdown, and controls.
 */

import { StorageService, formatDuration, PLATFORM_CONFIG } from './utils/storage.js';

let cachedData = null;

async function loadAndRender() {
  cachedData = await StorageService.getAllData();
  const { today, settings } = cachedData;

  const totalSec = today.totalSocialSeconds || ((today.videoSeconds || 0) + (today.shortsSeconds || 0));
  const microSec = today.microcontentSeconds || (today.shortsSeconds || 0);
  const longFormSec = Math.max(0, totalSec - microSec);

  // Total Screen Time
  document.getElementById('today-total-time').textContent = formatDuration(totalSec);

  const totalMin = Math.floor(totalSec / 60);
  const totalLimitMin = settings.totalDailyLimitMinutes || 120;
  const badgeEl = document.getElementById('consumption-badge');

  if (totalMin >= totalLimitMin) {
    badgeEl.textContent = 'Limit Exceeded';
    badgeEl.className = 'hero-badge danger';
  } else if (totalMin >= totalLimitMin * 0.8) {
    badgeEl.textContent = 'High Usage';
    badgeEl.className = 'hero-badge warning';
  } else {
    badgeEl.textContent = 'Mindful';
    badgeEl.className = 'hero-badge';
  }

  // Render Platform Chips
  const platformGrid = document.getElementById('platforms-pill-grid');
  if (platformGrid) {
    platformGrid.innerHTML = '';
    const platformKeys = Object.keys(PLATFORM_CONFIG);

    // Sort: active platforms first
    const sortedKeys = [...platformKeys].sort((a, b) => {
      const aSec = today.platforms?.[a]?.seconds || 0;
      const bSec = today.platforms?.[b]?.seconds || 0;
      return bSec - aSec;
    });

    let activeCount = 0;

    sortedKeys.forEach(pKey => {
      const conf = PLATFORM_CONFIG[pKey];
      const pSec = today.platforms?.[pKey]?.seconds || 0;
      if (pSec > 0) activeCount++;

      const chip = document.createElement('div');
      chip.className = pSec > 0 ? 'platform-chip has-time' : 'platform-chip';
      chip.title = `${conf.name}: ${formatDuration(pSec)} spent today`;

      chip.innerHTML = `
        <span class="chip-icon">${conf.icon}</span>
        <div class="chip-info">
          <span class="chip-name">${conf.name}</span>
          <span class="chip-time">${pSec > 0 ? formatDuration(pSec) : '0m'}</span>
        </div>
      `;
      platformGrid.appendChild(chip);
    });

    const countEl = document.getElementById('active-platforms-count');
    if (countEl) {
      countEl.textContent = `${activeCount} Active / 13 Total`;
    }
  }

  // Long-Form Card
  document.getElementById('video-count').textContent = `${today.videoCount || 0} items`;
  document.getElementById('video-time').textContent = formatDuration(longFormSec);
  document.getElementById('video-sub').textContent = 'Intentional deep focus';

  // Micro-content Card (Shorts, Reels, TikTok)
  const totalMicroCount = (today.shortsCount || 0) + (today.platforms?.tiktok?.count || 0) + (today.platforms?.instagram?.count || 0);
  document.getElementById('shorts-count').textContent = `${totalMicroCount} items`;
  document.getElementById('shorts-time').textContent = formatDuration(microSec);
  document.getElementById('shorts-sub').textContent = 'Shorts, Reels & TikTok';

  // Unified Doomscroll Budget (Shorts + Reels + TikTok)
  const microLimitMin = settings.shortsDailyLimitMinutes || 25;
  const currentMicroMin = Math.floor(microSec / 60);
  const limitPct = Math.min(100, Math.round((currentMicroMin / microLimitMin) * 100));

  const limitStatusEl = document.getElementById('shorts-limit-status');
  const limitFillEl = document.getElementById('shorts-limit-fill');
  limitStatusEl.textContent = `${currentMicroMin}m / ${microLimitMin}m`;
  limitFillEl.style.width = `${limitPct}%`;

  if (currentMicroMin >= microLimitMin) {
    limitStatusEl.textContent += ' ⚠️ Limit Reached';
    limitStatusEl.style.color = '#E11D48';
    limitFillEl.style.background = '#E11D48';
  } else {
    limitStatusEl.style.color = '#881337';
    limitFillEl.style.background = 'linear-gradient(90deg, #D97706, #E11D48)';
  }

  // HUD Toggle
  const hudToggle = document.getElementById('toggle-hud');
  if (hudToggle) {
    hudToggle.checked = settings.showFloatingHud !== false;
  }
}

// Open Dashboard
function openDashboard() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  } else {
    window.open('dashboard.html', '_blank');
  }
}

document.getElementById('open-dashboard-btn').addEventListener('click', openDashboard);
document.getElementById('view-dashboard-btn').addEventListener('click', openDashboard);

document.getElementById('toggle-hud').addEventListener('change', async (e) => {
  await StorageService.updateSettings({ showFloatingHud: e.target.checked });
});

// Refresh loop while open
loadAndRender();
const refreshInterval = setInterval(loadAndRender, 1000);

window.addEventListener('unload', () => {
  clearInterval(refreshInterval);
});
