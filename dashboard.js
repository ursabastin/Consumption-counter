/**
 * Consumption Counter - Analytics & Multi-Platform Command Engine
 * Handles analytics calculation, retina canvas charts, multi-platform filtering,
 * Google Takeout parsing, and unified mindful consumption tracking across 13 platforms.
 */

import {
  StorageService,
  formatDuration,
  formatTimePrecise,
  getTodayKey,
  createEmptyDayStats,
  ensureDayStructure,
  PLATFORM_CONFIG
} from './utils/storage.js';

let appState = {
  data: null,
  activeTab: 'overview',
  activeRange: 'today',
  selectedPlatform: 'all',
  historyFilter: 'all',
  searchQuery: ''
};

// DOM Elements
const elements = {
  // Nav
  navItems: document.querySelectorAll('.nav-item'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  platformSelectFilter: document.getElementById('platform-select-filter'),

  // KPIs
  kpiTotalLabel: document.getElementById('kpi-total-label'),
  kpiTotalTime: document.getElementById('kpi-total-time'),
  kpiTotalHint: document.getElementById('kpi-total-hint'),
  kpiVideoLabel: document.getElementById('kpi-video-label'),
  kpiVideoTime: document.getElementById('kpi-video-time'),
  kpiVideoCount: document.getElementById('kpi-video-count'),
  kpiShortsLabel: document.getElementById('kpi-shorts-label'),
  kpiShortsTime: document.getElementById('kpi-shorts-time'),
  kpiShortsCount: document.getElementById('kpi-shorts-count'),
  kpiRatioLabel: document.getElementById('kpi-ratio-label'),
  kpiRatioVal: document.getElementById('kpi-ratio-val'),
  kpiRatioHint: document.getElementById('kpi-ratio-hint'),
  kpiCard2Icon: document.getElementById('kpi-card2-icon'),
  kpiCard3Icon: document.getElementById('kpi-card3-icon'),

  // Secondary Strip
  subLabel1: document.getElementById('sub-label-1'),
  subAvgVideo: document.getElementById('sub-avg-video'),
  subLabel2: document.getElementById('sub-label-2'),
  subAvgShort: document.getElementById('sub-avg-short'),
  subLabel3: document.getElementById('sub-label-3'),
  subShortsSkipped: document.getElementById('sub-shorts-skipped'),
  subLabel4: document.getElementById('sub-label-4'),
  subSearchCount: document.getElementById('sub-search-count'),
  subLabel5: document.getElementById('sub-label-5'),
  subBrowseTime: document.getElementById('sub-browse-time'),

  // Canvases & Headers
  dailyChartTitle: document.getElementById('daily-chart-title'),
  dailyChartDesc: document.getElementById('daily-chart-desc'),
  dailyChartLegend: document.getElementById('daily-chart-legend'),
  dailyTrendCanvas: document.getElementById('dailyTrendCanvas'),

  donutChartTitle: document.getElementById('donut-chart-title'),
  donutChartDesc: document.getElementById('donut-chart-desc'),
  featureDonutCanvas: document.getElementById('featureDonutCanvas'),
  donutLegendSummary: document.getElementById('donut-legend-summary'),

  hourlyChartTitle: document.getElementById('hourly-chart-title'),
  hourlyChartDesc: document.getElementById('hourly-chart-desc'),
  hourlyCanvas: document.getElementById('hourlyCanvas'),

  wellnessChartTitle: document.getElementById('wellness-chart-title'),
  wellnessChartDesc: document.getElementById('wellness-chart-desc'),
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

  // Periodic refresh every 3 seconds to reflect active tabs
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
    overview: {
      title: 'Consumption Overview',
      sub: 'Track, quantify, and balance your screen time across all 13 social media networks'
    },
    trends: {
      title: 'Trends & Habits',
      sub: 'Longitudinal analysis of your content consumption patterns and focus'
    },
    history: {
      title: 'Activity & Watch Log',
      sub: 'Detailed chronological breakdown of every video, post, and thread you engaged with'
    },
    importer: {
      title: 'Takeout & Data Management',
      sub: 'Import your Google Takeout archive, export CSVs, or backup extension history'
    },
    settings: {
      title: 'Limits & Settings',
      sub: 'Configure wellness reminders, audio tracking, and floating on-page HUD overlay'
    }
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

// Setup Time & Platform Filter Controls
function setupFilterControls() {
  // Platform Dropdown
  if (elements.platformSelectFilter) {
    elements.platformSelectFilter.addEventListener('change', (e) => {
      appState.selectedPlatform = e.target.value;
      renderCurrentView(true);
    });
  }

  // Time Range Buttons
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

  if (elements.historySearch) {
    elements.historySearch.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      renderHistoryTable();
    });
  }
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

// Filter and Aggregate Data based on Time Range and Selected Platform
function getAggregatedMetrics(range) {
  const { today, history } = appState.data;
  const todayKey = getTodayKey();

  let days = [];

  if (range === 'today') {
    days = [ensureDayStructure(today, todayKey)];
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
        days.push(ensureDayStructure(today, todayKey));
      } else if (history[key]) {
        days.push(ensureDayStructure(history[key], key));
      } else {
        days.push(createEmptyDayStats(key));
      }
    }
  } else {
    // All time
    const allKeys = Object.keys(history).sort();
    if (!allKeys.includes(todayKey)) allKeys.push(todayKey);
    days = allKeys.map(k => (k === todayKey ? ensureDayStructure(today, todayKey) : ensureDayStructure(history[k], k)));
  }

  const selectedPlatform = appState.selectedPlatform;
  const isAll = selectedPlatform === 'all';

  let totalWatchSec = 0;
  let totalVideoSec = 0;
  let totalVideoCount = 0;
  let totalShortsSec = 0;
  let totalShortsCount = 0;
  let totalShortsScrolled = 0;
  let totalBrowseSec = 0;
  let totalSearches = 0;

  // Platform breakdown map for market share donut
  const platformTotals = {};
  const platformCounts = {};
  for (const pKey of Object.keys(PLATFORM_CONFIG)) {
    platformTotals[pKey] = 0;
    platformCounts[pKey] = 0;
  }

  // Sub-features map for single platform
  const subFeatureTotals = {};

  days.forEach(d => {
    // Ensure structure
    ensureDayStructure(d, d.date);

    // Sum all platform totals
    if (d.platforms) {
      for (const [pKey, pVal] of Object.entries(d.platforms)) {
        if (platformTotals[pKey] !== undefined) {
          platformTotals[pKey] += (pVal.seconds || 0);
          platformCounts[pKey] += (pVal.count || 0);
        }
      }
    }

    if (isAll) {
      // Cross-platform unified metrics
      const dayTotal = d.totalSocialSeconds || Object.values(platformTotals).reduce((a, b) => a + b, 0);
      const dayMicro = d.microcontentSeconds || (d.shortsSeconds || 0);
      const dayDeep = Math.max(0, dayTotal - dayMicro);

      totalWatchSec += dayTotal;
      totalShortsSec += dayMicro;
      totalVideoSec += dayDeep;

      totalVideoCount += (d.videoCount || 0);
      totalShortsCount += (d.shortsCount || 0);
      totalShortsScrolled += (d.shortsScrolled || 0);
      totalBrowseSec += (d.browseSeconds || 0);
      totalSearches += (d.searchCount || 0);
    } else {
      // Single Platform Selected
      const pData = (d.platforms && d.platforms[selectedPlatform]) || { seconds: 0, count: 0, subFeatures: {} };
      totalWatchSec += (pData.seconds || 0);
      totalVideoCount += (pData.count || 0);

      // Sub-features breakdown
      if (pData.subFeatures) {
        for (const [subKey, subSec] of Object.entries(pData.subFeatures)) {
          subFeatureTotals[subKey] = (subFeatureTotals[subKey] || 0) + subSec;
        }
      }

      if (selectedPlatform === 'youtube') {
        totalVideoSec += (d.videoSeconds || 0);
        totalVideoCount += (d.videoCount || 0);
        totalShortsSec += (d.shortsSeconds || 0);
        totalShortsCount += (d.shortsCount || 0);
        totalShortsScrolled += (d.shortsScrolled || 0);
        totalBrowseSec += (d.browseSeconds || 0);
        totalSearches += (d.searchCount || 0);
      } else {
        // Platform specific microcontent vs main
        if (selectedPlatform === 'instagram') {
          totalShortsSec += (pData.subFeatures?.reels || 0);
          totalVideoSec += (pData.subFeatures?.feed || 0) + (pData.subFeatures?.stories || 0);
          totalShortsCount += Math.round((pData.subFeatures?.reels || 0) / 35);
        } else if (selectedPlatform === 'tiktok') {
          totalShortsSec += (pData.seconds || 0);
          totalShortsCount += Math.round((pData.seconds || 0) / 28);
        } else if (selectedPlatform === 'snapchat') {
          totalShortsSec += (pData.subFeatures?.spotlight || 0);
          totalVideoSec += (pData.subFeatures?.stories || 0) + (pData.subFeatures?.chat || 0);
          totalShortsCount += Math.round((pData.subFeatures?.spotlight || 0) / 30);
        } else if (selectedPlatform === 'facebook') {
          totalShortsSec += (pData.subFeatures?.reels || 0);
          totalVideoSec += (pData.subFeatures?.feed || 0) + (pData.subFeatures?.groups || 0);
        } else {
          // General deep focus platforms (Reddit, Discord, LinkedIn, X, etc.)
          totalVideoSec += (pData.seconds || 0);
        }
      }
    }
  });

  // Calculate active platforms count
  const activePlatforms = Object.entries(platformTotals).filter(([_, s]) => s > 0);
  const activePlatformCount = activePlatforms.length;

  return {
    daysList: days,
    selectedPlatform,
    totalWatchSec,
    totalVideoSec,
    totalVideoCount,
    totalShortsSec,
    totalShortsCount,
    totalShortsScrolled,
    totalBrowseSec,
    totalSearches,
    platformTotals,
    platformCounts,
    subFeatureTotals,
    activePlatformCount
  };
}

