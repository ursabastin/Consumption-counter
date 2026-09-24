/**
 * YouTube Consumption Counter - Dashboard Engine
 * Handles analytics calculation, high-performance canvas charts, filtering, takeout parsing, and data export.
 */

import { StorageService, formatDuration, formatTimePrecise, getTodayKey, createEmptyDayStats } from './utils/storage.js';

let appState = {
  data: null,
  activeTab: 'overview',
  activeRange: 'today',
  historyFilter: 'all',
  searchQuery: ''
};

// Canvas Chart instances / redraw handlers
let chartRedrawers = [];

// DOM Elements
const elements = {
  // Nav
  navItems: document.querySelectorAll('.nav-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  filterBtns: document.querySelectorAll('.filter-btn'),

  // KPIs
  kpiTotalTime: document.getElementById('kpi-total-time'),
  kpiTotalHint: document.getElementById('kpi-total-hint'),
  kpiVideoTime: document.getElementById('kpi-video-time'),
  kpiVideoCount: document.getElementById('kpi-video-count'),
  kpiShortsTime: document.getElementById('kpi-shorts-time'),
  kpiShortsCount: document.getElementById('kpi-shorts-count'),
  kpiRatioVal: document.getElementById('kpi-ratio-val'),
  kpiRatioHint: document.getElementById('kpi-ratio-hint'),

  // Secondary Strip
  subAvgVideo: document.getElementById('sub-avg-video'),
  subAvgShort: document.getElementById('sub-avg-short'),
  subShortsSkipped: document.getElementById('sub-shorts-skipped'),
  subSearchCount: document.getElementById('sub-search-count'),
  subBrowseTime: document.getElementById('sub-browse-time'),

  // Canvases
  dailyTrendCanvas: document.getElementById('dailyTrendCanvas'),
  featureDonutCanvas: document.getElementById('featureDonutCanvas'),
  donutLegendSummary: document.getElementById('donut-legend-summary'),
  hourlyCanvas: document.getElementById('hourlyCanvas'),
  wellnessGaugeCanvas: document.getElementById('wellnessGaugeCanvas'),
  wellnessPct: document.getElementById('wellness-pct'),
  wellnessShortsUsed: document.getElementById('wellness-shorts-used'),
  wellnessStatusPill: document.getElementById('wellness-status-pill'),
  wellnessAdviceText: document.getElementById('wellness-advice-text'),

  // Trends Tab
  habitInsightText: document.getElementById('habit-insight-text'),
  countComparisonCanvas: document.getElementById('countComparisonCanvas'),
  sessionDurationCanvas: document.getElementById('sessionDurationCanvas'),

  // History Tab
  historySearch: document.getElementById('history-search'),
  typeFilterBtns: document.querySelectorAll('.type-filter-btn'),
  historyTableBody: document.getElementById('history-table-body'),
  tableEmpty: document.getElementById('table-empty'),

  // Settings
  settingsForm: document.getElementById('settings-form'),
  inputShortsLimit: document.getElementById('input-shorts-limit'),
  inputTotalLimit: document.getElementById('input-total-limit'),
  inputBreakInterval: document.getElementById('input-break-interval'),
  inputShowHud: document.getElementById('input-show-hud'),
  inputDoomscrollAlert: document.getElementById('input-doomscroll-alert'),
  inputTrackBg: document.getElementById('input-track-bg'),
  saveStatus: document.getElementById('save-status'),

  // Importer & Backup
  takeoutDropzone: document.getElementById('takeout-dropzone'),
  fileTakeout: document.getElementById('file-takeout'),
  takeoutResult: document.getElementById('takeout-result'),
  btnExportJson: document.getElementById('btn-export-json'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnDownloadBackup: document.getElementById('btn-download-backup'),
  btnImportBackup: document.getElementById('btn-import-backup'),
  fileRestore: document.getElementById('file-restore'),
  btnClearAll: document.getElementById('btn-clear-all'),
  btnDemoData: document.getElementById('btn-demo-data'),
  sidebarLiveTimer: document.getElementById('sidebar-live-timer')
};

// Initialize Application
async function init() {
  setupNavigation();
  setupFilterControls();
  setupSettingsHandlers();
  setupImporterAndBackup();
  setupWindowResize();

  await refreshData();

  // Periodic refresh every 3 seconds to reflect active YouTube tabs
  setInterval(async () => {
    if (appState.activeRange === 'today') {
      await refreshData(false);
    }
  }, 3000);
}

// Load data from Storage
async function refreshData(redrawAll = true) {
  appState.data = await StorageService.getAllData();
  renderCurrentView(redrawAll);
}

// Setup Navigation Tabs
function setupNavigation() {
  const titles = {
    overview: { title: 'Consumption Overview', sub: 'Track, quantify, and balance your YouTube video & shorts consumption' },
    trends: { title: 'Trends & Habits', sub: 'Longitudinal analysis of your content consumption patterns' },
    history: { title: 'Watch Log & History', sub: 'Detailed breakdown of every video and short you engaged with' },
    importer: { title: 'Google Takeout & Import', sub: 'Import your Google Takeout archive or backup extension history' },
    settings: { title: 'Limits & Settings', sub: 'Configure wellness reminders, audio tracking, and floating HUD overlay' }
  };

  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      appState.activeTab = tab;

      elements.navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      elements.tabPanes.forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(`tab-${tab}`);
      if (activePane) activePane.classList.add('active');

      if (titles[tab]) {
        elements.pageTitle.textContent = titles[tab].title;
        elements.pageSubtitle.textContent = titles[tab].sub;
      }

      renderCurrentView(true);
    });
  });
}

