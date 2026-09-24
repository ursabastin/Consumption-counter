/**
 * Social Media & Video Consumption Counter - Storage Utilities
 * Provides seamless cross-environment storage and multi-platform analytics tracking.
 */

export const PLATFORM_CONFIG = {
  youtube: { id: 'youtube', name: 'YouTube', icon: '🎬', color: '#FF0033', tag: 'Videos & Shorts' },
  instagram: { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C', tag: 'Reels & Feed' },
  tiktok: { id: 'tiktok', name: 'TikTok', icon: '⚡', color: '#111827', tag: 'Short Video Stream' },
  reddit: { id: 'reddit', name: 'Reddit', icon: '🟠', color: '#FF4500', tag: 'Communities & Posts' },
  x: { id: 'x', name: 'X / Twitter', icon: '🐦', color: '#0F1419', tag: 'Live Timeline' },
  discord: { id: 'discord', name: 'Discord', icon: '💬', color: '#5865F2', tag: 'Channels & Chat' },
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366', tag: 'Web Messaging' },
  linkedin: { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', tag: 'Professional Graph' },
  pinterest: { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#BD081C', tag: 'Visual Boards' },
  snapchat: { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#EAB308', tag: 'Spotlight & Stories' },
  facebook: { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2', tag: 'Feed & Reels' },
  telegram: { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0284C7', tag: 'Channels & Groups' },
  wechat: { id: 'wechat', name: 'WeChat', icon: '🟢', color: '#059669', tag: 'Messages & Moments' }
};

export const DEFAULT_SETTINGS = {
  showFloatingHud: true,
  trackBackgroundAudio: false,
  shortsDoomscrollAlert: true,
  shortsDailyLimitMinutes: 25,
  totalDailyLimitMinutes: 120,
  breakReminderMinutes: 30
};

export function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyDayStats(dateKey = getTodayKey()) {
  const platforms = {};
  for (const key of Object.keys(PLATFORM_CONFIG)) {
    platforms[key] = {
      seconds: 0,
      count: 0,
      subFeatures: {}
    };
  }

  return {
    date: dateKey,
    // YouTube direct compatibility fields
    videoSeconds: 0,
    videoCount: 0,
    shortsSeconds: 0,
    shortsCount: 0,
    shortsScrolled: 0,
    browseSeconds: 0,
    searchCount: 0,
    commentCount: 0,
    // Multi-platform aggregation
    totalSocialSeconds: 0,
    microcontentSeconds: 0, // Shorts + Reels + TikTok + Spotlight
    platforms
  };
}

export function ensureDayStructure(dayData, dateKey = getTodayKey()) {
  if (!dayData) return createEmptyDayStats(dateKey);
  if (!dayData.platforms) dayData.platforms = {};
  for (const key of Object.keys(PLATFORM_CONFIG)) {
    if (!dayData.platforms[key]) {
      dayData.platforms[key] = { seconds: 0, count: 0, subFeatures: {} };
    }
  }
  // Sync legacy YouTube
  if (dayData.videoSeconds || dayData.shortsSeconds) {
    dayData.platforms.youtube.seconds = (dayData.videoSeconds || 0) + (dayData.shortsSeconds || 0) + (dayData.browseSeconds || 0);
    dayData.platforms.youtube.count = (dayData.videoCount || 0) + (dayData.shortsCount || 0);
    dayData.platforms.youtube.subFeatures = {
      video: dayData.videoSeconds || 0,
      shorts: dayData.shortsSeconds || 0,
      browse: dayData.browseSeconds || 0
    };
  }
  return dayData;
}

export const StorageService = {
  isExtensionEnv() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  },

  async get(keys) {
    if (this.isExtensionEnv()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      });
    } else {
      const res = {};
      const targetKeys = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      for (const k of targetKeys) {
        const item = localStorage.getItem('ytcc_' + k);
        if (item !== null) {
          try {
            res[k] = JSON.parse(item);
          } catch {
            res[k] = item;
          }
        } else if (typeof keys === 'object' && keys !== null && !Array.isArray(keys) && k in keys) {
          res[k] = keys[k];
        }
      }
      return res;
    }
  },

  async set(data) {
    if (this.isExtensionEnv()) {
      return new Promise((resolve) => {
        chrome.storage.local.set(data, () => resolve(true));
      });
    } else {
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem('ytcc_' + k, JSON.stringify(v));
      }
      return true;
    }
  },

  async getAllData() {
    const keys = ['settings', 'todayDate', 'today', 'history', 'logs'];
    const res = await this.get(keys);
    const todayKey = getTodayKey();

    const settings = { ...DEFAULT_SETTINGS, ...(res.settings || {}) };
    let today = ensureDayStructure(res.today, todayKey);
    const history = res.history || {};
    const logs = res.logs || [];

    // Ensure all history entries have platforms structure
    for (const dKey of Object.keys(history)) {
      history[dKey] = ensureDayStructure(history[dKey], dKey);
    }

    // Check if new day
    if (!res.today || res.todayDate !== todayKey) {
      if (res.today && res.todayDate) {
        history[res.todayDate] = ensureDayStructure(res.today, res.todayDate);
      }
      today = createEmptyDayStats(todayKey);
      await this.set({
        todayDate: todayKey,
        today,
        history
      });
    }

    return {
      settings,
      todayDate: todayKey,
      today,
      history,
      logs
    };
  },

  async recordHeartbeat({ platform = 'youtube', type = 'browse', seconds = 1, itemData = null }) {
    const data = await this.getAllData();
    const today = ensureDayStructure(data.today, data.todayDate);
    const logs = data.logs;

    // Platform-specific increment
    if (!today.platforms[platform]) {
      today.platforms[platform] = { seconds: 0, count: 0, subFeatures: {} };
    }

    const pData = today.platforms[platform];
    pData.seconds = (pData.seconds || 0) + seconds;
    pData.subFeatures[type] = (pData.subFeatures[type] || 0) + seconds;

    // Overall total
    today.totalSocialSeconds = (today.totalSocialSeconds || 0) + seconds;

    // Is it short-form microcontent?
    const isMicro = (type === 'shorts' || type === 'reels' || platform === 'tiktok' || type === 'spotlight');
    if (isMicro) {
      today.microcontentSeconds = (today.microcontentSeconds || 0) + seconds;
    }

    // If YouTube, maintain legacy fields
    if (platform === 'youtube') {
      if (type === 'video') today.videoSeconds = (today.videoSeconds || 0) + seconds;
      else if (type === 'shorts') today.shortsSeconds = (today.shortsSeconds || 0) + seconds;
      else if (type === 'browse') today.browseSeconds = (today.browseSeconds || 0) + seconds;
    }

    // Recent items log
    if (itemData && itemData.id) {
      const existing = logs.find(l => l.platform === platform && l.id === itemData.id && (Date.now() - l.timestamp < 1000 * 60 * 60 * 4));
      if (existing) {
        existing.seconds = (existing.seconds || 0) + seconds;
        existing.lastSeen = Date.now();
      } else {
        logs.unshift({
          platform,
          id: itemData.id,
          type: itemData.type || type,
          title: itemData.title || `${PLATFORM_CONFIG[platform]?.name || platform} Activity`,
          channel: itemData.channel || PLATFORM_CONFIG[platform]?.name,
          seconds: seconds,
          timestamp: Date.now(),
          lastSeen: Date.now()
        });
        if (logs.length > 600) logs.pop();
      }
    }

    await this.set({ today, logs });
    return { today, settings: data.settings };
  },

  async recordViewCount({ platform = 'youtube', type, itemData }) {
    const data = await this.getAllData();
    const today = ensureDayStructure(data.today, data.todayDate);

    if (!today.platforms[platform]) {
      today.platforms[platform] = { seconds: 0, count: 0, subFeatures: {} };
    }
    today.platforms[platform].count = (today.platforms[platform].count || 0) + 1;

    // YouTube direct
    if (platform === 'youtube') {
      if (type === 'video') today.videoCount = (today.videoCount || 0) + 1;
      else if (type === 'shorts') today.shortsCount = (today.shortsCount || 0) + 1;
    }

    await this.set({ today });
    return today;
  },

  async recordFeatureAction(featureName, count = 1, platform = 'youtube') {
    const data = await this.getAllData();
    const today = ensureDayStructure(data.today, data.todayDate);

    if (platform === 'youtube') {
      if (featureName === 'search') today.searchCount = (today.searchCount || 0) + count;
      else if (featureName === 'comment') today.commentCount = (today.commentCount || 0) + count;
      else if (featureName === 'short_scroll') today.shortsScrolled = (today.shortsScrolled || 0) + count;
    }

    await this.set({ today });
    return today;
  },

  async updateSettings(newSettings) {
    const data = await this.getAllData();
    const settings = { ...data.settings, ...newSettings };
    await this.set({ settings });
    return settings;
  },

  async clearAll() {
    if (this.isExtensionEnv()) {
      await new Promise(r => chrome.storage.local.clear(r));
    } else {
      for (const k of ['settings', 'todayDate', 'today', 'history', 'logs']) {
        localStorage.removeItem('ytcc_' + k);
      }
    }
  }
};

export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatTimePrecise(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
