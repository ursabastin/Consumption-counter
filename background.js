/**
 * Social Media & Video Consumption Counter - Background Service Worker
 * Handles alarm reminders, badge indicators, storage synchronization, and notifications across all platforms.
 */

import { StorageService, formatDuration, getTodayKey, PLATFORM_CONFIG } from './utils/storage.js';

// Setup on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Consumption Counter] Extension installed:', details.reason);
  const data = await StorageService.getAllData();
  updateBadge(data.today, data.settings);

  // Setup 1-minute alarm to sync & check daily roll-over
  chrome.alarms.create('checkDailyRoll', { periodInMinutes: 1 });
});

// Alarm listener
if (chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'checkDailyRoll') {
      const data = await StorageService.getAllData();
      updateBadge(data.today, data.settings);
    }
  });
}

// Update toolbar action badge
function updateBadge(today, settings) {
  if (!today) return;
  const totalSeconds = today.totalSocialSeconds || ((today.videoSeconds || 0) + (today.shortsSeconds || 0));
  const totalMinutes = Math.floor(totalSeconds / 60);

  let text = '';
  if (totalMinutes > 0) {
    if (totalMinutes >= 60) {
      text = `${(totalMinutes / 60).toFixed(1)}h`;
    } else {
      text = `${totalMinutes}m`;
    }
  }

  chrome.action.setBadgeText({ text });

  // Badge color based on microcontent limits (Shorts, Reels, TikTok)
  const microLimitMinutes = settings?.shortsDailyLimitMinutes || 25;
  const microSeconds = today.microcontentSeconds || (today.shortsSeconds || 0);
  const microMinutes = Math.floor(microSeconds / 60);

  if (microMinutes >= microLimitMinutes) {
    chrome.action.setBadgeBackgroundColor({ color: '#E11D48' }); // Rose alert
  } else if (microMinutes >= microLimitMinutes * 0.8) {
    chrome.action.setBadgeBackgroundColor({ color: '#D97706' }); // Warm amber warning
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#4F46E5' }); // Grounded indigo
  }
}

// Track notification cooldowns to avoid spamming
let lastNotifTime = 0;

async function checkNotificationLimits(today, settings) {
  if (!settings?.shortsDoomscrollAlert) return;
  const now = Date.now();
  if (now - lastNotifTime < 1000 * 60 * 15) return; // 15 minute cooldown

  const microLimit = settings.shortsDailyLimitMinutes || 25;
  const microSeconds = today.microcontentSeconds || (today.shortsSeconds || 0);
  const microMinutes = Math.floor(microSeconds / 60);

  if (microMinutes >= microLimit) {
    lastNotifTime = now;
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '⚠️ Short-Form Media Limit Reached!',
        message: `You've spent ${microMinutes} minutes on Shorts/Reels/TikTok today (limit is ${microLimit}m). Time for a mindful break!`,
        priority: 2
      });
    }
  }
}

// Message handler from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'HEARTBEAT') {
        const { today, settings } = await StorageService.recordHeartbeat({
          platform: message.platform || 'youtube',
          type: message.contentType,
          seconds: message.seconds || 1,
          itemData: message.itemData
        });
        updateBadge(today, settings);
        await checkNotificationLimits(today, settings);
        sendResponse({ success: true, today });
      } else if (message.type === 'RECORD_VIEW') {
        const today = await StorageService.recordViewCount({
          platform: message.platform || 'youtube',
          type: message.contentType,
          itemData: message.itemData
        });
        sendResponse({ success: true, today });
      } else if (message.type === 'FEATURE_ACTION') {
        const today = await StorageService.recordFeatureAction(
          message.featureName,
          message.count || 1,
          message.platform || 'youtube'
        );
        sendResponse({ success: true, today });
      } else if (message.type === 'GET_DATA') {
        const data = await StorageService.getAllData();
        sendResponse({ success: true, data });
      } else if (message.type === 'OPEN_DASHBOARD') {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
        sendResponse({ success: true });
      }
    } catch (err) {
      console.error('[Consumption Counter] Error handling message:', err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true;
});