// Setup Time Filter Buttons
function setupFilterControls() {
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.activeRange = btn.dataset.range;
      renderCurrentView(true);
    });
  });

  // History Tab filters
  elements.typeFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.typeFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.historyFilter = btn.dataset.filter;
      renderHistoryTable();
    });
  });

  elements.historySearch.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value.toLowerCase().trim();
    renderHistoryTable();
  });
}

// Render the active view
function renderCurrentView(redrawAll = true) {
  if (!appState.data) return;

  const aggregated = getAggregatedMetrics(appState.activeRange);

  // Update KPI Cards
  renderKPICards(aggregated);

  // Render Charts if on overview or trends
  if (redrawAll) {
    if (appState.activeTab === 'overview') {
      renderDailyTrendChart(aggregated.daysList);
      renderFeatureDonutChart(aggregated);
      renderHourlyChart(appState.data.logs);
      renderWellnessGauge();
    } else if (appState.activeTab === 'trends') {
      renderCountComparisonChart(aggregated.daysList);
      renderSessionDurationChart(appState.data.logs);
      renderHabitInsights(aggregated);
    } else if (appState.activeTab === 'history') {
      renderHistoryTable();
    }
  }

  // Populate Settings fields if on settings tab
  populateSettingsForm();
}

// Filter and Aggregate Data based on Time Range
function getAggregatedMetrics(range) {
  const { today, history, logs } = appState.data;
  const todayKey = getTodayKey();

  let days = [];

  if (range === 'today') {
    days = [today];
  } else if (range === '7d' || range === '30d') {
    const numDays = range === '7d' ? 7 : 30;
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      if (key === todayKey) {
        days.push(today);
      } else if (history[key]) {
        days.push(history[key]);
      } else {
        days.push(createEmptyDayStats(key));
      }
    }
  } else {
    // All time
    const allKeys = Object.keys(history).sort();
    if (!allKeys.includes(todayKey)) allKeys.push(todayKey);
    days = allKeys.map(k => (k === todayKey ? today : history[k]));
  }

  let totalVideoSec = 0;
  let totalVideoCount = 0;
  let totalShortsSec = 0;
  let totalShortsCount = 0;
  let totalShortsScrolled = 0;
  let totalBrowseSec = 0;
  let totalSearches = 0;

  days.forEach(d => {
    totalVideoSec += (d.videoSeconds || 0);
    totalVideoCount += (d.videoCount || 0);
    totalShortsSec += (d.shortsSeconds || 0);
    totalShortsCount += (d.shortsCount || 0);
    totalShortsScrolled += (d.shortsScrolled || 0);
    totalBrowseSec += (d.browseSeconds || 0);
    totalSearches += (d.searchCount || 0);
  });

  const totalWatchSec = totalVideoSec + totalShortsSec;

  return {
    daysList: days,
    totalWatchSec,
    totalVideoSec,
    totalVideoCount,
    totalShortsSec,
    totalShortsCount,
    totalShortsScrolled,
    totalBrowseSec,
    totalSearches
  };
}

