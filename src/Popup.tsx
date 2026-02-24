import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Settings, Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

import { ThemeToggle } from './components/ThemeToggle';

import { getCategoryForDomain } from './lib/categories';
import { getLocalDateKey } from './lib/date';
import Favicon from './components/Favicon';

const TodayPieChart = lazy(() => import('./components/charts/TodayPieChart'));
const WeeklyBarChart = lazy(() => import('./components/charts/WeeklyBarChart'));

const Popup = () => {
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [focusMode, setFocusMode] = useState<{ active: boolean, endTime: number | null }>({ active: false, endTime: null });
  const [focusMinutes, setFocusMinutes] = useState('25');
  const [focusDisplay, setFocusDisplay] = useState('00:00');
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [achievements, setAchievements] = useState<Array<{ domain: string, date: string, goalMinutes: number }>>([]);
  const [autoCategories, setAutoCategories] = useState<Record<string, string>>({});
  const focusModeRef = useRef(focusMode);

  // Keep ref in sync for use in timer callback
  useEffect(() => {
    focusModeRef.current = focusMode;
  }, [focusMode]);

  // Load initial data once
  useEffect(() => {
    const loadStats = async () => {
      const data = await chrome.storage.local.get(['stats', 'categories', 'focusMode', 'goals', 'achievements', 'autoCategories']);
      setStats((data.stats || {}) as Record<string, Record<string, number>>);
      setCategories((data.categories || {}) as Record<string, string>);
      setFocusMode(data.focusMode as { active: boolean, endTime: number | null } || { active: false, endTime: null });
      setGoals((data.goals || {}) as Record<string, number>);
      setAchievements((data.achievements || []) as Array<{ domain: string, date: string, goalMinutes: number }>);
      setAutoCategories((data.autoCategories || {}) as Record<string, string>);
    };
    loadStats();
  }, []);

  // Listen to storage changes instead of polling
  useEffect(() => {
    const handler = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.stats) setStats((changes.stats.newValue || {}) as Record<string, Record<string, number>>);
      if (changes.categories) setCategories((changes.categories.newValue || {}) as Record<string, string>);
      if (changes.focusMode) setFocusMode((changes.focusMode.newValue || { active: false, endTime: null }) as { active: boolean, endTime: number | null });
      if (changes.goals) setGoals((changes.goals.newValue || {}) as Record<string, number>);
      if (changes.achievements) setAchievements((changes.achievements.newValue || []) as Array<{ domain: string, date: string, goalMinutes: number }>);
      if (changes.autoCategories) setAutoCategories((changes.autoCategories.newValue || {}) as Record<string, string>);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);

  // Separate timer for focus mode countdown display
  useEffect(() => {
    if (!focusMode.active || !focusMode.endTime) {
      setFocusDisplay('00:00');
      return;
    }

    const updateDisplay = () => {
      const fm = focusModeRef.current;
      if (!fm.active || !fm.endTime) return;

      const remainingMs = fm.endTime - Date.now();
      if (remainingMs <= 0) {
        // Auto-stop focus mode when time expires
        const newState = { active: false, endTime: null };
        chrome.storage.local.set({ focusMode: newState });
        setFocusMode(newState);
        setFocusDisplay('00:00');
        return;
      }
      const m = Math.floor(remainingMs / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      setFocusDisplay(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [focusMode.active, focusMode.endTime]);

  const getTodayData = () => {
    const today = getLocalDateKey();
    const dayStats = stats[today] || {};

    // Aggregate subdomains
    const aggregated: Record<string, number> = {};
    Object.entries(dayStats).forEach(([domain, value]) => {
      let baseDomain = domain;
      if (domain.startsWith('www.')) {
        baseDomain = domain.substring(4);
      } else {
        // Try to find if this is a subdomain of a known category
        for (const catDomain of Object.keys(categories)) {
          if (domain.endsWith('.' + catDomain)) {
            baseDomain = catDomain;
            break;
          }
        }
      }

      aggregated[baseDomain] = (aggregated[baseDomain] || 0) + value;
    });

    return Object.entries(aggregated)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getWeeklyTrend = () => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateKey(d);
      const dayStats = stats[dateStr] || {};
      const total = Object.values(dayStats).reduce((a, b) => a + b, 0);
      data.push({
        date: dateStr.split('-').slice(1).join('/'),
        hours: parseFloat((total / 3600).toFixed(2))
      });
    }
    return data;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}小时 ${m}分` : `${m}分`;
  };

  const getProductivityMetrics = () => {
    const today = getLocalDateKey();
    const dayStats = stats[today] || {};

    let prodTime = 0;
    let entTime = 0;

    Object.entries(dayStats).forEach(([domain, seconds]) => {
      const cat = getCategoryForDomain(domain, categories, autoCategories);
      if (cat === 'Productivity') prodTime += seconds;
      if (cat === 'Entertainment') entTime += seconds;
    });

    const totalTracked = prodTime + entTime;
    const score = totalTracked > 0 ? Math.round((prodTime / totalTracked) * 100) : 0;

    return { prodTime, entTime, score, totalTracked };
  };

  const startFocusMode = useCallback(async () => {
    const mins = parseInt(focusMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const endTime = Date.now() + mins * 60 * 1000;
    const newState = { active: true, endTime };
    await chrome.storage.local.set({ focusMode: newState });
    setFocusMode(newState);
  }, [focusMinutes]);

  const stopFocusMode = useCallback(async () => {
    const newState = { active: false, endTime: null };
    await chrome.storage.local.set({ focusMode: newState });
    setFocusMode(newState);
  }, []);

  const todayData = getTodayData();
  const weeklyTrend = getWeeklyTrend();
  const prodMetrics = getProductivityMetrics();

  const getGoalProgress = () => {
    const today = getLocalDateKey();
    const todayStats = stats[today] || {};

    return Object.entries(goals).map(([domain, goalSeconds]) => {
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
  };

  const goalProgress = getGoalProgress();

  return (
    <div className="w-[400px] p-4 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">WebTime 时间助手</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={() => {
            const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `webtime-数据导出.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} title="导出数据">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => chrome.runtime.openOptionsPage()} title="设置">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3 relative bg-muted p-1">
          <TabsTrigger value="today" className="h-7">今日统计</TabsTrigger>
          <TabsTrigger value="week" className="h-7">过去七天</TabsTrigger>
          <TabsTrigger value="focus" className="h-7">专注模式</TabsTrigger>
        </TabsList>

          <TabsContent value="today" key="today" className="space-y-4 outline-none">
            <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              {prodMetrics.totalTracked > 0 && (
                <Card className="mb-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">✨ 专注力评分</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-primary">{prodMetrics.score}<span className="text-sm font-normal text-muted-foreground ml-1">分</span></div>
                      <div className="text-right text-xs text-muted-foreground space-y-1">
                        <div><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>生产力: {formatTime(prodMetrics.prodTime)}</div>
                        <div><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"></span>娱乐: {formatTime(prodMetrics.entTime)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${prodMetrics.score}%` }}></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">网站使用时长分布</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] w-full p-0 flex items-center justify-center">
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}>
                    <TodayPieChart data={todayData} colors={COLORS} formatTime={formatTime} />
                  </Suspense>
                </CardContent>
              </Card>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 mt-4">
                {todayData.map((item, index) => {
                  const cat = getCategoryForDomain(item.name, categories, autoCategories);
                  const catLabel = cat === 'Productivity' ? '🟢' : cat === 'Entertainment' ? '🟠' : '⚪';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-sm py-1 border-b border-muted last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <Favicon domain={item.name} size={16} />
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate max-w-[150px]" title={item.name}>{item.name}</span>
                        <span className="text-xs shrink-0" title={cat}>{catLabel}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{formatTime(item.value)}</span>
                    </div>
                  );
                })}
              </div>

              {goalProgress.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">🎯 今日目标</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {goalProgress.map((g) => (
                      <div key={g.domain} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 truncate max-w-[200px] font-medium" title={g.domain}>
                            {g.achieved ? '🏆' : <Favicon domain={g.domain} size={14} />}
                            {g.domain}
                          </span>
                          <span className={`text-xs font-medium ${g.achieved ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {formatTime(g.usedSeconds)} / {formatTime(g.goalSeconds)}
                            {g.achieved && ' ✓'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${g.achieved ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${g.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="week" key="week" className="outline-none">
            <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">最近 7 天使用时长 (小时)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full p-0 flex items-center justify-center">
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}>
                    <WeeklyBarChart data={weeklyTrend} />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="focus" key="focus" className="outline-none">
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
              <Card>
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-xl">🍅 专注模式</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    开启后，所有"娱乐"和"中立"网站将会被拦截，以保持专注。
                  </p>

                  {!focusMode.active ? (
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="focus-minutes" className="text-sm font-medium leading-none">专注时长 (分钟)</label>
                        <Select
                          id="focus-minutes"
                          value={focusMinutes}
                          onChange={(e) => setFocusMinutes(e.target.value)}
                        >
                          <option value="15">15 分钟 (快速专注)</option>
                          <option value="25">25 分钟 (标准番茄钟)</option>
                          <option value="45">45 分钟 (深度工作)</option>
                          <option value="60">60 分钟 (极限挑战)</option>
                        </Select>
                      </div>
                      <Button
                        className="w-full text-md h-12"
                        onClick={startFocusMode}
                      >
                        开始专注
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-6 py-4">
                      <div className="text-6xl font-mono tabular-nums text-primary font-bold tracking-tight">
                        {focusDisplay}
                      </div>
                      <p className="text-muted-foreground animate-pulse text-sm font-medium">
                        专注进行中，请保持状态！
                      </p>
                      <Button
                        variant="destructive"
                        size="lg"
                        className="w-full mt-2"
                        onClick={stopFocusMode}
                      >
                        放弃专注 (提前结束)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default Popup;
