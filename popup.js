/**
 * YouTube Consumption Counter - Popup Script
 * Real-time stats display, quick toggles, and ratio visualizer.
 */

import { StorageService, formatDuration } from './utils/storage.js';

let cachedData = null;

async function loadAndRender() {
  cachedData = await StorageService.getAllData();
  const { today, settings } = cachedData;

  const videoSec = today.videoSeconds || 0;
  const shortsSec = today.shortsSeconds || 0;
  const browseSec = today.browseSeconds || 0;
  const totalWatchSec = videoSec + shortsSec;

  // Total banner
  document.getElementById('today-total-time').textContent = formatDuration(totalWatchSec);

  const totalMin = Math.floor(totalWatchSec / 60);
  const totalLimitMin = settings.totalDailyLimitMinutes || 120;
  const badgeEl = document.getElementById('consumption-badge');

  if (totalMin >= totalLimitMin) {
    badgeEl.textContent = 'Limit Exceeded';
    badgeEl.className = 'total-badge danger';
  } else if (totalMin >= totalLimitMin * 0.8) {
    badgeEl.textContent = 'High Usage';
    badgeEl.className = 'total-badge warning';
  } else {
    badgeEl.textContent = 'Mindful';
    badgeEl.className = 'total-badge';
  }

  // Videos Card
  document.getElementById('video-count').textContent = `${today.videoCount || 0} watched`;
  document.getElementById('video-time').textContent = formatDuration(videoSec);
  const avgVideoSec = today.videoCount > 0 ? Math.round(videoSec / today.videoCount) : 0;
  document.getElementById('video-sub').textContent = `Avg ${formatDuration(avgVideoSec)} / video`;

  // Shorts Card
  document.getElementById('shorts-count').textContent = `${today.shortsCount || 0} watched`;
  document.getElementById('shorts-time').textContent = formatDuration(shortsSec);
  const avgShortSec = today.shortsCount > 0 ? Math.round(shortsSec / today.shortsCount) : 0;
  document.getElementById('shorts-sub').textContent = `Avg ${formatDuration(avgShortSec)} / short`;

  // Consumption Ratio Split
  const totalActive = videoSec + shortsSec;
  let videoPct = 50;
  let shortsPct = 50;

  if (totalActive > 0) {
    videoPct = Math.round((videoSec / totalActive) * 100);
    shortsPct = 100 - videoPct;
  } else {
    videoPct = 0;
    shortsPct = 0;
  }

  document.getElementById('ratio-label').textContent = `${videoPct}% Videos • ${shortsPct}% Shorts`;
  document.getElementById('bar-video').style.width = `${videoPct}%`;
  document.getElementById('bar-shorts').style.width = `${shortsPct}%`;

  // Shorts Doomscroll Limit Progress
  const shortsLimitMin = settings.shortsDailyLimitMinutes || 25;
  const currentShortsMin = Math.floor(shortsSec / 60);
  const limitPct = Math.min(100, Math.round((currentShortsMin / shortsLimitMin) * 100));

  const limitStatusEl = document.getElementById('shorts-limit-status');
  const limitFillEl = document.getElementById('shorts-limit-fill');
  limitStatusEl.textContent = `${currentShortsMin}m / ${shortsLimitMin}m`;
  limitFillEl.style.width = `${limitPct}%`;

  if (currentShortsMin >= shortsLimitMin) {
    limitStatusEl.textContent += ' ⚠️ Reached';
    limitStatusEl.style.color = '#F43F5E';
    limitFillEl.style.background = '#EF4444';
  } else {
    limitStatusEl.style.color = '#FFF';
    limitFillEl.style.background = 'linear-gradient(90deg, #F59E0B, #EF4444)';
  }

  // Feature stats
  document.getElementById('feat-scrolls').textContent = today.shortsScrolled || 0;
  document.getElementById('feat-searches').textContent = today.searchCount || 0;
  document.getElementById('feat-browse').textContent = formatDuration(browseSec);

  // Settings Toggles
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

// HUD Toggle
document.getElementById('toggle-hud').addEventListener('change', async (e) => {
  await StorageService.updateSettings({ showFloatingHud: e.target.checked });
});

// Periodic live refresh while popup is open
loadAndRender();
const refreshInterval = setInterval(loadAndRender, 1000);

window.addEventListener('unload', () => {
  clearInterval(refreshInterval);
});