// Render KPI Cards
function renderKPICards(agg) {
  elements.kpiTotalTime.textContent = formatDuration(agg.totalWatchSec);
  elements.kpiTotalHint.textContent = `${agg.totalVideoCount + agg.totalShortsCount} total items consumed`;

  elements.kpiVideoTime.textContent = formatDuration(agg.totalVideoSec);
  elements.kpiVideoCount.textContent = `${agg.totalVideoCount} videos watched`;

  elements.kpiShortsTime.textContent = formatDuration(agg.totalShortsSec);
  elements.kpiShortsCount.textContent = `${agg.totalShortsCount} shorts watched`;

  // Ratio
  const totalActive = agg.totalVideoSec + agg.totalShortsSec;
  if (totalActive > 0) {
    const vPct = Math.round((agg.totalVideoSec / totalActive) * 100);
    const sPct = 100 - vPct;
    elements.kpiRatioVal.textContent = `${vPct}% / ${sPct}%`;
    elements.kpiRatioHint.textContent = `${vPct}% Long-form • ${sPct}% Shorts`;
  } else {
    elements.kpiRatioVal.textContent = '0% / 0%';
    elements.kpiRatioHint.textContent = 'No watch activity in period';
  }

  // Secondary Strip
  const avgVideoSec = agg.totalVideoCount > 0 ? Math.round(agg.totalVideoSec / agg.totalVideoCount) : 0;
  elements.subAvgVideo.textContent = formatDuration(avgVideoSec);

  const avgShortSec = agg.totalShortsCount > 0 ? Math.round(agg.totalShortsSec / agg.totalShortsCount) : 0;
  elements.subAvgShort.textContent = `${avgShortSec}s`;

  elements.subShortsSkipped.textContent = agg.totalShortsScrolled;
  elements.subSearchCount.textContent = agg.totalSearches;
  elements.subBrowseTime.textContent = formatDuration(agg.totalBrowseSec);

  elements.sidebarLiveTimer.textContent = `Today: ${formatDuration((appState.data.today.videoSeconds || 0) + (appState.data.today.shortsSeconds || 0))}`;
}

// ==========================================
// HIGH PERFORMANCE RETINA CANVAS CHARTS
// ==========================================

function getPixelRatio(ctx) {
  const dpr = window.devicePixelRatio || 1;
  const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
  return dpr / bsr;
}

function setupCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width || 300;
  const height = rect.height || 200;
  const ctx = canvas.getContext('2d');
  const ratio = getPixelRatio(ctx);

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

// Daily Trend Stacked Bar Chart
function renderDailyTrendChart(days) {
  const c = setupCanvas(elements.dailyTrendCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Find max minutes
  let maxMinutes = 60;
  days.forEach(d => {
    const totalMins = Math.ceil(((d.videoSeconds || 0) + (d.shortsSeconds || 0)) / 60);
    if (totalMins > maxMinutes) maxMinutes = totalMins;
  });
  maxMinutes = Math.ceil(maxMinutes / 30) * 30; // Round to nearest 30 mins

  // Draw Grid Lines
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748B';
  ctx.font = '11px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'right';

  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((maxMinutes / gridSteps) * i);
    const y = padding.top + chartH - (i / gridSteps) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(`${val}m`, padding.left - 8, y + 4);
  }

  // Draw Bars
  const n = days.length;
  const barSpacing = Math.max(4, chartW / (n * 3));
  const barW = Math.max(6, (chartW - (n - 1) * barSpacing) / n);

  days.forEach((d, i) => {
    const x = padding.left + i * (barW + barSpacing);
    const vMins = (d.videoSeconds || 0) / 60;
    const sMins = (d.shortsSeconds || 0) / 60;

    const vHeight = (vMins / maxMinutes) * chartH;
    const sHeight = (sMins / maxMinutes) * chartH;

    // Regular Videos bar segment (Bottom)
    if (vHeight > 0) {
      const vGrad = ctx.createLinearGradient(0, padding.top + chartH - vHeight, 0, padding.top + chartH);
      vGrad.addColorStop(0, '#6366F1');
      vGrad.addColorStop(1, '#4F46E5');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartH - vHeight, barW, vHeight, sHeight > 0 ? [0, 0, 4, 4] : [4, 4, 4, 4]);
      ctx.fill();
    }

    // Shorts bar segment (Top of stack)
    if (sHeight > 0) {
      const sGrad = ctx.createLinearGradient(0, padding.top + chartH - vHeight - sHeight, 0, padding.top + chartH - vHeight);
      sGrad.addColorStop(0, '#F43F5E');
      sGrad.addColorStop(1, '#E11D48');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartH - vHeight - sHeight, barW, sHeight, [4, 4, 0, 0]);
      ctx.fill();
    }

    // Date Label (Show every few labels if many days)
    if (n <= 10 || i % Math.ceil(n / 7) === 0 || i === n - 1) {
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      const label = d.date ? d.date.slice(5) : `D${i + 1}`;
      ctx.fillText(label, x + barW / 2, height - 12);
    }
  });
}

