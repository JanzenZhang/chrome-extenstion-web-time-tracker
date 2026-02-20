export const defaultCategories: Record<string, string> = {
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
    "t.co": "Productivity", // Sometimes used for work links, but debateable. Let's keep it Neutral/Productivity
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
    "zhihu.com": "Entertainment", // Can be both, let's default to entertainment to be strict
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

/**
 * Helper to get the category for a domain.
 * It checks the user's custom categories first, then falls back to the default dictionary.
 * If not found in either, returns 'Neutral'.
 */
export function getCategoryForDomain(
    domain: string,
    userCategories: Record<string, string>
): string {
    // 1. Check user overrides
    if (userCategories[domain]) {
        return userCategories[domain];
    }

    // 2. Check default dictionary (exact match)
    if (defaultCategories[domain]) {
        return defaultCategories[domain];
    }

    // 3. Fallback to Neutral
    return "Neutral";
}
