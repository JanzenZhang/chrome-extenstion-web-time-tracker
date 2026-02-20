const defaultCategories: Record<string, string> = {
  // --- Productivity & Work ---
  "github.com": "Productivity",
  "gitlab.com": "Productivity",
  "bitbucket.org": "Productivity",
  "stackoverflow.com": "Productivity",
  "developer.mozilla.org": "Productivity",
  "notion.so": "Productivity",
  "trello.com": "Productivity",
  "jira.com": "Productivity",
  "atlassian.com": "Productivity",
  "slack.com": "Productivity",
  "t.co": "Productivity",
  "figma.com": "Productivity",
  "docs.google.com": "Productivity",
  "drive.google.com": "Productivity",
  "mail.google.com": "Productivity",
  "cursor.com": "Productivity",
  "chatgpt.com": "Productivity",
  "claude.ai": "Productivity",
  "gemini.google.com": "Productivity",
  "v2ex.com": "Productivity",
  "juejin.cn": "Productivity",
  "csdn.net": "Productivity",
  "gitee.com": "Productivity",
  "yuque.com": "Productivity",
  "feishu.cn": "Productivity",
  "dingtalk.com": "Productivity",
  "shimo.im": "Productivity",
  "aws.amazon.com": "Productivity",
  "cloud.google.com": "Productivity",
  "azure.microsoft.com": "Productivity",
  "vercel.com": "Productivity",
  "netlify.com": "Productivity",

  // --- Entertainment & Social ---
  "youtube.com": "Entertainment",
  "bilibili.com": "Entertainment",
  "netflix.com": "Entertainment",
  "twitch.tv": "Entertainment",
  "hulu.com": "Entertainment",
  "disneyplus.com": "Entertainment",
  "iqiyi.com": "Entertainment",
  "v.qq.com": "Entertainment",
  "youku.com": "Entertainment",
  "douyin.com": "Entertainment",
  "tiktok.com": "Entertainment",
  "weibo.com": "Entertainment",
  "twitter.com": "Entertainment",
  "x.com": "Entertainment",
  "facebook.com": "Entertainment",
  "instagram.com": "Entertainment",
  "reddit.com": "Entertainment",
  "zhihu.com": "Entertainment",
  "tieba.baidu.com": "Entertainment",
  "steampowered.com": "Entertainment",
  "epicgames.com": "Entertainment",
  "douban.com": "Entertainment",
  "xiaohongshu.com": "Entertainment",
  "pinterest.com": "Entertainment",
  "spotify.com": "Entertainment",
  "music.163.com": "Entertainment",
  "y.qq.com": "Entertainment",
  "huya.com": "Entertainment",
  "douyu.com": "Entertainment",
};

function getCategoryForDomain(
  domain: string,
  userCategories: Record<string, string>
): string {
  if (userCategories[domain]) {
    return userCategories[domain];
  }
  if (defaultCategories[domain]) {
    return defaultCategories[domain];
  }
  return "Neutral";
}

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

async function updateTime() {
  if (!currentDomain) {
    console.log('[WebTime] updateTime skipped: no currentDomain');
    return;
  }

  const now = Date.now();
  const delta = Math.floor((now - lastUpdateTime) / 1000);
  console.log(`[WebTime] updateTime for ${currentDomain} - delta: ${delta}s`);
  if (delta < 1) return;

  const today = new Date().toISOString().split('T')[0];

  const data = await chrome.storage.local.get(['stats', 'limits', 'notifications', 'categories']);
  const stats = (data.stats || {}) as Record<string, Record<string, number>>;
  const limits = (data.limits || {}) as Record<string, number>;
  const notifications = (data.notifications || {}) as Record<string, string>;

  if (!stats[today]) stats[today] = {};
  stats[today][currentDomain] = (stats[today][currentDomain] || 0) + delta;

  console.log(`[WebTime] Updated stats for ${currentDomain}: ${stats[today][currentDomain]}s`);

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
  console.log('[WebTime] Tab activated', activeInfo);
  await updateTime();
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentTabId = activeInfo.tabId;
  currentDomain = getDomain(tab.url);
  lastUpdateTime = Date.now();
  console.log(`[WebTime] New domain is now: ${currentDomain}`);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.url) {
    console.log('[WebTime] Tab updated (URL changed)', changeInfo.url);
    await updateTime();
    currentDomain = getDomain(changeInfo.url);
    lastUpdateTime = Date.now();
    console.log(`[WebTime] New domain is now: ${currentDomain}`);
  }
});

chrome.idle.onStateChanged.addListener(async (state) => {
  console.log('[WebTime] Idle state changed:', state);
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
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      currentTabId = tab.id || null;
      currentDomain = getDomain(tab.url);
      lastUpdateTime = Date.now();
    }
  } catch (e) {
    console.error("Init failed", e);
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