// Feature Donut Chart
function renderFeatureDonutChart(agg) {
  const c = setupCanvas(elements.featureDonutCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const total = (agg.totalVideoSec + agg.totalShortsSec + agg.totalBrowseSec) || 1;
  const segments = [
    { label: 'Regular Videos', value: agg.totalVideoSec, color: '#4F46E5', tag: '🎬' },
    { label: 'YouTube Shorts', value: agg.totalShortsSec, color: '#E11D48', tag: '⚡' },
    { label: 'Browse & Search', value: agg.totalBrowseSec, color: '#0284C7', tag: '🧭' }
  ];

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 10;
  const innerRadius = radius * 0.65;

  let currentAngle = -Math.PI / 2;

  segments.forEach(seg => {
    const sliceAngle = (seg.value / total) * (Math.PI * 2);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(cx, cy, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    currentAngle += sliceAngle;
  });

  // Center Circle (White cutout for light theme)
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Populate Legend Summary
  elements.donutLegendSummary.innerHTML = segments.map(seg => {
    const pct = Math.round((seg.value / total) * 100);
    return `
      <div class="donut-row">
        <div class="donut-left">
          <span>${seg.tag}</span>
          <span>${seg.label}</span>
        </div>
        <span class="donut-val">${pct}% (${formatDuration(seg.value)})</span>
      </div>
    `;
  }).join('');
}

// Hourly Consumption Profile (24 Hours)
function renderHourlyChart(logs) {
  const c = setupCanvas(elements.hourlyCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const hourly = Array.from({ length: 24 }, () => ({ videoSec: 0, shortsSec: 0 }));

  if (logs && logs.length > 0) {
    logs.forEach(l => {
      const h = new Date(l.timestamp).getHours();
      if (h >= 0 && h < 24) {
        if (l.type === 'shorts') {
          hourly[h].shortsSec += (l.seconds || 0);
        } else {
          hourly[h].videoSec += (l.seconds || 0);
        }
      }
    });
  }

  let maxSec = 600;
  hourly.forEach(h => {
    const sum = h.videoSec + h.shortsSec;
    if (sum > maxSec) maxSec = sum;
  });

  const padding = { top: 20, right: 15, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = (chartW / 24) - 3;

  for (let i = 0; i < 24; i++) {
    const x = padding.left + i * (barW + 3);
    const vH = (hourly[i].videoSec / maxSec) * chartH;
    const sH = (hourly[i].shortsSec / maxSec) * chartH;

    if (vH > 0) {
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(x, padding.top + chartH - vH, barW, vH);
    }
    if (sH > 0) {
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(x, padding.top + chartH - vH - sH, barW, sH);
    }

    // Hour Label every 4 hours
    if (i % 4 === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}h`, x + barW / 2, height - 10);
    }
  }
}

// Mindful Habits Wellness Gauge
function renderWellnessGauge() {
  const canvas = elements.wellnessGaugeCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { today, settings } = appState.data;
  const shortsLimitMin = settings.shortsDailyLimitMinutes || 25;
  const currentShortsMin = Math.floor((today.shortsSeconds || 0) / 60);
  const ratio = Math.min(1.5, currentShortsMin / shortsLimitMin);
  const pct = Math.round((currentShortsMin / shortsLimitMin) * 100);

  const cx = 90;
  const cy = 95;
  const r = 70;

  // Background arc (Light track)
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();

  // Progress arc
  const endAngle = Math.PI + Math.min(Math.PI, ratio * Math.PI);
  let gaugeColor = '#059669'; // Mint
  if (ratio >= 1.0) {
    gaugeColor = '#E11D48'; // Coral
  } else if (ratio >= 0.75) {
    gaugeColor = '#D97706'; // Amber
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.lineWidth = 14;
  ctx.strokeStyle = gaugeColor;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Text status
  elements.wellnessPct.textContent = `${pct}%`;
  elements.wellnessShortsUsed.textContent = `${currentShortsMin}m / ${shortsLimitMin}m`;

  if (ratio >= 1.0) {
    elements.wellnessStatusPill.textContent = 'Limit Exceeded';
    elements.wellnessStatusPill.className = 'status-pill danger';
    elements.wellnessAdviceText.textContent = `You've exceeded your daily shorts budget of ${shortsLimitMin}m. Time for a restful pause!`;
  } else if (ratio >= 0.75) {
    elements.wellnessStatusPill.textContent = 'Approaching Limit';
    elements.wellnessStatusPill.className = 'status-pill warning';
    elements.wellnessAdviceText.textContent = `You've reached ${pct}% of your shorts limit today. Consider transitioning to intentional long-form content.`;
  } else {
    elements.wellnessStatusPill.textContent = 'Within Limits';
    elements.wellnessStatusPill.className = 'status-pill good';
    elements.wellnessAdviceText.textContent = `Great mindful balance today! You are well within your ${shortsLimitMin}m daily Shorts target.`;
  }
}

// Trends Tab: Count Comparison (Videos vs Shorts)
function renderCountComparisonChart(days) {
  const c = setupCanvas(elements.countComparisonCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  let maxCount = 10;
  days.forEach(d => {
    if ((d.videoCount || 0) > maxCount) maxCount = d.videoCount;
    if ((d.shortsCount || 0) > maxCount) maxCount = d.shortsCount;
  });

  const n = days.length;
  const groupW = chartW / n;
  const barW = Math.max(4, groupW * 0.35);

  days.forEach((d, i) => {
    const gx = padding.left + i * groupW;

    const vH = ((d.videoCount || 0) / maxCount) * chartH;
    const sH = ((d.shortsCount || 0) / maxCount) * chartH;

    // Video bar
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(gx + 2, padding.top + chartH - vH, barW, vH);

    // Shorts bar
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(gx + barW + 5, padding.top + chartH - sH, barW, sH);

    if (n <= 10 || i % Math.ceil(n / 6) === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.date ? d.date.slice(5) : `D${i}`, gx + groupW / 2, height - 12);
    }
  });
}

// Session Duration Distribution
function renderSessionDurationChart(logs) {
  const c = setupCanvas(elements.sessionDurationCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const bins = {
    '< 1 min': 0,
    '1 - 5 min': 0,
    '5 - 15 min': 0,
    '15 - 30 min': 0,
    '> 30 min': 0
  };

  (logs || []).forEach(l => {
    const sec = l.seconds || 0;
    if (sec < 60) bins['< 1 min']++;
    else if (sec < 300) bins['1 - 5 min']++;
    else if (sec < 900) bins['5 - 15 min']++;
    else if (sec < 1800) bins['15 - 30 min']++;
    else bins['> 30 min']++;
  });

  const binKeys = Object.keys(bins);
  const maxVal = Math.max(1, ...Object.values(bins));

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = (chartW / binKeys.length) - 16;

  binKeys.forEach((key, i) => {
    const x = padding.left + i * (barW + 16) + 8;
    const bH = (bins[key] / maxVal) * chartH;

    const grad = ctx.createLinearGradient(0, padding.top + chartH - bH, 0, padding.top + chartH);
    grad.addColorStop(0, '#6366F1');
    grad.addColorStop(1, '#4F46E5');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - bH, barW, bH, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${bins[key]}`, x + barW / 2, padding.top + chartH - bH - 6);

    ctx.fillStyle = '#64748B';
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(key, x + barW / 2, height - 12);
  });
}

function renderHabitInsights(agg) {
  const vTime = agg.totalVideoSec;
  const sTime = agg.totalShortsSec;

  if (vTime + sTime === 0) {
    elements.habitInsightText.textContent = 'No watch consumption recorded yet in this time frame. Open YouTube to begin tracking!';
    return;
  }

  const sPct = Math.round((sTime / (vTime + sTime)) * 100);

  if (sPct > 65) {
    elements.habitInsightText.textContent = `Shorts make up ${sPct}% of your watch time. You are leaning heavily towards hyper-stimulating micro-content. Consider replacing 15 mins of shorts scrolling with an educational documentary or podcast!`;
  } else if (sPct < 25) {
    elements.habitInsightText.textContent = `Long-form videos dominate your consumption (${100 - sPct}%). This indicates focused, intentional deep viewing rather than passive algorithmic scrolling. Excellent work!`;
  } else {
    elements.habitInsightText.textContent = `Healthy balance: You enjoy a mix of deep videos (${100 - sPct}%) and brief shorts (${sPct}%). Your browsing habits are well-distributed across formats.`;
  }
}

// Watch Log / History Table
function renderHistoryTable() {
  const { logs } = appState.data;
  const tbody = elements.historyTableBody;
  tbody.innerHTML = '';

  if (!logs || logs.length === 0) {
    elements.tableEmpty.style.display = 'block';
    return;
  }

  // Filter logs
  const filtered = logs.filter(item => {
    // Type match
    if (appState.historyFilter !== 'all' && item.type !== appState.historyFilter) return false;
    // Search match
    if (appState.searchQuery) {
      const matchTitle = (item.title || '').toLowerCase().includes(appState.searchQuery);
      const matchChannel = (item.channel || '').toLowerCase().includes(appState.searchQuery);
      if (!matchTitle && !matchChannel) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    elements.tableEmpty.style.display = 'block';
    return;
  }

  elements.tableEmpty.style.display = 'none';

  filtered.slice(0, 100).forEach(item => {
    const tr = document.createElement('tr');

    const isShorts = item.type === 'shorts';
    const ytUrl = isShorts
      ? `https://www.youtube.com/shorts/${item.id}`
      : `https://www.youtube.com/watch?v=${item.id}`;

    const dateStr = item.timestamp
      ? new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    tr.innerHTML = `
      <td>
        <span class="item-badge ${isShorts ? 'shorts' : 'video'}">
          ${isShorts ? '⚡ Short' : '🎬 Video'}
        </span>
      </td>
      <td>
        <div class="item-title-box">
          <span class="item-title" title="${item.title || ''}">${item.title || 'YouTube Video'}</span>
          <span class="item-channel">${item.channel || 'Creator'}</span>
        </div>
      </td>
      <td>
        <span class="item-watchtime">${formatDuration(item.seconds || 0)}</span>
      </td>
      <td>
        <span>${dateStr}</span>
      </td>
      <td>
        <a href="${ytUrl}" target="_blank" class="btn-open-yt">View</a>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Settings Handlers
function setupSettingsHandlers() {
  elements.settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSettings = {
      shortsDailyLimitMinutes: parseInt(elements.inputShortsLimit.value, 10) || 25,
      totalDailyLimitMinutes: parseInt(elements.inputTotalLimit.value, 10) || 120,
      breakReminderMinutes: parseInt(elements.inputBreakInterval.value, 10) || 30,
      showFloatingHud: elements.inputShowHud.checked,
      shortsDoomscrollAlert: elements.inputDoomscrollAlert.checked,
      trackBackgroundAudio: elements.inputTrackBg.checked
    };

    await StorageService.updateSettings(newSettings);
    elements.saveStatus.textContent = '✓ Settings Saved Successfully!';
    setTimeout(() => { elements.saveStatus.textContent = ''; }, 3000);
    renderCurrentView(true);
  });
}

function populateSettingsForm() {
  if (!appState.data || !appState.data.settings) return;
  const s = appState.data.settings;

  elements.inputShortsLimit.value = s.shortsDailyLimitMinutes || 25;
  elements.inputTotalLimit.value = s.totalDailyLimitMinutes || 120;
  elements.inputBreakInterval.value = s.breakReminderMinutes || 30;
  elements.inputShowHud.checked = s.showFloatingHud !== false;
  elements.inputDoomscrollAlert.checked = s.shortsDoomscrollAlert !== false;
  elements.inputTrackBg.checked = !!s.trackBackgroundAudio;
}

// Importer and Backup Tools
function setupImporterAndBackup() {
  // Export JSON
  elements.btnExportJson.addEventListener('click', () => {
    const jsonStr = JSON.stringify(appState.data, null, 2);
    downloadFile(jsonStr, `yt-consumption-backup-${getTodayKey()}.json`, 'application/json');
  });

  elements.btnDownloadBackup.addEventListener('click', () => {
    const jsonStr = JSON.stringify(appState.data, null, 2);
    downloadFile(jsonStr, `yt-consumption-backup-${getTodayKey()}.json`, 'application/json');
  });

  // Export CSV
  elements.btnExportCsv.addEventListener('click', () => {
    const logs = appState.data.logs || [];
    let csv = 'Type,ID,Title,Channel,Seconds,Duration,Timestamp\n';
    logs.forEach(l => {
      const title = `"${(l.title || '').replace(/"/g, '""')}"`;
      const channel = `"${(l.channel || '').replace(/"/g, '""')}"`;
      const time = new Date(l.timestamp).toISOString();
      csv += `${l.type},${l.id},${title},${channel},${l.seconds},${formatDuration(l.seconds)},${time}\n`;
    });
    downloadFile(csv, `yt-watch-history-${getTodayKey()}.csv`, 'text/csv');
  });

  // Restore Backup
  elements.btnImportBackup.addEventListener('click', () => {
    elements.fileRestore.click();
  });

  elements.fileRestore.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (imported.today || imported.history) {
        await StorageService.set(imported);
        alert('Data successfully restored!');
        await refreshData(true);
      } else {
        alert('Invalid backup file structure.');
      }
    } catch (err) {
      alert('Error parsing backup: ' + err.message);
    }
  });

  // Clear All Data
  elements.btnClearAll.addEventListener('click', async () => {
    if (confirm('Are you sure you want to permanently clear all watch history and statistics?')) {
      await StorageService.clearAll();
      alert('All statistics have been reset.');
      await refreshData(true);
    }
  });

  // Load Sample Demo Data
  elements.btnDemoData.addEventListener('click', async () => {
    await populateRealisticDemoData();
    alert('Loaded 30 days of realistic sample data! Explore the charts, trends, and watch log.');
    await refreshData(true);
  });

  // Takeout File Dropzone
  const dz = elements.takeoutDropzone;
  dz.addEventListener('click', () => elements.fileTakeout.click());
  dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      processTakeoutFile(e.dataTransfer.files[0]);
    }
  });
  elements.fileTakeout.addEventListener('change', (e) => {
    if (e.target.files.length) processTakeoutFile(e.target.files[0]);
  });
}

