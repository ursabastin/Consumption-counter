/**
 * YouTube Consumption Counter - Content Script
 * Tracks video & shorts consumption, features usage, and renders the floating HUD.
 */

(() => {
  // Prevent duplicate execution
  if (window.__ytcc_injected) return;
  window.__ytcc_injected = true;

  console.log('[YT Consumption Counter] Content script loaded on YouTube.');

  let currentUrl = location.href;
  let currentContentType = detectContentType(location.pathname);
  let currentItemId = extractItemId(location.href, currentContentType);
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

  function detectContentType(pathname) {
    if (pathname.startsWith('/shorts/')) return 'shorts';
    if (pathname.startsWith('/watch')) return 'video';
    if (pathname.startsWith('/results')) return 'search';
    return 'browse';
  }

  function extractItemId(urlStr, type) {
    try {
      const url = new URL(urlStr);
      if (type === 'shorts') {
        const parts = url.pathname.split('/');
        return parts[2] || 'unknown_short';
      }
      if (type === 'video') {
        return url.searchParams.get('v') || 'unknown_video';
      }
      if (type === 'search') {
        return url.searchParams.get('search_query') || 'search';
      }
    } catch {
      // fallback
    }
    return 'page';
  }

  function getItemMetadata() {
    let title = '';
    let channel = '';

    if (currentContentType === 'shorts') {
      const activeReel = document.querySelector('ytd-reel-video-renderer[is-active]');
      if (activeReel) {
        title = activeReel.querySelector('#overlay yt-formatted-string')?.textContent || '';
        channel = activeReel.querySelector('#channel-name a')?.textContent || '';
      }
    } else if (currentContentType === 'video') {
      title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
              document.querySelector('h1.title yt-formatted-string')?.textContent || '';
      channel = document.querySelector('#upload-info #channel-name a')?.textContent ||
                document.querySelector('#owner #channel-name')?.textContent || '';
    }

    if (!title) {
      title = document.title.replace(' - YouTube', '').trim() || (currentContentType === 'shorts' ? 'YouTube Short' : 'YouTube Video');
    }

    return {
      id: currentItemId,
      type: currentContentType,
      title: title.slice(0, 120),
      channel: channel.trim() || 'YouTube Creator'
    };
  }

  function isMediaPlaying() {
    const isVisible = cachedSettings.trackBackgroundAudio || document.visibilityState === 'visible';
    if (!isVisible) return false;

    // Find active video element
    const videos = document.querySelectorAll('video');
    for (const v of videos) {
      if (!v.paused && !v.ended && v.readyState >= 2 && v.currentTime > 0) {
        return true;
      }
    }
    return false;
  }

  // Safe messaging helper to gracefully handle extension updates and invalidated context
  function safeSendMessage(message, callback) {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (res) => {
        // Accessing chrome.runtime.lastError clears the unhandled error warning
        const err = chrome.runtime.lastError;
        if (err) return;
        if (callback && res) {
          callback(res);
        }
      });
    } catch {
      // Extension context invalidated (e.g. extension was reloaded in developer mode)
    }
  }

  // Send accumulated heartbeat to background script
  function flushHeartbeat() {
    if (bufferedSeconds <= 0) return;

    const secondsToSend = bufferedSeconds;
    bufferedSeconds = 0;

    const itemData = (currentContentType === 'video' || currentContentType === 'shorts')
      ? getItemMetadata()
      : null;

    safeSendMessage({
      type: 'HEARTBEAT',
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
    const isShortEligible = (currentContentType === 'shorts' && currentItemSeconds >= 4);

    if (isVideoEligible || isShortEligible) {
      viewCountRecordedForCurrent = true;
      const itemData = getItemMetadata();
      safeSendMessage({
        type: 'RECORD_VIEW',
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

    // If leaving a short early without reaching 4s, record rapid short scroll
    if (currentContentType === 'shorts' && !viewCountRecordedForCurrent && currentItemSeconds >= 1) {
      safeSendMessage({
        type: 'FEATURE_ACTION',
        featureName: 'short_scroll',
        count: 1
      });
    }

    // Flush pending time
    flushHeartbeat();

    // Reset item tracking
    currentUrl = newUrl;
    currentContentType = detectContentType(location.pathname);
    currentItemId = extractItemId(newUrl, currentContentType);
    currentItemSeconds = 0;
    viewCountRecordedForCurrent = false;

    // Track search query feature
    if (currentContentType === 'search') {
      safeSendMessage({
        type: 'FEATURE_ACTION',
        featureName: 'search',
        count: 1
      });
    }

    updateHudUI();
  }

  // Periodic 1-second watch loop
  const trackerInterval = setInterval(() => {
    // Cleanly stop execution if extension was reloaded or disabled
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
      clearInterval(trackerInterval);
      return;
    }

    // Check for SPA URL change
    if (location.href !== currentUrl) {
      handleUrlChange(location.href);
    }

    const playing = isMediaPlaying();

    if (playing) {
      bufferedSeconds++;
      currentItemSeconds++;
      recordViewIfEligible();

      // Flush every 3 seconds
      if (bufferedSeconds >= 3) {
        flushHeartbeat();
      }
    } else if (currentContentType === 'browse' && document.visibilityState === 'visible') {
      // Browsing home/feed without video playing
      bufferedSeconds++;
      if (bufferedSeconds >= 5) {
        flushHeartbeat();
      }
    }

    updateHudLiveCounter();
  }, 1000);

  // Send before tab closes or navigates away
  window.addEventListener('beforeunload', () => {
    flushHeartbeat();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushHeartbeat();
    }
  });

  // YouTube navigation event listeners
  window.addEventListener('yt-navigate-finish', () => {
    handleUrlChange(location.href);
  });
  window.addEventListener('popstate', () => {
    handleUrlChange(location.href);
  });

  // Track comment activity
  document.addEventListener('focusin', (e) => {
    if (e.target && (e.target.id === 'contenteditable-root' || e.target.closest('#comment-input') || e.target.closest('#commentbox'))) {
      if (!window.__ytcc_comment_tracked) {
        window.__ytcc_comment_tracked = true;
        safeSendMessage({
          type: 'FEATURE_ACTION',
          featureName: 'comment',
          count: 1
        });
        setTimeout(() => { window.__ytcc_comment_tracked = false; }, 30000);
      }
    }
  }, true);

  // Setup HUD
  function setupHud() {
    if (document.getElementById('ytcc-hud-root')) return;

    hudRoot = document.createElement('div');
    hudRoot.id = 'ytcc-hud-root';

    // Restore saved position
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
      <div id="ytcc-hud-container" title="YouTube Consumption Counter - Drag to reposition | Double-click to collapse">
        <div class="ytcc-glow-backdrop"></div>
        <div class="ytcc-pulse-dot" id="ytcc-dot"></div>
        <div class="ytcc-current-badge ${currentContentType === 'shorts' ? 'shorts' : ''}" id="ytcc-current-badge">
          <span id="ytcc-type-icon">${currentContentType === 'shorts' ? '⚡' : '🎬'}</span>
          <span id="ytcc-item-timer">00:00</span>
        </div>
        <div class="ytcc-counters">
          <div class="ytcc-counter-item">
            <span class="label">Videos</span>
            <span class="value" id="ytcc-stat-videos">0 (0m)</span>
          </div>
          <div class="ytcc-divider"></div>
          <div class="ytcc-counter-item">
            <span class="label">Shorts</span>
            <span class="value" id="ytcc-stat-shorts">0 (0m)</span>
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

    // Dragging logic
    makeDraggable(hudRoot, hudContainer);

    // Buttons (Dashboard and Minimize only - No cross/remove button)
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

        // Save position
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
      if (currentContentType === 'shorts') {
        badge.className = 'ytcc-current-badge shorts';
        typeIcon.textContent = '⚡';
      } else {
        badge.className = 'ytcc-current-badge';
        typeIcon.textContent = '🎬';
      }
    }

    if (!cachedTodayStats) return;

    const vidEl = document.getElementById('ytcc-stat-videos');
    const shortsEl = document.getElementById('ytcc-stat-shorts');
    const dotEl = document.getElementById('ytcc-dot');

    if (vidEl) {
      const vMins = Math.floor((cachedTodayStats.videoSeconds || 0) / 60);
      vidEl.textContent = `${cachedTodayStats.videoCount || 0} (${vMins}m)`;
    }

    if (shortsEl) {
      const sMins = Math.floor((cachedTodayStats.shortsSeconds || 0) / 60);
      shortsEl.textContent = `${cachedTodayStats.shortsCount || 0} (${sMins}m)`;

      // Status dot alert
      const shortsLimit = cachedSettings.shortsDailyLimitMinutes || 25;
      if (dotEl) {
        if (sMins >= shortsLimit) {
          dotEl.className = 'ytcc-pulse-dot danger';
        } else if (sMins >= shortsLimit * 0.8) {
          dotEl.className = 'ytcc-pulse-dot warning';
        } else {
          dotEl.className = 'ytcc-pulse-dot';
        }
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

  // Listen for storage changes from popup or options page
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
