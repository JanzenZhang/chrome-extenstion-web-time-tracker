import { getCategoryForDomain } from './lib/categories';

let currentTabId: number | null = null;
let currentDomain: string | null = null;
let lastUpdateTime: number = Date.now();

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    let hostname = new URL(url).hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

function findMatchingRuleKey<T>(domain: string | null, rules: Record<string, T>): string | null {
  if (!domain) return null;
  if (rules[domain] !== undefined) return domain;

  let bestMatch: string | null = null;
  for (const key of Object.keys(rules)) {
    if (domain.endsWith('.' + key)) {
      if (!bestMatch || key.length > bestMatch.length) {
        bestMatch = key;
      }
    }
  }
  return bestMatch;
}

/** Remove stats entries older than the specified number of days */
async function cleanupOldStats(retentionDays: number = 90) {
  const data = await chrome.storage.local.get(['stats']);
  const stats = (data.stats || {}) as Record<string, Record<string, number>>;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  let changed = false;
  for (const dateKey of Object.keys(stats)) {
    if (dateKey < cutoffStr) {
      delete stats[dateKey];
      changed = true;
    }
  }

  if (changed) {
    await chrome.storage.local.set({ stats });
  }
}

async function updateTime() {
  if (!currentDomain) {
    return;
  }

  const now = Date.now();
  const delta = Math.floor((now - lastUpdateTime) / 1000);
  if (delta < 1) return;

  const today = new Date().toISOString().split('T')[0];

  const data = await chrome.storage.local.get(['stats', 'limits', 'notifications', 'categories']);
  const stats = (data.stats || {}) as Record<string, Record<string, number>>;
  const limits = (data.limits || {}) as Record<string, number>;
  const notifications = (data.notifications || {}) as Record<string, string>;

  if (!stats[today]) stats[today] = {};
  stats[today][currentDomain] = (stats[today][currentDomain] || 0) + delta;

  // Check limits by summing up matching subdomains
  const matchedLimitKey = findMatchingRuleKey(currentDomain, limits);
  if (matchedLimitKey) {
    const limitSeconds = limits[matchedLimitKey];
    let usedSeconds = 0;
    for (const [statDomain, time] of Object.entries(stats[today])) {
      if (statDomain === matchedLimitKey || statDomain.endsWith('.' + matchedLimitKey)) {
        usedSeconds += time;
      }
    }

    if (usedSeconds >= limitSeconds) {
      const lastNotif = notifications[matchedLimitKey];
      if (lastNotif !== today) {
        const notificationId = `limit-${matchedLimitKey}-${today}`;
        chrome.notifications.create(notificationId, {
          type: 'basic',
          title: '上网时长达到限制',
          iconUrl: 'icon128.png',
          message: `您在 ${matchedLimitKey} 相关网站的今日使用时长已达到设定限制。`,
          priority: 2
        });
        notifications[matchedLimitKey] = today;
      }
    }
  }

  await chrome.storage.local.set({ stats, notifications });
  lastUpdateTime = now;
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateTime();
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentTabId = activeInfo.tabId;
  currentDomain = getDomain(tab.url);
  lastUpdateTime = Date.now();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (tabId === currentTabId && changeInfo.url) {
    await updateTime();
    currentDomain = getDomain(changeInfo.url);
    lastUpdateTime = Date.now();
  }
});

chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === 'active') {
    lastUpdateTime = Date.now();
  } else {
    await updateTime();
    currentDomain = null;
  }
});

chrome.alarms.create('updateStats', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateStats') {
    updateTime();
  } else if (alarm.name === 'hourlyChime') {
    handleHourlyChime();
  } else if (alarm.name === 'dailyCleanup') {
    cleanupOldStats();
  }
});

function handleHourlyChime() {
  const now = new Date();
  const hour = now.getHours();

  let title = '整点报时';
  let message = `现在是 ${hour} 点整。`;

  // Late night check: 23:00 - 05:00
  if (hour >= 23 || hour <= 5) {
    title = '深夜提醒';
    message = `现在是 ${hour} 点了。夜深了，请注意休息，早点睡觉，保持健康作息！`;
  }

  chrome.notifications.create(`chime-${Date.now()}`, {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: 'icon128.png',
    priority: 2
  });
}

function setupHourlyAlarm() {
  chrome.alarms.get('hourlyChime', (alarm) => {
    if (!alarm) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      chrome.alarms.create('hourlyChime', {
        when: nextHour.getTime(),
        periodInMinutes: 60
      });
    }
  });
}

// Ensure alarm is set up on load
setupHourlyAlarm();

// Set up daily cleanup alarm
chrome.alarms.create('dailyCleanup', { periodInMinutes: 1440 }); // Once per day

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['stats', 'limits', 'notifications', 'categories'], (result) => {
    const defaults: Record<string, object> = {};
    if (!result.stats) defaults.stats = {};
    if (!result.limits) defaults.limits = {};
    if (!result.notifications) defaults.notifications = {};
    if (!result.categories) defaults.categories = {};
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });

  // Force reset alarm on install/update to ensure correct timing
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  chrome.alarms.create('hourlyChime', {
    when: nextHour.getTime(),
    periodInMinutes: 60
  });

  // Run cleanup on install/update
  cleanupOldStats();
});

// Expose for debugging
(self as any).handleHourlyChime = handleHourlyChime;

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      currentTabId = tab.id || null;
      currentDomain = getDomain(tab.url);
      lastUpdateTime = Date.now();
    }
  } catch (e) {
    // Init failed silently
  }
}

// Call init without awaiting to avoid blocking Service Worker startup
init();

// --- Communications with Content Script ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    handleGetStatus(sender, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleGetStatus(sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
  const url = sender.tab?.url || sender.url;
  const domain = getDomain(url);

  if (!domain) {
    sendResponse(null);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const data = await chrome.storage.local.get(['stats', 'limits', 'focusMode', 'categories']);

  const stats = (data.stats || {}) as Record<string, Record<string, number>>;
  const limits = (data.limits || {}) as Record<string, number>;
  const focusMode = (data.focusMode || { active: false, endTime: null }) as { active: boolean, endTime: number | null };
  const categories = (data.categories || {}) as Record<string, string>;

  // 1. Check Focus Mode Block
  if (focusMode.active && focusMode.endTime && focusMode.endTime > Date.now()) {
    const category = getCategoryForDomain(domain, categories);
    if (category !== 'Productivity') {
      sendResponse({ type: 'FOCUS_BLOCKED' });
      return;
    }
  }

  // 2. Check Daily Limit
  const matchedLimitKey = findMatchingRuleKey(domain, limits);
  if (matchedLimitKey) {
    const limitSeconds = limits[matchedLimitKey];
    let usedSeconds = 0;
    const todayStats = stats[today] || {};
    for (const [statDomain, time] of Object.entries(todayStats)) {
      if (statDomain === matchedLimitKey || statDomain.endsWith('.' + matchedLimitKey)) {
        usedSeconds += time;
      }
    }

    const remainingSeconds = limitSeconds - usedSeconds;

    if (remainingSeconds <= 0) {
      sendResponse({ type: 'BLOCKED' });
      return;
    } else if (remainingSeconds <= 300) { // 5 minutes warning
      sendResponse({
        type: 'WARNING',
        timeLeftMinutes: Math.ceil(remainingSeconds / 60)
      });
      return;
    }
  }

  sendResponse(null);
}