// Process Google Takeout watch-history file (JSON or HTML)
async function processTakeoutFile(file) {
  elements.takeoutResult.style.display = 'block';
  elements.takeoutResult.className = 'import-result';
  elements.takeoutResult.innerHTML = `Parsing <strong>${file.name}</strong>... please wait.`;

  try {
    const text = await file.text();
    let videoCount = 0;
    let shortsCount = 0;
    const historyMap = { ...appState.data.history };
    const logs = [...(appState.data.logs || [])];

    if (file.name.endsWith('.json')) {
      const entries = JSON.parse(text);
      if (!Array.isArray(entries)) throw new Error('Expected JSON array from Google Takeout watch-history.json');

      entries.forEach(entry => {
        const titleUrl = entry.titleUrl || '';
        const title = (entry.title || '').replace(/^Watched\s+/, '');
        const channel = entry.subtitles && entry.subtitles[0] ? entry.subtitles[0].name : 'YouTube';
        const dateStr = entry.time ? entry.time.slice(0, 10) : null;
        if (!dateStr) return;

        const isShorts = titleUrl.includes('/shorts/');
        const idMatch = titleUrl.match(/(?:v=|shorts\/)([a-zA-Z0-9_-]{11})/);
        const id = idMatch ? idMatch[1] : 'takeout_' + Math.random().toString(36).slice(2, 8);

        if (!historyMap[dateStr]) {
          historyMap[dateStr] = createEmptyDayStats(dateStr);
        }

        if (isShorts) {
          shortsCount++;
          historyMap[dateStr].shortsCount++;
          historyMap[dateStr].shortsSeconds += 45; // average estimated 45s per short
        } else {
          videoCount++;
          historyMap[dateStr].videoCount++;
          historyMap[dateStr].videoSeconds += 420; // average estimated 7m per video
        }

        if (logs.length < 500) {
          logs.push({
            id,
            type: isShorts ? 'shorts' : 'video',
            title,
            channel,
            seconds: isShorts ? 45 : 420,
            timestamp: new Date(entry.time).getTime()
          });
        }
      });
    }

    // Save imported takeout
    await StorageService.set({
      history: historyMap,
      logs
    });

    elements.takeoutResult.className = 'import-result success';
    elements.takeoutResult.innerHTML = `
      <strong>Import Complete!</strong><br>
      Successfully imported <strong>${videoCount}</strong> regular videos and <strong>${shortsCount}</strong> shorts across your watch history.
    `;

    await refreshData(true);
  } catch (err) {
    elements.takeoutResult.className = 'import-result error';
    elements.takeoutResult.innerHTML = `<strong>Import Error:</strong> ${err.message}`;
  }
}

