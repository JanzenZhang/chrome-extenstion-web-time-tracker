import { getCategoryForDomain } from './lib/categories';

let currentTabId: number | null = null;
let currentDomain: string | null = null;
let lastUpdateTime: number = Date.now();

function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

async function updateTime() {
  if (!currentDomain) return;

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

  // Check limits
  if (limits[currentDomain] && stats[today][currentDomain] >= limits[currentDomain]) {
    const lastNotif = notifications[currentDomain];
    if (lastNotif !== today) {
      const notificationId = `limit-${currentDomain}-${today}`;
      chrome.notifications.create(notificationId, {
        type: 'basic',
        title: '上网时长达到限制',
        iconUrl: 'icon128.png',
        message: `您在 ${currentDomain} 的今日使用时长已达到设定限制。`,
        priority: 2
      });
      notifications[currentDomain] = today;
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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['stats', 'limits', 'notifications', 'categories'], (result) => {
    if (!result.stats) chrome.storage.local.set({ stats: {} });
    if (!result.limits) chrome.storage.local.set({ limits: {} });
    if (!result.notifications) chrome.storage.local.set({ notifications: {} });
    if (!result.categories) chrome.storage.local.set({ categories: {} });
  });

  // Force reset alarm on install/update to ensure correct timing
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  chrome.alarms.create('hourlyChime', {
    when: nextHour.getTime(),
    periodInMinutes: 60
  });
});

// Expose for debugging
(self as any).handleHourlyChime = handleHourlyChime;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab) {
    currentTabId = tab.id || null;
    currentDomain = getDomain(tab.url);
    lastUpdateTime = Date.now();
  }
}

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
  const limitSeconds = limits[domain];
  if (limitSeconds) {
    const usedSeconds = stats[today]?.[domain] || 0;
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