// Render KPI Cards dynamically tailored to platform selection
function renderKPICards(agg) {
  const p = agg.selectedPlatform;
  const isAll = p === 'all';
  const cfg = PLATFORM_CONFIG[p] || { name: 'Unified', icon: '🌐' };

  if (isAll) {
    if (elements.kpiTotalLabel) elements.kpiTotalLabel.textContent = 'Total Social Screen Time';
    elements.kpiTotalTime.textContent = formatDuration(agg.totalWatchSec);
    elements.kpiTotalHint.textContent = `${agg.activePlatformCount} active platforms in period`;

    if (elements.kpiVideoLabel) elements.kpiVideoLabel.textContent = 'Deep Focus & Feeds';
    if (elements.kpiCard2Icon) elements.kpiCard2Icon.textContent = '📚';
    elements.kpiVideoTime.textContent = formatDuration(agg.totalVideoSec);
    elements.kpiVideoCount.textContent = `${agg.totalVideoCount} items & long reads`;

    if (elements.kpiShortsLabel) elements.kpiShortsLabel.textContent = 'Microcontent Doomscroll';
    if (elements.kpiCard3Icon) elements.kpiCard3Icon.textContent = '⚡';
    elements.kpiShortsTime.textContent = formatDuration(agg.totalShortsSec);
    elements.kpiShortsCount.textContent = `${agg.totalShortsCount} shorts/reels/snaps`;

    if (elements.kpiRatioLabel) elements.kpiRatioLabel.textContent = 'Deep vs Microcontent Ratio';

    const totalActive = agg.totalVideoSec + agg.totalShortsSec;
    if (totalActive > 0) {
      const vPct = Math.round((agg.totalVideoSec / totalActive) * 100);
      const sPct = 100 - vPct;
      elements.kpiRatioVal.textContent = `${vPct}% / ${sPct}%`;
      elements.kpiRatioHint.textContent = `${vPct}% Focused • ${sPct}% Microcontent`;
    } else {
      elements.kpiRatioVal.textContent = '0% / 0%';
      elements.kpiRatioHint.textContent = 'No active consumption recorded';
    }

    // Top Platform in secondary strip
    let topName = 'None';
    let topSec = 0;
    for (const [pKey, sec] of Object.entries(agg.platformTotals)) {
      if (sec > topSec) {
        topSec = sec;
        topName = `${PLATFORM_CONFIG[pKey]?.icon || ''} ${PLATFORM_CONFIG[pKey]?.name || pKey}`;
      }
    }

    if (elements.subLabel1) elements.subLabel1.textContent = 'Top Platform';
    elements.subAvgVideo.textContent = topName;

    if (elements.subLabel2) elements.subLabel2.textContent = 'Microcontent %';
    const microRatio = agg.totalWatchSec > 0 ? Math.round((agg.totalShortsSec / agg.totalWatchSec) * 100) : 0;
    elements.subAvgShort.textContent = `${microRatio}%`;

    if (elements.subLabel3) elements.subLabel3.textContent = 'Rapid Skips';
    elements.subShortsSkipped.textContent = agg.totalShortsScrolled;

    if (elements.subLabel4) elements.subLabel4.textContent = 'Searches & Explores';
    elements.subSearchCount.textContent = agg.totalSearches;

    if (elements.subLabel5) elements.subLabel5.textContent = 'Feed Browsing';
    elements.subBrowseTime.textContent = formatDuration(agg.totalBrowseSec);
  } else {
    // Specific Platform Selected
    if (elements.kpiTotalLabel) elements.kpiTotalLabel.textContent = `${cfg.name} Total Time`;
    elements.kpiTotalTime.textContent = formatDuration(agg.totalWatchSec);
    elements.kpiTotalHint.textContent = `Active usage on ${cfg.name}`;

    if (p === 'youtube') {
      if (elements.kpiVideoLabel) elements.kpiVideoLabel.textContent = 'Regular Videos';
      if (elements.kpiCard2Icon) elements.kpiCard2Icon.textContent = '🎬';
      elements.kpiVideoTime.textContent = formatDuration(agg.totalVideoSec);
      elements.kpiVideoCount.textContent = `${agg.totalVideoCount} videos watched`;

      if (elements.kpiShortsLabel) elements.kpiShortsLabel.textContent = 'YouTube Shorts';
      if (elements.kpiCard3Icon) elements.kpiCard3Icon.textContent = '⚡';
      elements.kpiShortsTime.textContent = formatDuration(agg.totalShortsSec);
      elements.kpiShortsCount.textContent = `${agg.totalShortsCount} shorts watched`;

      if (elements.kpiRatioLabel) elements.kpiRatioLabel.textContent = 'Shorts vs Video Ratio';

      const totalActive = agg.totalVideoSec + agg.totalShortsSec;
      if (totalActive > 0) {
        const vPct = Math.round((agg.totalVideoSec / totalActive) * 100);
        const sPct = 100 - vPct;
        elements.kpiRatioVal.textContent = `${vPct}% / ${sPct}%`;
        elements.kpiRatioHint.textContent = `${vPct}% Long-form • ${sPct}% Shorts`;
      } else {
        elements.kpiRatioVal.textContent = '0% / 0%';
        elements.kpiRatioHint.textContent = 'No watch activity';
      }

      if (elements.subLabel1) elements.subLabel1.textContent = 'Avg Video Time';
      const avgVideoSec = agg.totalVideoCount > 0 ? Math.round(agg.totalVideoSec / agg.totalVideoCount) : 0;
      elements.subAvgVideo.textContent = formatDuration(avgVideoSec);

      if (elements.subLabel2) elements.subLabel2.textContent = 'Avg Short Time';
      const avgShortSec = agg.totalShortsCount > 0 ? Math.round(agg.totalShortsSec / agg.totalShortsCount) : 0;
      elements.subAvgShort.textContent = `${avgShortSec}s`;

      if (elements.subLabel3) elements.subLabel3.textContent = 'Shorts Rapid Skips';
      elements.subShortsSkipped.textContent = agg.totalShortsScrolled;

      if (elements.subLabel4) elements.subLabel4.textContent = 'Searches Executed';
      elements.subSearchCount.textContent = agg.totalSearches;

      if (elements.subLabel5) elements.subLabel5.textContent = 'Feed Browsing';
      elements.subBrowseTime.textContent = formatDuration(agg.totalBrowseSec);
    } else if (p === 'instagram') {
      if (elements.kpiVideoLabel) elements.kpiVideoLabel.textContent = 'Feed & Stories';
      if (elements.kpiCard2Icon) elements.kpiCard2Icon.textContent = '📸';
      elements.kpiVideoTime.textContent = formatDuration(agg.totalVideoSec);
      elements.kpiVideoCount.textContent = 'Posts & stories viewed';

      if (elements.kpiShortsLabel) elements.kpiShortsLabel.textContent = 'Instagram Reels';
      if (elements.kpiCard3Icon) elements.kpiCard3Icon.textContent = '⚡';
      elements.kpiShortsTime.textContent = formatDuration(agg.totalShortsSec);
      elements.kpiShortsCount.textContent = `${agg.totalShortsCount} reels scrolled`;

      if (elements.kpiRatioLabel) elements.kpiRatioLabel.textContent = 'Feed vs Reels Ratio';
      const totalActive = agg.totalVideoSec + agg.totalShortsSec;
      const vPct = totalActive > 0 ? Math.round((agg.totalVideoSec / totalActive) * 100) : 0;
      elements.kpiRatioVal.textContent = `${vPct}% / ${100 - vPct}%`;
      elements.kpiRatioHint.textContent = `${vPct}% Feed • ${100 - vPct}% Reels`;

      if (elements.subLabel1) elements.subLabel1.textContent = 'Reels Time';
      elements.subAvgVideo.textContent = formatDuration(agg.totalShortsSec);
      if (elements.subLabel2) elements.subLabel2.textContent = 'Feed Time';
      elements.subAvgShort.textContent = formatDuration(agg.totalVideoSec);
      if (elements.subLabel3) elements.subLabel3.textContent = 'Engagements';
      elements.subShortsSkipped.textContent = agg.totalVideoCount;
      if (elements.subLabel4) elements.subLabel4.textContent = 'Status';
      elements.subSearchCount.textContent = 'Tracking Active';
      if (elements.subLabel5) elements.subLabel5.textContent = 'Category';
      elements.subBrowseTime.textContent = 'Photo & Video';
    } else {
      // General Platform
      if (elements.kpiVideoLabel) elements.kpiVideoLabel.textContent = `${cfg.name} Content`;
      if (elements.kpiCard2Icon) elements.kpiCard2Icon.textContent = cfg.icon || '📌';
      elements.kpiVideoTime.textContent = formatDuration(agg.totalWatchSec);
      elements.kpiVideoCount.textContent = `${agg.totalVideoCount} sessions recorded`;

      if (elements.kpiShortsLabel) elements.kpiShortsLabel.textContent = 'Platform Focus';
      if (elements.kpiCard3Icon) elements.kpiCard3Icon.textContent = '🎯';
      elements.kpiShortsTime.textContent = formatDuration(agg.totalWatchSec);
      elements.kpiShortsCount.textContent = `${cfg.tag}`;

      if (elements.kpiRatioLabel) elements.kpiRatioLabel.textContent = 'Attention Balance';
      elements.kpiRatioVal.textContent = '100%';
      elements.kpiRatioHint.textContent = `${cfg.name} Active Session`;

      if (elements.subLabel1) elements.subLabel1.textContent = 'Platform';
      elements.subAvgVideo.textContent = cfg.name;
      if (elements.subLabel2) elements.subLabel2.textContent = 'Category';
      elements.subAvgShort.textContent = cfg.tag || 'Social Network';
      if (elements.subLabel3) elements.subLabel3.textContent = 'Sessions';
      elements.subShortsSkipped.textContent = agg.totalVideoCount;
      if (elements.subLabel4) elements.subLabel4.textContent = 'Tracking';
      elements.subSearchCount.textContent = 'Active 24/7';
      if (elements.subLabel5) elements.subLabel5.textContent = 'Today Screen Time';
      const todaySec = (appState.data.today.platforms && appState.data.today.platforms[p]?.seconds) || 0;
      elements.subBrowseTime.textContent = formatDuration(todaySec);
    }
  }

  // Sidebar live badge
  const totalToday = appState.data.today.totalSocialSeconds ||
    ((appState.data.today.videoSeconds || 0) + (appState.data.today.shortsSeconds || 0));
  elements.sidebarLiveTimer.textContent = `Today: ${formatDuration(totalToday)}`;
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

  const isAll = appState.selectedPlatform === 'all';
  const p = appState.selectedPlatform;

  if (elements.dailyChartTitle) {
    elements.dailyChartTitle.textContent = isAll
      ? 'Daily Consumption: Deep Focus vs Microcontent'
      : `${PLATFORM_CONFIG[p]?.name || p} Daily Consumption`;
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Find max minutes
  let maxMinutes = 60;
  days.forEach(d => {
    let dayTotalSec = 0;
    if (isAll) {
      dayTotalSec = d.totalSocialSeconds || ((d.videoSeconds || 0) + (d.shortsSeconds || 0));
    } else {
      dayTotalSec = (d.platforms && d.platforms[p]?.seconds) || 0;
    }
    const totalMins = Math.ceil(dayTotalSec / 60);
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
    let vMins = 0;
    let sMins = 0;

    if (isAll) {
      const dayTotal = d.totalSocialSeconds || ((d.videoSeconds || 0) + (d.shortsSeconds || 0));
      const dayMicro = d.microcontentSeconds || (d.shortsSeconds || 0);
      sMins = dayMicro / 60;
      vMins = Math.max(0, dayTotal - dayMicro) / 60;
    } else if (p === 'youtube') {
      vMins = (d.videoSeconds || 0) / 60;
      sMins = (d.shortsSeconds || 0) / 60;
    } else if (p === 'instagram') {
      const pData = d.platforms && d.platforms[p];
      sMins = (pData?.subFeatures?.reels || 0) / 60;
      vMins = ((pData?.seconds || 0) - (pData?.subFeatures?.reels || 0)) / 60;
    } else {
      const pData = d.platforms && d.platforms[p];
      vMins = (pData?.seconds || 0) / 60;
    }

    const vHeight = (vMins / maxMinutes) * chartH;
    const sHeight = (sMins / maxMinutes) * chartH;

    // Bottom segment (Deep Focus / Videos / Feeds)
    if (vHeight > 0) {
      const vGrad = ctx.createLinearGradient(0, padding.top + chartH - vHeight, 0, padding.top + chartH);
      vGrad.addColorStop(0, '#6366F1');
      vGrad.addColorStop(1, '#4F46E5');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartH - vHeight, barW, vHeight, sHeight > 0 ? [0, 0, 4, 4] : [4, 4, 4, 4]);
      ctx.fill();
    }

    // Top segment (Microcontent / Shorts / Reels)
    if (sHeight > 0) {
      const sGrad = ctx.createLinearGradient(0, padding.top + chartH - vHeight - sHeight, 0, padding.top + chartH - vHeight);
      sGrad.addColorStop(0, '#F43F5E');
      sGrad.addColorStop(1, '#E11D48');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartH - vHeight - sHeight, barW, sHeight, [4, 4, 0, 0]);
      ctx.fill();
    }

    // Date Label
    if (n <= 10 || i % Math.ceil(n / 7) === 0 || i === n - 1) {
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      const label = d.date ? d.date.slice(5) : `D${i + 1}`;
      ctx.fillText(label, x + barW / 2, height - 12);
    }
  });
}

