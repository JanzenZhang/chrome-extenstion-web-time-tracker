import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Settings, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

import { ThemeToggle } from './components/ThemeToggle';

import { getCategoryForDomain } from './lib/categories';

const Popup = () => {
  const [stats, setStats] = useState<any>({});
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [focusMode, setFocusMode] = useState<{ active: boolean, endTime: number | null }>({ active: false, endTime: null });
  const [currentView, setCurrentView] = useState('today');
  const [focusMinutes, setFocusMinutes] = useState('25');

  useEffect(() => {
    const loadStats = async () => {
      const data = await chrome.storage.local.get(['stats', 'categories', 'focusMode']);
      setStats(data.stats || {});
      setCategories((data.categories || {}) as Record<string, string>);
      setFocusMode(data.focusMode as { active: boolean, endTime: number | null } || { active: false, endTime: null });
    };
    loadStats();
    const interval = setInterval(loadStats, 1000); // Poll every second for timer updates
    return () => clearInterval(interval);
  }, []);

  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
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

      aggregated[baseDomain] = (aggregated[baseDomain] || 0) + (value as number);
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
      const dateStr = d.toISOString().split('T')[0];
      const dayStats = stats[dateStr] || {};
      const total = Object.values(dayStats).reduce((a: any, b: any) => a + b, 0) as number;
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
    const today = new Date().toISOString().split('T')[0];
    const dayStats = stats[today] || {};

    let prodTime = 0;
    let entTime = 0;

    Object.entries(dayStats).forEach(([domain, seconds]) => {
      const cat = getCategoryForDomain(domain, categories);
      if (cat === 'Productivity') prodTime += (seconds as number);
      if (cat === 'Entertainment') entTime += (seconds as number);
    });

    const totalTracked = prodTime + entTime;
    const score = totalTracked > 0 ? Math.round((prodTime / totalTracked) * 100) : 0;

    return { prodTime, entTime, score, totalTracked };
  };

  const startFocusMode = async () => {
    const mins = parseInt(focusMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const endTime = Date.now() + mins * 60 * 1000;
    const newState = { active: true, endTime };
    await chrome.storage.local.set({ focusMode: newState });
    setFocusMode(newState);
  };

  const stopFocusMode = async () => {
    const newState = { active: false, endTime: null };
    await chrome.storage.local.set({ focusMode: newState });
    setFocusMode(newState);
  };

  const getRemainingFocusTime = () => {
    if (!focusMode.active || !focusMode.endTime) return '00:00';
    const remainingMs = focusMode.endTime - Date.now();
    if (remainingMs <= 0) {
      // Auto stop if it's past end time but state hasn't updated
      stopFocusMode();
      return '00:00';
    }
    const m = Math.floor(remainingMs / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayData = getTodayData();
  const weeklyTrend = getWeeklyTrend();
  const prodMetrics = getProductivityMetrics();

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
          }} title="导出数据">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => chrome.runtime.openOptionsPage()} title="设置">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="today" onValueChange={setCurrentView} className="w-full">
        <TabsList className="grid w-full grid-cols-3 relative bg-muted p-1">
          <TabsTrigger value="today" className="z-10 h-8">
            <span className="relative z-20">今日统计</span>
            {currentView === 'today' && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-background rounded-md shadow-sm z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="week" className="z-10 h-8">
            <span className="relative z-20">过去七天</span>
            {currentView === 'week' && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-background rounded-md shadow-sm z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </TabsTrigger>
          <TabsTrigger value="focus" className="z-10 h-8">
            <span className="relative z-20">专注模式</span>
            {currentView === 'focus' && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-background rounded-md shadow-sm z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="today" key="today" className="space-y-4 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {prodMetrics.totalTracked > 0 && (
                <Card className="mb-4">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">✨ 专注力评分</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-primary">{prodMetrics.score}<span className="text-sm font-normal text-muted-foreground ml-1">分</span></div>
                      <div className="text-right text-xs text-muted-foreground space-y-1">
                        <div><span className="inline-block w-2, h-2 rounded-full bg-green-500 mr-1"></span>生产力: {formatTime(prodMetrics.prodTime)}</div>
                        <div><span className="inline-block w-2, h-2 rounded-full bg-orange-400 mr-1"></span>娱乐: {formatTime(prodMetrics.entTime)}</div>
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
                  <PieChart width={350} height={200}>
                    <Pie
                      data={todayData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {todayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatTime(value as number)} />
                  </PieChart>
                </CardContent>
              </Card>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 mt-4">
                {todayData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm py-1 border-b border-muted last:border-0">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                    </div>
                    <span className="text-muted-foreground font-medium">{formatTime(item.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="week" key="week" className="outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">最近 7 天使用时长 (小时)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full p-0 flex items-center justify-center">
                  <BarChart width={350} height={250} data={weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}h`} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="hours" name="使用时长 (小时)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="focus" key="focus" className="outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-xl">🍅 专注模式</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    开启后，所有“娱乐”和“中立”网站将会被拦截，以保持专注。
                  </p>

                  {!focusMode.active ? (
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label htmlFor="focus-minutes" className="text-sm font-medium leading-none">专注时长 (分钟)</label>
                        <select
                          id="focus-minutes"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={focusMinutes}
                          onChange={(e) => setFocusMinutes(e.target.value)}
                        >
                          <option value="15">15 分钟 (快速专注)</option>
                          <option value="25">25 分钟 (标准番茄钟)</option>
                          <option value="45">45 分钟 (深度工作)</option>
                          <option value="60">60 分钟 (极限挑战)</option>
                        </select>
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
                        {getRemainingFocusTime()}
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
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default Popup;
