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

// ===== Keyword Classification Engine =====

/** Weighted keyword lists for classification */
const productivityKeywords: Array<[string, number]> = [
    // Development & Engineering (high weight)
    ['developer', 3], ['documentation', 3], ['api', 3], ['sdk', 2],
    ['programming', 3], ['coding', 3], ['software', 2], ['engineering', 2],
    ['前端', 3], ['后端', 3], ['开发', 3], ['编程', 3], ['代码', 3],
    ['框架', 2], ['技术', 2], ['算法', 2], ['数据结构', 3],
    // Learning & Education
    ['tutorial', 2], ['course', 2], ['learning', 2], ['education', 2],
    ['学习', 2], ['教程', 2], ['课程', 2], ['教育', 2], ['培训', 2],
    ['university', 2], ['大学', 2], ['学院', 2],
    // Productivity tools
    ['project management', 2], ['task', 1], ['workflow', 2], ['collaboration', 2],
    ['项目管理', 2], ['协作', 2], ['办公', 2], ['企业', 1],
    // Cloud & DevOps
    ['cloud', 2], ['server', 2], ['database', 2], ['deploy', 2],
    ['云计算', 2], ['服务器', 2], ['数据库', 2], ['运维', 2],
    // Design & Creative work
    ['design', 1], ['prototype', 2], ['wireframe', 2],
    ['设计', 1], ['原型', 2],
    // Research & Reference
    ['research', 2], ['reference', 1], ['wiki', 1], ['documentation', 2],
    ['文档', 2], ['参考', 1], ['研究', 2],
    // Finance & Business
    ['finance', 1], ['banking', 2], ['investment', 1],
    ['银行', 2], ['金融', 1],
];

const entertainmentKeywords: Array<[string, number]> = [
    // Video & Streaming (high weight)
    ['video', 2], ['movie', 3], ['film', 2], ['stream', 2], ['watch', 2],
    ['视频', 2], ['电影', 3], ['电视剧', 3], ['综艺', 3], ['动漫', 3],
    ['直播', 3], ['观看', 2], ['播放', 2],
    // Gaming
    ['game', 3], ['gaming', 3], ['play', 2], ['esport', 3],
    ['游戏', 3], ['电竞', 3], ['攻略', 2],
    // Music
    ['music', 2], ['song', 2], ['playlist', 2], ['album', 2],
    ['音乐', 2], ['歌曲', 2], ['歌单', 2],
    // Social Media
    ['social', 2], ['feed', 1], ['followers', 2], ['trending', 1],
    ['朋友圈', 3], ['动态', 1], ['关注', 1], ['粉丝', 2],
    // Comics & Anime
    ['comic', 3], ['manga', 3], ['anime', 3], ['cartoon', 2],
    ['漫画', 3], ['番剧', 3],
    // Shopping & Lifestyle
    ['shopping', 2], ['store', 1], ['mall', 2], ['deals', 2],
    ['购物', 2], ['商城', 2], ['优惠', 2], ['淘宝', 3],
    // News & Entertainment media
    ['entertainment', 3], ['gossip', 3], ['celebrity', 2],
    ['娱乐', 3], ['八卦', 3], ['明星', 2],
    // Humor & casual
    ['meme', 3], ['funny', 2], ['humor', 2],
    ['搞笑', 3], ['段子', 3],
];

/** TLD-based rules */
const tldRules: Record<string, string> = {
    '.edu': 'Productivity',
    '.edu.cn': 'Productivity',
    '.edu.tw': 'Productivity',
    '.ac.uk': 'Productivity',
    '.gov': 'Productivity',
    '.gov.cn': 'Productivity',
    '.mil': 'Productivity',
    '.org': 'Productivity', // Generally organizational
};

/** OG type mapping */
const ogTypeMapping: Record<string, string> = {
    'video': 'Entertainment',
    'video.movie': 'Entertainment',
    'video.episode': 'Entertainment',
    'video.tv_show': 'Entertainment',
    'music': 'Entertainment',
    'music.song': 'Entertainment',
    'music.album': 'Entertainment',
    'game': 'Entertainment',
    'article': 'Productivity', // weak signal
};

export interface PageMetadata {
    title: string;
    description: string;
    keywords: string;
    ogType: string;
}

export interface ClassificationResult {
    category: string;
    confidence: number; // 0-100
    source: 'metadata'; // could be extended later
}

/**
 * Classify a website based on its page metadata.
 * Returns null if confidence is too low to make a determination.
 */
export function classifyByMetadata(
    domain: string,
    metadata: PageMetadata
): ClassificationResult | null {
    // Combine all text for keyword matching
    const text = `${metadata.title} ${metadata.description} ${metadata.keywords} ${domain}`.toLowerCase();

    // 1. Check OG type first (strong signal)
    if (metadata.ogType && ogTypeMapping[metadata.ogType.toLowerCase()]) {
        return {
            category: ogTypeMapping[metadata.ogType.toLowerCase()],
            confidence: 75,
            source: 'metadata',
        };
    }

    // 2. TLD check
    for (const [tld, category] of Object.entries(tldRules)) {
        if (domain.endsWith(tld)) {
            return { category, confidence: 70, source: 'metadata' };
        }
    }

    // 3. Keyword scoring
    let prodScore = 0;
    let entScore = 0;

    for (const [keyword, weight] of productivityKeywords) {
        if (text.includes(keyword.toLowerCase())) {
            prodScore += weight;
        }
    }

    for (const [keyword, weight] of entertainmentKeywords) {
        if (text.includes(keyword.toLowerCase())) {
            entScore += weight;
        }
    }

    const totalScore = prodScore + entScore;

    // Need minimum score threshold to avoid false positives
    if (totalScore < 3) return null;

    const winnerScore = Math.max(prodScore, entScore);
    const confidence = Math.min(95, Math.round((winnerScore / totalScore) * 100));

    // Need clear winner (at least 60% dominance)
    if (confidence < 60) return null;

    return {
        category: prodScore > entScore ? 'Productivity' : 'Entertainment',
        confidence,
        source: 'metadata',
    };
}

/**
 * Helper to get the category for a domain.
 * Priority: user custom > default dict > auto-classification cache > Neutral
 */
export function getCategoryForDomain(
    domain: string,
    userCategories: Record<string, string>,
    autoCategories?: Record<string, string>
): string {
    // 1. User custom categories (exact + suffix match)
    if (userCategories[domain]) return userCategories[domain];
    for (const key of Object.keys(userCategories)) {
        if (domain.endsWith('.' + key)) return userCategories[key];
    }

    // 2. Built-in dictionary (exact + suffix match)
    if (defaultCategories[domain]) return defaultCategories[domain];
    for (const key of Object.keys(defaultCategories)) {
        if (domain.endsWith('.' + key)) return defaultCategories[key];
    }

    // 3. Auto-classification cache
    if (autoCategories && autoCategories[domain]) {
        return autoCategories[domain];
    }

    return "Neutral";
}