// Feature & Multi-Platform Donut Chart
function renderFeatureDonutChart(agg) {
  const c = setupCanvas(elements.featureDonutCanvas);
  if (!c) return;
  const { ctx, width, height } = c;

  const isAll = appState.selectedPlatform === 'all';
  let segments = [];

  if (isAll) {
    if (elements.donutChartTitle) elements.donutChartTitle.textContent = 'Platform Attention Share';
    if (elements.donutChartDesc) elements.donutChartDesc.textContent = 'Market share of your digital attention across all 13 platforms';

    // Build segments for each platform that has time
    const active = Object.entries(agg.platformTotals)
      .filter(([_, sec]) => sec > 0)
      .sort((a, b) => b[1] - a[1]);

    if (active.length === 0) {
      segments = [
        { label: 'YouTube', value: 1, color: '#FF0033', tag: '🎬' },
        { label: 'Instagram', value: 1, color: '#E1306C', tag: '📸' }
      ];
    } else {
      segments = active.map(([key, sec]) => ({
        label: PLATFORM_CONFIG[key]?.name || key,
        value: sec,
        color: PLATFORM_CONFIG[key]?.color || '#4F46E5',
        tag: PLATFORM_CONFIG[key]?.icon || '🌐'
      }));
    }
  } else {
    // Single platform sub-features
    const p = appState.selectedPlatform;
    const cfg = PLATFORM_CONFIG[p] || { name: p, color: '#4F46E5' };

    if (elements.donutChartTitle) elements.donutChartTitle.textContent = `${cfg.name} Sub-Features`;
    if (elements.donutChartDesc) elements.donutChartDesc.textContent = `Breakdown of activities on ${cfg.name}`;

    if (p === 'youtube') {
      segments = [
        { label: 'Regular Videos', value: agg.totalVideoSec, color: '#4F46E5', tag: '🎬' },
        { label: 'YouTube Shorts', value: agg.totalShortsSec, color: '#E11D48', tag: '⚡' },
        { label: 'Browse & Search', value: agg.totalBrowseSec, color: '#0284C7', tag: '🧭' }
      ];
    } else {
      // General sub-feature segments from subFeatureTotals
      const entries = Object.entries(agg.subFeatureTotals).filter(([_, s]) => s > 0);
      if (entries.length > 0) {
        const palette = ['#4F46E5', '#E11D48', '#0284C7', '#059669', '#D97706', '#7C3AED'];
        segments = entries.map(([subKey, sec], idx) => ({
          label: subKey.charAt(0).toUpperCase() + subKey.slice(1),
          value: sec,
          color: palette[idx % palette.length],
          tag: '🔹'
        }));
      } else {
        segments = [
          { label: `${cfg.name} Stream`, value: agg.totalWatchSec || 1, color: cfg.color || '#4F46E5', tag: cfg.icon || '📱' }
        ];
      }
    }
  }

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

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

  // Center Circle (White cutout for grounded light theme)
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Populate Legend Summary
  elements.donutLegendSummary.innerHTML = segments.slice(0, 7).map(seg => {
    const pct = Math.round((seg.value / total) * 100);
    return `
      <div class="donut-row">
        <div class="donut-left">
          <span>${seg.tag}</span>
          <span style="font-weight: 500;">${seg.label}</span>
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

  const hourly = Array.from({ length: 24 }, () => ({ deepSec: 0, microSec: 0 }));
  const p = appState.selectedPlatform;
  const isAll = p === 'all';

  if (elements.hourlyChartTitle) {
    elements.hourlyChartTitle.textContent = isAll
      ? 'Hourly Consumption Profile (All Social Media)'
      : `Hourly Consumption Profile (${PLATFORM_CONFIG[p]?.name || p})`;
  }

  if (logs && logs.length > 0) {
    logs.forEach(l => {
      // Filter by platform if specific platform selected
      if (!isAll && l.platform && l.platform !== p) return;

      const h = new Date(l.timestamp).getHours();
      if (h >= 0 && h < 24) {
        const isMicro = l.type === 'shorts' || l.type === 'reels' || l.type === 'tiktok' || l.type === 'spotlight';
        if (isMicro) {
          hourly[h].microSec += (l.seconds || 0);
        } else {
          hourly[h].deepSec += (l.seconds || 0);
        }
      }
    });
  }

  let maxSec = 600;
  hourly.forEach(h => {
    const sum = h.deepSec + h.microSec;
    if (sum > maxSec) maxSec = sum;
  });

  const padding = { top: 20, right: 15, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = (chartW / 24) - 3;

  for (let i = 0; i < 24; i++) {
    const x = padding.left + i * (barW + 3);
    const dH = (hourly[i].deepSec / maxSec) * chartH;
    const mH = (hourly[i].microSec / maxSec) * chartH;

    if (dH > 0) {
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(x, padding.top + chartH - dH, barW, dH);
    }
    if (mH > 0) {
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(x, padding.top + chartH - dH - mH, barW, mH);
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

// Mindful Habits Wellness Gauge (Microcontent & Doomscroll Budget)
function renderWellnessGauge() {
  const canvas = elements.wellnessGaugeCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { today, settings } = appState.data;
  const isAll = appState.selectedPlatform === 'all';
  const p = appState.selectedPlatform;

  const shortsLimitMin = settings.shortsDailyLimitMinutes || 25;

  let currentMicroMin = 0;
  if (isAll) {
    currentMicroMin = Math.floor((today.microcontentSeconds || (today.shortsSeconds || 0)) / 60);
  } else if (p === 'youtube') {
    currentMicroMin = Math.floor((today.shortsSeconds || 0) / 60);
  } else {
    const pData = today.platforms && today.platforms[p];
    const microSec = pData?.subFeatures?.reels || pData?.subFeatures?.spotlight || pData?.seconds || 0;
    currentMicroMin = Math.floor(microSec / 60);
  }

  const ratio = Math.min(1.5, currentMicroMin / shortsLimitMin);
  const pct = Math.round((currentMicroMin / shortsLimitMin) * 100);

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
  let gaugeColor = '#059669'; // Mint green
  if (ratio >= 1.0) {
    gaugeColor = '#E11D48'; // Coral red
  } else if (ratio >= 0.75) {
    gaugeColor = '#D97706'; // Amber yellow
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, endAngle);
  ctx.lineWidth = 14;
  ctx.strokeStyle = gaugeColor;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Text status
  elements.wellnessPct.textContent = `${pct}%`;
  elements.wellnessShortsUsed.textContent = `${currentMicroMin}m / ${shortsLimitMin}m`;

  if (ratio >= 1.0) {
    elements.wellnessStatusPill.textContent = 'Limit Exceeded';
    elements.wellnessStatusPill.className = 'status-pill danger';
    elements.wellnessAdviceText.textContent = `You've exceeded your daily microcontent budget of ${shortsLimitMin}m. Time for a restful mindful pause!`;
  } else if (ratio >= 0.75) {
    elements.wellnessStatusPill.textContent = 'Approaching Limit';
    elements.wellnessStatusPill.className = 'status-pill warning';
    elements.wellnessAdviceText.textContent = `You've reached ${pct}% of your daily microcontent limit today. Consider transitioning to long-form reading or stepping away.`;
  } else {
    elements.wellnessStatusPill.textContent = 'Within Limits';
    elements.wellnessStatusPill.className = 'status-pill good';
    elements.wellnessAdviceText.textContent = `Great mindful balance today! You are well within your ${shortsLimitMin}m daily target across social platforms.`;
  }
}

// Trends Tab: Count Comparison (Deep vs Microcontent)
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

    // Deep content bar (Indigo)
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(gx + 2, padding.top + chartH - vH, barW, vH);

    // Microcontent bar (Coral)
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

// Trends Tab: Session Duration Distribution
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

  const p = appState.selectedPlatform;
  const isAll = p === 'all';

  (logs || []).forEach(l => {
    if (!isAll && l.platform && l.platform !== p) return;
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
    elements.habitInsightText.textContent = 'No social media activity recorded yet in this timeframe. Open any platform to begin tracking!';
    return;
  }

  const sPct = Math.round((sTime / (vTime + sTime)) * 100);

  if (sPct > 65) {
    elements.habitInsightText.textContent = `Short-form microcontent makes up ${sPct}% of your screen time. You are leaning heavily towards hyper-stimulating reels, shorts, and feeds. Consider replacing 15 minutes with deep long-form reading, documentation, or podcast listening!`;
  } else if (sPct < 25) {
    elements.habitInsightText.textContent = `Deep content and intentional interactions dominate your consumption (${100 - sPct}%). This indicates focused viewing and productive communication rather than passive algorithmic doomscrolling. Outstanding work!`;
  } else {
    elements.habitInsightText.textContent = `Harmonious balance: You enjoy a balanced mix of deep content (${100 - sPct}%) and brief microcontent updates (${sPct}%). Your digital habits are well distributed.`;
  }
}

// Activity & Watch Log History Table
function renderHistoryTable() {
  const { logs } = appState.data;
  const tbody = elements.historyTableBody;
  tbody.innerHTML = '';

  if (!logs || logs.length === 0) {
    elements.tableEmpty.style.display = 'block';
    return;
  }

  const selectedPlatform = appState.selectedPlatform;
  const isAll = selectedPlatform === 'all';

  // Filter logs
  const filtered = logs.filter(item => {
    // Platform match
    if (!isAll && item.platform && item.platform !== selectedPlatform) return false;

    // Type match
    if (appState.historyFilter !== 'all') {
      const isShorts = item.type === 'shorts' || item.type === 'reels' || item.type === 'tiktok' || item.type === 'spotlight';
      if (appState.historyFilter === 'shorts' && !isShorts) return false;
      if (appState.historyFilter === 'video' && isShorts) return false;
    }

    // Search match
    if (appState.searchQuery) {
      const matchTitle = (item.title || '').toLowerCase().includes(appState.searchQuery);
      const matchChannel = (item.channel || '').toLowerCase().includes(appState.searchQuery);
      const matchPlatform = (item.platform || '').toLowerCase().includes(appState.searchQuery);
      if (!matchTitle && !matchChannel && !matchPlatform) return false;
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

    const itemPlatform = item.platform || 'youtube';
    const cfg = PLATFORM_CONFIG[itemPlatform] || { name: itemPlatform, icon: '🌐', color: '#4F46E5' };
    const isMicro = item.type === 'shorts' || item.type === 'reels' || item.type === 'tiktok' || item.type === 'spotlight';

    // Build platform-appropriate link
    let itemUrl = '#';
    if (itemPlatform === 'youtube') {
      itemUrl = item.type === 'shorts'
        ? `https://www.youtube.com/shorts/${item.id}`
        : `https://www.youtube.com/watch?v=${item.id}`;
    } else if (itemPlatform === 'instagram') {
      itemUrl = `https://www.instagram.com/`;
    } else if (itemPlatform === 'tiktok') {
      itemUrl = `https://www.tiktok.com/`;
    } else if (itemPlatform === 'reddit') {
      itemUrl = `https://www.reddit.com/`;
    } else if (itemPlatform === 'discord') {
      itemUrl = `https://discord.com/app`;
    } else if (itemPlatform === 'x') {
      itemUrl = `https://x.com/`;
    } else if (itemPlatform === 'whatsapp') {
      itemUrl = `https://web.whatsapp.com/`;
    } else if (itemPlatform === 'linkedin') {
      itemUrl = `https://www.linkedin.com/feed/`;
    } else if (itemPlatform === 'pinterest') {
      itemUrl = `https://www.pinterest.com/`;
    } else if (itemPlatform === 'snapchat') {
      itemUrl = `https://www.snapchat.com/`;
    } else if (itemPlatform === 'facebook') {
      itemUrl = `https://www.facebook.com/`;
    } else if (itemPlatform === 'telegram') {
      itemUrl = `https://web.telegram.org/`;
    } else if (itemPlatform === 'wechat') {
      itemUrl = `https://web.wechat.com/`;
    }

    const dateStr = item.timestamp
      ? new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    tr.innerHTML = `
      <td>
        <span class="item-badge ${isMicro ? 'shorts' : 'video'}" style="border: 1px solid ${cfg.color}35; color: ${cfg.color}; background: ${cfg.color}12;">
          ${cfg.icon} ${item.type ? item.type.toUpperCase() : cfg.name}
        </span>
      </td>
      <td>
        <div class="item-title-box">
          <span class="item-title" title="${item.title || ''}">${item.title || `${cfg.name} Content`}</span>
          <span class="item-channel">
            <span style="font-weight: 600; color: ${cfg.color};">${cfg.name}</span> • ${item.channel || 'Activity'}
          </span>
        </div>
      </td>
      <td>
        <span class="item-watchtime">${formatDuration(item.seconds || 0)}</span>
      </td>
      <td>
        <span>${dateStr}</span>
      </td>
      <td>
        <a href="${itemUrl}" target="_blank" class="btn-open-yt" title="Open on ${cfg.name}">View</a>
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
    downloadFile(jsonStr, `social-consumption-backup-${getTodayKey()}.json`, 'application/json');
  });

  elements.btnDownloadBackup.addEventListener('click', () => {
    const jsonStr = JSON.stringify(appState.data, null, 2);
    downloadFile(jsonStr, `social-consumption-backup-${getTodayKey()}.json`, 'application/json');
  });

  // Export CSV
  elements.btnExportCsv.addEventListener('click', () => {
    const logs = appState.data.logs || [];
    let csv = 'Platform,Type,ID,Title,Channel,Seconds,Duration,Timestamp\n';
    logs.forEach(l => {
      const platform = l.platform || 'youtube';
      const title = `"${(l.title || '').replace(/"/g, '""')}"`;
      const channel = `"${(l.channel || '').replace(/"/g, '""')}"`;
      const time = new Date(l.timestamp).toISOString();
      csv += `${platform},${l.type},${l.id},${title},${channel},${l.seconds},${formatDuration(l.seconds)},${time}\n`;
    });
    downloadFile(csv, `social-consumption-history-${getTodayKey()}.csv`, 'text/csv');
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
    if (confirm('Are you sure you want to permanently clear all consumption history and statistics across all platforms?')) {
      await StorageService.clearAll();
      alert('All statistics have been reset.');
      await refreshData(true);
    }
  });

  // Load Sample Demo Data across all 13 platforms
  elements.btnDemoData.addEventListener('click', async () => {
    await populateRealisticDemoData();
    alert('Loaded 30 days of realistic sample data across 13 social media platforms! Explore the charts, platform filters, and watch log.');
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

        const dStat = historyMap[dateStr];
        ensureDayStructure(dStat, dateStr);

        if (isShorts) {
          shortsCount++;
          dStat.shortsCount++;
          dStat.shortsSeconds += 45;
          dStat.microcontentSeconds = (dStat.microcontentSeconds || 0) + 45;
          dStat.platforms.youtube.seconds += 45;
          dStat.platforms.youtube.subFeatures.shorts = (dStat.platforms.youtube.subFeatures.shorts || 0) + 45;
        } else {
          videoCount++;
          dStat.videoCount++;
          dStat.videoSeconds += 420;
          dStat.platforms.youtube.seconds += 420;
          dStat.platforms.youtube.subFeatures.video = (dStat.platforms.youtube.subFeatures.video || 0) + 420;
        }
        dStat.totalSocialSeconds = (dStat.totalSocialSeconds || 0) + (isShorts ? 45 : 420);

        if (logs.length < 500) {
          logs.push({
            id,
            platform: 'youtube',
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
      Successfully imported <strong>${videoCount}</strong> regular videos and <strong>${shortsCount}</strong> shorts into your YouTube analytics.
    `;

    await refreshData(true);
  } catch (err) {
    elements.takeoutResult.className = 'import-result error';
    elements.takeoutResult.innerHTML = `<strong>Import Error:</strong> ${err.message}`;
  }
}

// Populate 30 days of realistic multi-platform demo data across all 13 platforms
async function populateRealisticDemoData() {
  const sampleItems = [
    { platform: "youtube", type: "video", title: "Building a Modern Full-Stack App in 2026", channel: "Fireship", seconds: 540 },
    { platform: "youtube", type: "video", title: "The Hidden Physics Behind YouTube's Compression", channel: "Veritasium", seconds: 870 },
    { platform: "youtube", type: "shorts", title: "Insane CSS Trick you didn't know exists #shorts", channel: "Hyperplexed", seconds: 38 },
    { platform: "youtube", type: "shorts", title: "Wait for the plot twist at the end! ⚡", channel: "MrBeast Shorts", seconds: 44 },
    { platform: "instagram", type: "reels", title: "Minimalist Architecture & Light Design #reels", channel: "@designmilk", seconds: 42 },
    { platform: "instagram", type: "feed", title: "New Mechanical Keyboard Build & Typing Test", channel: "@keebs_daily", seconds: 160 },
    { platform: "tiktok", type: "tiktok", title: "CSS Scroll-driven animations in 30 seconds ⚡", channel: "@codetok", seconds: 34 },
    { platform: "tiktok", type: "tiktok", title: "Day in the life of an AI researcher in SF", channel: "@techguy", seconds: 48 },
    { platform: "reddit", type: "post", title: "r/webdev - What is your favorite CSS trick in 2026?", channel: "r/webdev", seconds: 320 },
    { platform: "reddit", type: "comments", title: "r/technology - Major AI Breakthrough Announced Today", channel: "r/technology", seconds: 450 },
    { platform: "discord", type: "chat", title: "#dev-chat - Next.js 16 Performance Benchmarks", channel: "React Core Discord", seconds: 410 },
    { platform: "discord", type: "voice", title: "Weekly Engineering Sync & Design Jam", channel: "Lil-Projects Voice", seconds: 1200 },
    { platform: "x", type: "timeline", title: "AI Research Timeline & Open Weights Announcements", channel: "@karpathy", seconds: 240 },
    { platform: "whatsapp", type: "chat", title: "Product Architecture & Sprint Planning Group", channel: "Core Team", seconds: 210 },
    { platform: "linkedin", type: "feed", title: "The Future of Distributed Systems and Modern Cloud", channel: "Martin Kleppmann", seconds: 340 },
    { platform: "pinterest", type: "pins", title: "Dark Mode Dashboard & Bento Grid UI Board", channel: "UI Design Hub", seconds: 290 },
    { platform: "snapchat", type: "spotlight", title: "AR Lens & 3D Interactive Trends #spotlight", channel: "Spotlight Creator", seconds: 35 },
    { platform: "facebook", type: "feed", title: "Open Source Developers Group - WebAssembly 2.0", channel: "Tech Innovators", seconds: 260 },
    { platform: "telegram", type: "channels", title: "Frontend News & Daily JavaScript Updates", channel: "Frontend Daily", seconds: 180 },
    { platform: "wechat", type: "moments", title: "AI Developers Group Chat & Moments", channel: "Tech Community", seconds: 190 }
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

    const dayStat = createEmptyDayStats(key);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    // Distribute time across platforms realistically
    let dayTotalSocial = 0;
    let dayMicro = 0;

    // YouTube
    const numVideos = isWeekend ? Math.floor(Math.random() * 5 + 4) : Math.floor(Math.random() * 4 + 2);
    const numShorts = isWeekend ? Math.floor(Math.random() * 25 + 15) : Math.floor(Math.random() * 15 + 8);
    const videoSec = numVideos * Math.floor(Math.random() * 300 + 400);
    const shortsSec = numShorts * Math.floor(Math.random() * 15 + 32);
    const browseSec = Math.floor(Math.random() * 300 + 100);

    dayStat.videoSeconds = videoSec;
    dayStat.videoCount = numVideos;
    dayStat.shortsSeconds = shortsSec;
    dayStat.shortsCount = numShorts;
    dayStat.shortsScrolled = numShorts + Math.floor(Math.random() * 10);
    dayStat.browseSeconds = browseSec;
    dayStat.searchCount = Math.floor(Math.random() * 5 + 1);

    dayStat.platforms.youtube = {
      seconds: videoSec + shortsSec + browseSec,
      count: numVideos + numShorts,
      subFeatures: { video: videoSec, shorts: shortsSec, browse: browseSec }
    };
    dayTotalSocial += dayStat.platforms.youtube.seconds;
    dayMicro += shortsSec;

    // Instagram
    const igReelsSec = Math.floor(Math.random() * 600 + 300);
    const igFeedSec = Math.floor(Math.random() * 400 + 200);
    dayStat.platforms.instagram = {
      seconds: igReelsSec + igFeedSec,
      count: Math.floor(Math.random() * 15 + 10),
      subFeatures: { reels: igReelsSec, feed: igFeedSec }
    };
    dayTotalSocial += dayStat.platforms.instagram.seconds;
    dayMicro += igReelsSec;

    // TikTok
    const ttSec = Math.floor(Math.random() * 900 + 400);
    dayStat.platforms.tiktok = {
      seconds: ttSec,
      count: Math.floor(ttSec / 30),
      subFeatures: { fyp: ttSec }
    };
    dayTotalSocial += ttSec;
    dayMicro += ttSec;

    // Reddit
    const redditSec = Math.floor(Math.random() * 700 + 250);
    dayStat.platforms.reddit = {
      seconds: redditSec,
      count: Math.floor(Math.random() * 8 + 3),
      subFeatures: { posts: Math.floor(redditSec * 0.6), comments: Math.floor(redditSec * 0.4) }
    };
    dayTotalSocial += redditSec;

    // Discord
    const discordSec = Math.floor(Math.random() * 1200 + 400);
    dayStat.platforms.discord = {
      seconds: discordSec,
      count: Math.floor(Math.random() * 20 + 5),
      subFeatures: { chat: Math.floor(discordSec * 0.7), voice: Math.floor(discordSec * 0.3) }
    };
    dayTotalSocial += discordSec;

    // X
    const xSec = Math.floor(Math.random() * 500 + 150);
    dayStat.platforms.x = {
      seconds: xSec,
      count: Math.floor(Math.random() * 10 + 4),
      subFeatures: { timeline: xSec }
    };
    dayTotalSocial += xSec;

    // WhatsApp
    const waSec = Math.floor(Math.random() * 600 + 200);
    dayStat.platforms.whatsapp = {
      seconds: waSec,
      count: Math.floor(Math.random() * 12 + 5),
      subFeatures: { chat: waSec }
    };
    dayTotalSocial += waSec;

    // LinkedIn
    const liSec = Math.floor(Math.random() * 400 + 100);
    dayStat.platforms.linkedin = {
      seconds: liSec,
      count: Math.floor(Math.random() * 6 + 2),
      subFeatures: { feed: liSec }
    };
    dayTotalSocial += liSec;

    // Pinterest
    const pinSec = Math.floor(Math.random() * 300 + 50);
    dayStat.platforms.pinterest = {
      seconds: pinSec,
      count: Math.floor(Math.random() * 5 + 1),
      subFeatures: { pins: pinSec }
    };
    dayTotalSocial += pinSec;

    // Snapchat
    const snapSec = Math.floor(Math.random() * 350 + 80);
    dayStat.platforms.snapchat = {
      seconds: snapSec,
      count: Math.floor(Math.random() * 7 + 2),
      subFeatures: { spotlight: Math.floor(snapSec * 0.7), stories: Math.floor(snapSec * 0.3) }
    };
    dayTotalSocial += snapSec;
    dayMicro += Math.floor(snapSec * 0.7);

    // Facebook
    const fbSec = Math.floor(Math.random() * 300 + 50);
    dayStat.platforms.facebook = {
      seconds: fbSec,
      count: Math.floor(Math.random() * 4 + 1),
      subFeatures: { feed: fbSec }
    };
    dayTotalSocial += fbSec;

    // Telegram
    const tgSec = Math.floor(Math.random() * 350 + 100);
    dayStat.platforms.telegram = {
      seconds: tgSec,
      count: Math.floor(Math.random() * 8 + 3),
      subFeatures: { channels: tgSec }
    };
    dayTotalSocial += tgSec;

    // WeChat
    const wcSec = Math.floor(Math.random() * 250 + 50);
    dayStat.platforms.wechat = {
      seconds: wcSec,
      count: Math.floor(Math.random() * 5 + 2),
      subFeatures: { moments: wcSec }
    };
    dayTotalSocial += wcSec;

    dayStat.totalSocialSeconds = dayTotalSocial;
    dayStat.microcontentSeconds = dayMicro;

    history[key] = dayStat;

    // Add sample log entries for recent days
    if (i <= 5) {
      for (let j = 0; j < Math.min(8, sampleItems.length); j++) {
        const item = sampleItems[(j + i * 3) % sampleItems.length];
        logs.unshift({
          id: 'demo_' + Math.random().toString(36).slice(2, 9),
          platform: item.platform,
          type: item.type,
          title: item.title,
          channel: item.channel,
          seconds: item.seconds,
          timestamp: new Date(d.getTime() + j * 3600000 + Math.random() * 1800000).getTime()
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