// Populate 30 days of realistic demo data
async function populateRealisticDemoData() {
  const sampleVideos = [
    { title: "Building a Modern Full-Stack App in 2026", channel: "Fireship", seconds: 540, type: "video" },
    { title: "The Hidden Physics Behind YouTube's Compression", channel: "Veritasium", seconds: 870, type: "video" },
    { title: "Day in the Life of an AI Research Engineer", channel: "TechLead", seconds: 620, type: "video" },
    { title: "Why JavaScript Won't Die Anytime Soon", channel: "ThePrimeagen", seconds: 1240, type: "video" },
    { title: "Designing State-of-the-Art Glassmorphism UI", channel: "DesignCourse", seconds: 780, type: "video" },
    { title: "Insane CSS Trick you didn't know exists #shorts", channel: "Hyperplexed", seconds: 38, type: "shorts" },
    { title: "Wait for the plot twist at the end! ⚡", channel: "MrBeast Shorts", seconds: 44, type: "shorts" },
    { title: "Clean Desk Setup Tour 2026 #aesthetic", channel: "MinimalTech", seconds: 52, type: "shorts" },
    { title: "How 1 line of Python crashed AWS", channel: "Dave Codes", seconds: 40, type: "shorts" },
    { title: "Satisfying 3D Animation Breakdown", channel: "Blender Guru", seconds: 32, type: "shorts" },
    { title: "How Search Engines Index Billions of Pages", channel: "ByteByteGo", seconds: 960, type: "video" }
  ];

  const now = new Date();
  const history = {};
  const logs = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;

    // Generate realistic fluctuating usage
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const numVideos = isWeekend ? Math.floor(Math.random() * 5 + 4) : Math.floor(Math.random() * 4 + 2);
    const numShorts = isWeekend ? Math.floor(Math.random() * 25 + 15) : Math.floor(Math.random() * 15 + 8);
    const videoSec = numVideos * Math.floor(Math.random() * 300 + 400);
    const shortsSec = numShorts * Math.floor(Math.random() * 15 + 32);

    history[key] = {
      date: key,
      videoSeconds: videoSec,
      videoCount: numVideos,
      shortsSeconds: shortsSec,
      shortsCount: numShorts,
      shortsScrolled: numShorts + Math.floor(Math.random() * 10),
      browseSeconds: Math.floor(Math.random() * 400 + 120),
      searchCount: Math.floor(Math.random() * 5 + 1),
      commentCount: Math.floor(Math.random() * 3)
    };

    // Add log entries for the last 5 days
    if (i <= 5) {
      for (let j = 0; j < Math.min(5, sampleVideos.length); j++) {
        const item = sampleVideos[j];
        logs.unshift({
          id: 'demo_' + Math.random().toString(36).slice(2, 9),
          type: item.type,
          title: item.title,
          channel: item.channel,
          seconds: item.seconds,
          timestamp: new Date(d.getTime() + j * 3600000).getTime()
        });
      }
    }
  }

  // Today's entry
  const todayKey = getTodayKey();
  const today = history[todayKey] || createEmptyDayStats(todayKey);

  await StorageService.set({
    todayDate: todayKey,
    today,
    history,
    logs
  });
}

function downloadFile(content, fileName, contentType) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function setupWindowResize() {
  window.addEventListener('resize', () => {
    renderCurrentView(true);
  });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
