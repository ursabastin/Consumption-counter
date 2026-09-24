/**
 * YouTube Consumption Counter - Storage Utilities
 * Provides seamless cross-environment storage (chrome.storage.local with localStorage fallback)
 */

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
  return {
    date: dateKey,
    videoSeconds: 0,
    videoCount: 0,
    shortsSeconds: 0,
    shortsCount: 0,
    shortsScrolled: 0,
    browseSeconds: 0,
    searchCount: 0,
    commentCount: 0
  };
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
      // LocalStorage fallback for standalone web app demo
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

    // Default settings check
    const settings = { ...DEFAULT_SETTINGS, ...(res.settings || {}) };

    let today = res.today;
    const history = res.history || {};
    const logs = res.logs || [];

    // Check if new day
    if (!today || res.todayDate !== todayKey) {
      if (today && res.todayDate) {
        history[res.todayDate] = today;
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

  async recordHeartbeat({ type, seconds = 1, itemData = null }) {
    const data = await this.getAllData();
    const today = data.today;
    const logs = data.logs;

    if (type === 'video') {
      today.videoSeconds += seconds;
    } else if (type === 'shorts') {
      today.shortsSeconds += seconds;
    } else if (type === 'browse') {
      today.browseSeconds += seconds;
    }

    if (itemData && itemData.id) {
      // Find or update recent watch log entry
      const existing = logs.find(l => l.id === itemData.id && (Date.now() - l.timestamp < 1000 * 60 * 60 * 4));
      if (existing) {
        existing.seconds = (existing.seconds || 0) + seconds;
        existing.lastSeen = Date.now();
      } else {
        logs.unshift({
          id: itemData.id,
          type: itemData.type,
          title: itemData.title || 'YouTube Video',
          channel: itemData.channel || 'YouTube',
          seconds: seconds,
          timestamp: Date.now(),
          lastSeen: Date.now()
        });
        // Limit logs to last 500
        if (logs.length > 500) logs.pop();
      }
    }

    // Save back
    await this.set({
      today,
      logs
    });

    return { today, settings: data.settings };
  },

  async recordViewCount({ type, itemData }) {
    const data = await this.getAllData();
    const today = data.today;

    if (type === 'video') {
      today.videoCount += 1;
    } else if (type === 'shorts') {
      today.shortsCount += 1;
    }

    await this.set({ today });
    return today;
  },

  async recordFeatureAction(featureName, count = 1) {
    const data = await this.getAllData();
    const today = data.today;

    if (featureName === 'search') {
      today.searchCount = (today.searchCount || 0) + count;
    } else if (featureName === 'comment') {
      today.commentCount = (today.commentCount || 0) + count;
    } else if (featureName === 'short_scroll') {
      today.shortsScrolled = (today.shortsScrolled || 0) + count;
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
