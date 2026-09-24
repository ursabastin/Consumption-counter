/**
 * Social Media & Video Consumption Counter - Universal Content Script
 * Tracks time & features across YouTube, Instagram, TikTok, Reddit, X, Discord, WhatsApp, LinkedIn, and more.
 */

(() => {
  if (window.__smcc_injected) return;
  window.__smcc_injected = true;

  const currentPlatform = detectPlatform(location.hostname);
  if (!currentPlatform) return;

  console.log(`[Consumption Counter] Active tracker loaded on ${currentPlatform.name}.`);

  let currentUrl = location.href;
  let currentContentType = detectFeatureType(currentPlatform.id, location.pathname);
  let currentItemId = extractItemId(location.href, currentPlatform.id, currentContentType);
  let currentItemSeconds = 0;
  let viewCountRecordedForCurrent = false;

  let bufferedSeconds = 0;
  let cachedTodayStats = null;
  let cachedSettings = {
    showFloatingHud: true,
    trackBackgroundAudio: false,
    shortsDoomscrollAlert: true,
    shortsDailyLimitMinutes: 25,
    totalDailyLimitMinutes: 120
  };

  let hudRoot = null;
  let hudContainer = null;
  let isMinimized = false;

  function detectPlatform(hostname) {
    const host = hostname.toLowerCase();
    if (host.includes('youtube.com')) return { id: 'youtube', name: 'YouTube', icon: '🎬', color: '#FF0033' };
    if (host.includes('instagram.com')) return { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' };
    if (host.includes('tiktok.com')) return { id: 'tiktok', name: 'TikTok', icon: '⚡', color: '#111827' };
    if (host.includes('reddit.com')) return { id: 'reddit', name: 'Reddit', icon: '🟠', color: '#FF4500' };
    if (host.includes('x.com') || host.includes('twitter.com')) return { id: 'x', name: 'X', icon: '🐦', color: '#0F1419' };
    if (host.includes('discord.com')) return { id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2' };
    if (host.includes('whatsapp.com')) return { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366' };
    if (host.includes('linkedin.com')) return { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' };
    if (host.includes('pinterest.com')) return { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#BD081C' };
    if (host.includes('snapchat.com')) return { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#EAB308' };
    if (host.includes('facebook.com')) return { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2' };
    if (host.includes('telegram.org')) return { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0284C7' };
    if (host.includes('wechat.com') || host.includes('qq.com')) return { id: 'wechat', name: 'WeChat', icon: '🟢', color: '#059669' };
    return null;
  }

  function detectFeatureType(platformId, pathname) {
    const p = pathname.toLowerCase();
    switch (platformId) {
      case 'youtube':
        if (p.startsWith('/shorts/')) return 'shorts';
        if (p.startsWith('/watch')) return 'video';
        if (p.startsWith('/results')) return 'search';
        return 'browse';

      case 'instagram':
        if (p.includes('/reels/') || p.includes('/reel/')) return 'reels';
        if (p.includes('/stories/')) return 'stories';
        if (p.includes('/explore/')) return 'explore';
        if (p.includes('/direct/')) return 'messages';
        return 'feed';

      case 'tiktok':
        if (p.includes('/live')) return 'live';
        return 'feed'; // Short-form video loop

      case 'facebook':
        if (p.includes('/reel/') || p.includes('/watch')) return 'reels';
        if (p.includes('/groups/')) return 'groups';
        if (p.includes('/marketplace/')) return 'marketplace';
        return 'feed';

      case 'x':
        if (p.includes('/status/')) return 'post_detail';
        if (p.includes('/search')) return 'search';
        if (p.includes('/explore')) return 'explore';
        return 'timeline';

      case 'reddit':
        if (p.includes('/comments/')) return 'post_discussion';
        if (p.startsWith('/r/')) return 'subreddit';
        if (p.includes('/search')) return 'search';
        return 'feed';

      case 'linkedin':
        if (p.includes('/jobs/')) return 'jobs';
        if (p.includes('/messaging/')) return 'messages';
        if (p.includes('/mynetwork/')) return 'network';
        return 'feed';

      case 'pinterest':
        if (p.includes('/pin/')) return 'pin_detail';
        if (p.includes('/search')) return 'search';
        return 'board_feed';

      case 'snapchat':
        if (p.includes('/spotlight')) return 'spotlight';
        if (p.includes('/stories')) return 'stories';
        return 'chat';

      case 'discord':
        if (document.querySelector('[aria-label*="Disconnect"]') || document.querySelector('[class*="connected-"]')) {
          return 'voice';
        }
        return 'chat';

      case 'whatsapp':
      case 'telegram':
      case 'wechat':
        return 'chat';

      default:
        return 'feed';
    }
  }

  function extractItemId(urlStr, platformId, type) {
    try {
      const url = new URL(urlStr);
      if (platformId === 'youtube') {
        if (type === 'shorts') return url.pathname.split('/')[2] || 'short';
        if (type === 'video') return url.searchParams.get('v') || 'video';
      } else if (platformId === 'instagram') {
        if (type === 'reels') return url.pathname.split('/')[2] || 'reel';
      } else if (platformId === 'reddit') {
        if (type === 'post_discussion') return url.pathname.split('/')[4] || 'post';
      } else if (platformId === 'x') {
        if (type === 'post_detail') return url.pathname.split('/')[3] || 'tweet';
      }
    } catch {}
    return `${platformId}_${type}`;
  }

  function getItemMetadata() {
    let title = document.title || `${currentPlatform.name} Activity`;
    title = title.replace(/\s*-\s*YouTube|\s*\|\s*Instagram|\s*\/ X|\s*: Reddit/gi, '').trim();

    return {
      platform: currentPlatform.id,
      id: currentItemId,
      type: currentContentType,
      title: title.slice(0, 100),
      channel: currentPlatform.name
    };
  }

  function isUserEngaged() {
    const isVisible = cachedSettings.trackBackgroundAudio || document.visibilityState === 'visible';
    if (!isVisible) return false;

    // For video-centric platforms, verify video playback
    if (['youtube', 'tiktok'].includes(currentPlatform.id) || currentContentType === 'reels') {
      const videos = document.querySelectorAll('video');
      for (const v of videos) {
        if (!v.paused && !v.ended && v.readyState >= 2 && v.currentTime > 0) {
          return true;
        }
      }
      // If browsing feed/comments without video, count as visible browsing
      return document.hasFocus();
    }

    // For interactive/text/messaging platforms (Discord, WhatsApp, Reddit, X, LinkedIn)
    return document.hasFocus() || document.visibilityState === 'visible';
  }

  // Safe messaging helper to gracefully handle extension updates and invalidated context
  function safeSendMessage(message, callback) {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (res) => {
        const err = chrome.runtime.lastError;
        if (err) return;
        if (callback && res) {
          callback(res);
        }
      });
    } catch {
      // Extension context invalidated
    }
  }

  // Send accumulated heartbeat to background script
  function flushHeartbeat() {
    if (bufferedSeconds <= 0) return;

    const secondsToSend = bufferedSeconds;
    bufferedSeconds = 0;

    const itemData = getItemMetadata();

    safeSendMessage({
      type: 'HEARTBEAT',
      platform: currentPlatform.id,
      contentType: currentContentType,
      seconds: secondsToSend,
      itemData
    }, (res) => {
      if (res && res.today) {
        cachedTodayStats = res.today;
        updateHudUI();
      }
    });
  }

  function recordViewIfEligible() {
    if (viewCountRecordedForCurrent) return;

    const isVideoEligible = (currentContentType === 'video' && currentItemSeconds >= 5);
    const isShortEligible = ((currentContentType === 'shorts' || currentContentType === 'reels' || currentPlatform.id === 'tiktok') && currentItemSeconds >= 4);

    if (isVideoEligible || isShortEligible) {
      viewCountRecordedForCurrent = true;
      const itemData = getItemMetadata();
      safeSendMessage({
        type: 'RECORD_VIEW',
        platform: currentPlatform.id,
        contentType: currentContentType,
        itemData
      }, (res) => {
        if (res && res.today) {
          cachedTodayStats = res.today;
          updateHudUI();
        }
      });
    }
  }

  // Handle URL navigation transition
  function handleUrlChange(newUrl) {
    if (newUrl === currentUrl) return;

    if (currentContentType === 'shorts' && !viewCountRecordedForCurrent && currentItemSeconds >= 1) {
      safeSendMessage({
        type: 'FEATURE_ACTION',
        platform: currentPlatform.id,
        featureName: 'short_scroll',
        count: 1
      });
    }

    flushHeartbeat();

    currentUrl = newUrl;
    currentContentType = detectFeatureType(currentPlatform.id, location.pathname);
    currentItemId = extractItemId(newUrl, currentPlatform.id, currentContentType);
    currentItemSeconds = 0;
    viewCountRecordedForCurrent = false;

    if (currentContentType === 'search') {
      safeSendMessage({
        type: 'FEATURE_ACTION',
        platform: currentPlatform.id,
        featureName: 'search',
        count: 1
      });
    }

    updateHudUI();
  }

  // Periodic 1-second watch loop
  const trackerInterval = setInterval(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      clearInterval(trackerInterval);
      return;
    }

    if (location.href !== currentUrl) {
      handleUrlChange(location.href);
    }

    const engaged = isUserEngaged();

    if (engaged) {
      bufferedSeconds++;
      currentItemSeconds++;
      recordViewIfEligible();

      if (bufferedSeconds >= 3) {
        flushHeartbeat();
      }
    }

    updateHudLiveCounter();
  }, 1000);

  window.addEventListener('beforeunload', () => {
    flushHeartbeat();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushHeartbeat();
    }
  });

  // SPA navigation listeners
  window.addEventListener('yt-navigate-finish', () => handleUrlChange(location.href));
  window.addEventListener('popstate', () => handleUrlChange(location.href));

  // Floating Capsule HUD Setup
  function setupHud() {
    if (document.getElementById('ytcc-hud-root')) return;

    hudRoot = document.createElement('div');
    hudRoot.id = 'ytcc-hud-root';

    const savedPos = localStorage.getItem('ytcc_hud_position');
    if (savedPos) {
      try {
        const { x, y } = JSON.parse(savedPos);
        hudRoot.style.left = `${x}px`;
        hudRoot.style.top = `${y}px`;
        hudRoot.style.bottom = 'auto';
        hudRoot.style.right = 'auto';
      } catch {}
    }

    hudRoot.innerHTML = `
      <div id="ytcc-hud-container" title="${currentPlatform.name} Consumption Counter - Drag to reposition | Double-click to collapse">
        <div class="ytcc-glow-backdrop"></div>
        <div class="ytcc-pulse-dot" id="ytcc-dot"></div>
        <div class="ytcc-current-badge ${isMicrocontent(currentContentType) ? 'shorts' : ''}" id="ytcc-current-badge">
          <span id="ytcc-type-icon">${currentPlatform.icon}</span>
          <span id="ytcc-item-timer">00:00</span>
        </div>
        <div class="ytcc-counters">
          <div class="ytcc-counter-item">
            <span class="label">${currentPlatform.name}</span>
            <span class="value" id="ytcc-stat-platform">0m</span>
          </div>
          <div class="ytcc-divider"></div>
          <div class="ytcc-counter-item">
            <span class="label">Total Social</span>
            <span class="value" id="ytcc-stat-total">0m</span>
          </div>
        </div>
        <div class="ytcc-hud-actions">
          <button class="ytcc-icon-btn" id="ytcc-btn-dash" title="Open Full Dashboard">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          </button>
          <button class="ytcc-icon-btn" id="ytcc-btn-minimize" title="Minimize / Expand">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(hudRoot);
    hudContainer = document.getElementById('ytcc-hud-container');

    makeDraggable(hudRoot, hudContainer);

    document.getElementById('ytcc-btn-dash').addEventListener('click', (e) => {
      e.stopPropagation();
      safeSendMessage({ type: 'OPEN_DASHBOARD' });
    });

    document.getElementById('ytcc-btn-minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      isMinimized = !isMinimized;
      hudContainer.classList.toggle('minimized', isMinimized);
    });

    hudContainer.addEventListener('dblclick', () => {
      isMinimized = !isMinimized;
      hudContainer.classList.toggle('minimized', isMinimized);
    });
  }

  function isMicrocontent(type) {
    return ['shorts', 'reels', 'spotlight'].includes(type) || currentPlatform.id === 'tiktok';
  }

  function makeDraggable(rootEl, handleEl) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    handleEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = rootEl.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      rootEl.style.bottom = 'auto';
      rootEl.style.right = 'auto';
      rootEl.style.left = `${initialLeft}px`;
      rootEl.style.top = `${initialTop}px`;

      const onMouseMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newLeft = Math.max(10, Math.min(window.innerWidth - 150, initialLeft + dx));
        const newTop = Math.max(10, Math.min(window.innerHeight - 60, initialTop + dy));

        rootEl.style.left = `${newLeft}px`;
        rootEl.style.top = `${newTop}px`;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const rect = rootEl.getBoundingClientRect();
        localStorage.setItem('ytcc_hud_position', JSON.stringify({ x: rect.left, y: rect.top }));
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  function updateHudLiveCounter() {
    const timerEl = document.getElementById('ytcc-item-timer');
    if (timerEl) {
      const mins = Math.floor(currentItemSeconds / 60);
      const secs = currentItemSeconds % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  function updateHudUI() {
    if (!cachedSettings.showFloatingHud) {
      if (hudRoot) hudRoot.style.display = 'none';
      return;
    } else if (hudRoot) {
      hudRoot.style.display = 'block';
    }

    const badge = document.getElementById('ytcc-current-badge');
    const typeIcon = document.getElementById('ytcc-type-icon');
    if (badge && typeIcon) {
      typeIcon.textContent = currentPlatform.icon;
      badge.className = isMicrocontent(currentContentType) ? 'ytcc-current-badge shorts' : 'ytcc-current-badge';
    }

    if (!cachedTodayStats) return;

    const platEl = document.getElementById('ytcc-stat-platform');
    const totalEl = document.getElementById('ytcc-stat-total');
    const dotEl = document.getElementById('ytcc-dot');

    const pSec = (cachedTodayStats.platforms && cachedTodayStats.platforms[currentPlatform.id])
      ? (cachedTodayStats.platforms[currentPlatform.id].seconds || 0)
      : (currentPlatform.id === 'youtube' ? ((cachedTodayStats.videoSeconds || 0) + (cachedTodayStats.shortsSeconds || 0)) : 0);

    const totalSec = cachedTodayStats.totalSocialSeconds || ((cachedTodayStats.videoSeconds || 0) + (cachedTodayStats.shortsSeconds || 0));

    if (platEl) {
      const pMins = Math.floor(pSec / 60);
      platEl.textContent = `${pMins}m`;
    }

    if (totalEl) {
      const tMins = Math.floor(totalSec / 60);
      totalEl.textContent = tMins >= 60 ? `${(tMins / 60).toFixed(1)}h` : `${tMins}m`;
    }

    // Doomscroll Status Dot Alert
    const microLimit = cachedSettings.shortsDailyLimitMinutes || 25;
    const microMins = Math.floor((cachedTodayStats.microcontentSeconds || (cachedTodayStats.shortsSeconds || 0)) / 60);
    if (dotEl) {
      if (microMins >= microLimit) {
        dotEl.className = 'ytcc-pulse-dot danger';
      } else if (microMins >= microLimit * 0.8) {
        dotEl.className = 'ytcc-pulse-dot warning';
      } else {
        dotEl.className = 'ytcc-pulse-dot';
      }
    }
  }

  // Initial load
  safeSendMessage({ type: 'GET_DATA' }, (res) => {
    if (res && res.data) {
      cachedTodayStats = res.data.today;
      cachedSettings = { ...cachedSettings, ...(res.data.settings || {}) };
      if (cachedSettings.showFloatingHud) {
        setupHud();
        updateHudUI();
      }
    }
  });

  // Listen for storage changes
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.today) {
        cachedTodayStats = changes.today.newValue;
        updateHudUI();
      }
      if (changes.settings) {
        cachedSettings = { ...cachedSettings, ...changes.settings.newValue };
        if (!cachedSettings.showFloatingHud && hudRoot) {
          hudRoot.style.display = 'none';
        } else if (cachedSettings.showFloatingHud) {
          if (!hudRoot) setupHud();
          hudRoot.style.display = 'block';
        }
        updateHudUI();
      }
    });
  }

})();
