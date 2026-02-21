import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Settings, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import Favicon from './components/Favicon';
import { getCategoryForDomain } from './lib/categories';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#a5b4fc', '#67e8f9', '#34d399', '#fbbf24', '#f87171'];

const NewTab = () => {
    const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [goals, setGoals] = useState<Record<string, number>>({});
    const [achievements, setAchievements] = useState<Array<{ domain: string, date: string, goalMinutes: number }>>([]);
    const [autoCategories, setAutoCategories] = useState<Record<string, string>>({});
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        chrome.storage.local.get(['stats', 'categories', 'goals', 'achievements', 'autoCategories'], (data) => {
            setStats((data.stats || {}) as Record<string, Record<string, number>>);
            setCategories((data.categories || {}) as Record<string, string>);
            setGoals((data.goals || {}) as Record<string, number>);
            setAchievements((data.achievements || []) as Array<{ domain: string, date: string, goalMinutes: number }>);
            setAutoCategories((data.autoCategories || {}) as Record<string, string>);
        });

        const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.stats) setStats((changes.stats.newValue || {}) as Record<string, Record<string, number>>);
            if (changes.categories) setCategories((changes.categories.newValue || {}) as Record<string, string>);
            if (changes.goals) setGoals((changes.goals.newValue || {}) as Record<string, number>);
            if (changes.achievements) setAchievements((changes.achievements.newValue || []) as Array<{ domain: string, date: string, goalMinutes: number }>);
            if (changes.autoCategories) setAutoCategories((changes.autoCategories.newValue || {}) as Record<string, string>);
        };
        chrome.storage.onChanged.addListener(handler);
        return () => chrome.storage.onChanged.removeListener(handler);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const todayStats = stats[today] || {};

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const formatTimeCn = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}小时${m}分` : `${m}分钟`;
    };

    // Today's top sites
    const topSites = Object.entries(todayStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

    const totalToday = Object.values(todayStats).reduce((a, b) => a + b, 0);

    // Productivity metrics
    let prodTime = 0, entTime = 0;
    Object.entries(todayStats).forEach(([domain, seconds]) => {
        const cat = getCategoryForDomain(domain, categories, autoCategories);
        if (cat === 'Productivity') prodTime += seconds;
        if (cat === 'Entertainment') entTime += seconds;
    });
    const tracked = prodTime + entTime;
    const prodScore = tracked > 0 ? Math.round((prodTime / tracked) * 100) : 0;

    // Weekly trend (7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayStats = stats[dateStr] || {};
        const total = Object.values(dayStats).reduce((a, b) => a + b, 0);

        let dayProd = 0, dayEnt = 0;
        Object.entries(dayStats).forEach(([domain, seconds]) => {
            const cat = getCategoryForDomain(domain, categories, autoCategories);
            if (cat === 'Productivity') dayProd += seconds;
            if (cat === 'Entertainment') dayEnt += seconds;
        });

        weeklyTrend.push({
            date: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
            total: parseFloat((total / 3600).toFixed(1)),
            prod: parseFloat((dayProd / 3600).toFixed(1)),
            ent: parseFloat((dayEnt / 3600).toFixed(1)),
        });
    }

    // Goals progress
    const goalProgress = Object.entries(goals).map(([domain, goalSeconds]) => {
        let usedSeconds = 0;
        for (const [statDomain, time] of Object.entries(todayStats)) {
            if (statDomain === domain || statDomain.endsWith('.' + domain)) {
                usedSeconds += time;
            }
        }
        const achieved = achievements.some(a => a.domain === domain && a.date === today);
        const percent = Math.min(100, Math.round((usedSeconds / goalSeconds) * 100));
        return { domain, goalSeconds, usedSeconds, achieved, percent };
    });

    const totalAchievementsToday = goalProgress.filter(g => g.achieved).length;

    // Greeting
    const hour = currentTime.getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

    // Pie data for productivity split
    const pieData = [
        { name: '生产力', value: prodTime, color: '#34d399' },
        { name: '娱乐', value: entTime, color: '#f87171' },
        { name: '其他', value: Math.max(0, totalToday - prodTime - entTime), color: '#6b7280' },
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/5 dark:to-pink-500/10 pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            {greeting}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-5xl font-mono tabular-nums font-light text-foreground/80 tracking-tight">
                            {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex flex-col gap-1">
                            <ThemeToggle />
                            <Button variant="ghost" size="icon" onClick={() => chrome.runtime.openOptionsPage()} title="设置">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Stats cards row */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card className="bg-card/60 backdrop-blur border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">今日总时长</p>
                                    <p className="text-2xl font-bold">{formatTimeCn(totalToday)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Zap className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">效率评分</p>
                                    <p className="text-2xl font-bold">{prodScore}<span className="text-sm font-normal text-muted-foreground ml-0.5">分</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">访问网站数</p>
                                    <p className="text-2xl font-bold">{Object.keys(todayStats).length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10">
                                    <Target className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">目标达成</p>
                                    <p className="text-2xl font-bold">
                                        {totalAchievementsToday}
                                        <span className="text-sm font-normal text-muted-foreground ml-0.5">/ {goalProgress.length}</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main content grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left column: Top Sites + Goals */}
                    <div className="space-y-6">
                        {/* Top Sites */}
                        <Card className="bg-card/60 backdrop-blur border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">🌐 今日访问</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {topSites.length === 0 && (
                                    <p className="text-muted-foreground text-sm text-center py-6">今天还没有浏览记录</p>
                                )}
                                {topSites.map((site, i) => {
                                    const pct = totalToday > 0 ? Math.round((site.value / totalToday) * 100) : 0;
                                    return (
                                        <div key={site.name} className="flex items-center gap-3">
                                            <Favicon domain={site.name} size={20} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium truncate" title={site.name}>{site.name}</span>
                                                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTime(site.value)}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-1.5 rounded-full transition-all duration-700"
                                                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Goals */}
                        {goalProgress.length > 0 && (
                            <Card className="bg-card/60 backdrop-blur border-border/50">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold">🎯 今日目标</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {goalProgress.map((g) => (
                                        <div key={g.domain} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {g.achieved ? (
                                                        <span className="text-lg">🏆</span>
                                                    ) : (
                                                        <Favicon domain={g.domain} size={16} />
                                                    )}
                                                    <span className="text-sm font-medium">{g.domain}</span>
                                                </div>
                                                <span className={`text-xs font-semibold ${g.achieved ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                    {g.percent}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-700 ${g.achieved ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${g.percent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{formatTimeCn(g.usedSeconds)}</span>
                                                <span>目标 {formatTimeCn(g.goalSeconds)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Center column: Weekly Trend */}
                    <Card className="bg-card/60 backdrop-blur border-border/50 col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">📈 一周趋势</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: 280 }}>
                                <ResponsiveContainer width="100%" height={280} minWidth={0}>
                                    <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradProd" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradEnt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px', backdropFilter: 'blur(8px)' }}
                                            formatter={(value: any, name: any) => [
                                                `${value}h`,
                                                name === 'prod' ? '生产力' : name === 'ent' ? '娱乐' : '总计'
                                            ]}
                                        />
                                        <Area type="monotone" dataKey="prod" name="prod" stroke="#34d399" fill="url(#gradProd)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="ent" name="ent" stroke="#f87171" fill="url(#gradEnt)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    生产力
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    娱乐
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right column: Productivity Pie + Quick Stats */}
                    <div className="space-y-6">
                        {/* Productivity Pie */}
                        <Card className="bg-card/60 backdrop-blur border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">⚡ 时间分配</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {pieData.length > 0 ? (
                                    <>
                                        <div style={{ width: '100%', height: 180 }}>
                                            <ResponsiveContainer width="100%" height={180} minWidth={0}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={55}
                                                        outerRadius={75}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                        isAnimationActive={false}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value: any) => formatTimeCn(value as number)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 mt-2">
                                            {pieData.map((d) => (
                                                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                    {d.name} {formatTime(d.value)}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-10">暂无分类数据</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Efficiency progress bar */}
                        <Card className="bg-card/60 backdrop-blur border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">✨ 效率仪表</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">生产力占比</span>
                                    <span className={`text-sm font-bold ${prodScore >= 70 ? 'text-green-500' : prodScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {prodScore}%
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${prodScore >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                            prodScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                                                'bg-gradient-to-r from-red-400 to-rose-500'
                                            }`}
                                        style={{ width: `${prodScore}%` }}
                                    />
                                </div>
                                <div className="mt-3 text-center">
                                    <span className="text-xs text-muted-foreground">
                                        {prodScore >= 70 ? '🎉 保持专注，表现出色！' :
                                            prodScore >= 40 ? '💪 还不错，继续努力！' :
                                                tracked > 0 ? '🔥 提高警惕，减少娱乐！' : '开始新的一天吧'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center mt-8 text-xs text-muted-foreground/60">
                    WebTime Tracker Pro — 让每一分钟都有价值
                </footer>
            </div>
        </div>
    );
};

export default NewTab;
