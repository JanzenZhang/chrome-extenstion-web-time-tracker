import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

import { ThemeToggle } from './components/ThemeToggle';

const cleanDomainInput = (input: string) => {
  let clean = input.trim();
  try {
    if (clean.includes('http://') || clean.includes('https://')) {
      clean = new URL(clean).hostname;
    } else if (clean.includes('/')) {
      clean = clean.split('/')[0];
    }
  } catch (e) {
    // ignore
  }
  if (clean.startsWith('www.')) {
    clean = clean.substring(4);
  }
  return clean;
};

const Options = () => {
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [newDomain, setNewDomain] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const [categories, setCategories] = useState<Record<string, string>>({});
  const [newCategoryDomain, setNewCategoryDomain] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('Productivity');

  // Edit states for Limits
  const [editingLimitDomain, setEditingLimitDomain] = useState<string | null>(null);
  const [editLimitDomainInput, setEditLimitDomainInput] = useState('');
  const [editLimitValueInput, setEditLimitValueInput] = useState('');

  // Edit states for Categories
  const [editingCategoryDomain, setEditingCategoryDomain] = useState<string | null>(null);
  const [editCategoryDomainInput, setEditCategoryDomainInput] = useState('');
  const [editCategoryTypeInput, setEditCategoryTypeInput] = useState('Productivity');

  useEffect(() => {
    chrome.storage.local.get(['limits', 'categories'], (data) => {
      const fetchedLimits = (data.limits || {}) as Record<string, number>;
      const fetchedCategories = (data.categories || {}) as Record<string, string>;
      setLimits(fetchedLimits);
      setCategories(fetchedCategories);
    });
  }, []);

  const saveLimits = (newLimits: Record<string, number>) => {
    setLimits(newLimits);
    chrome.storage.local.set({ limits: newLimits });
  };

  const addLimit = () => {
    if (newDomain && newLimit) {
      const domain = cleanDomainInput(newDomain);
      if (!domain) return;

      const updated = { ...limits, [domain]: parseInt(newLimit) * 60 };
      saveLimits(updated);
      setNewDomain('');
      setNewLimit('');
    }
  };

  const removeLimit = (domain: string) => {
    const updated = { ...limits };
    delete updated[domain];
    saveLimits(updated);
  };

  const saveCategories = (newCats: Record<string, string>) => {
    setCategories(newCats);
    chrome.storage.local.set({ categories: newCats });
  };

  const addCategory = () => {
    if (newCategoryDomain && newCategoryType) {
      const domain = cleanDomainInput(newCategoryDomain);
      if (!domain) return;

      const updated = { ...categories, [domain]: newCategoryType };
      saveCategories(updated);
      setNewCategoryDomain('');
    }
  };

  const removeCategory = (domain: string) => {
    const updated = { ...categories };
    delete updated[domain];
    saveCategories(updated);
  };

  const clearData = () => {
    if (confirm('确定要清空所有使用统计数据吗？此操作无法恢复。')) {
      chrome.storage.local.set({ stats: {}, notifications: {} });
    }
  };

  const startEditLimit = (domain: string, seconds: number) => {
    setEditingLimitDomain(domain);
    setEditLimitDomainInput(domain);
    setEditLimitValueInput((seconds / 60).toString());
  };

  const saveEditLimit = (oldDomain: string) => {
    const newDomainClean = cleanDomainInput(editLimitDomainInput);
    const newLimitMins = parseInt(editLimitValueInput);

    if (!newDomainClean || isNaN(newLimitMins)) return;

    const updated = { ...limits };
    if (newDomainClean !== oldDomain) {
      delete updated[oldDomain];
    }
    updated[newDomainClean] = newLimitMins * 60;

    saveLimits(updated);
    setEditingLimitDomain(null);
  };

  const startEditCategory = (domain: string, type: string) => {
    setEditingCategoryDomain(domain);
    setEditCategoryDomainInput(domain);
    setEditCategoryTypeInput(type);
  };

  const saveEditCategory = (oldDomain: string) => {
    const newDomainClean = cleanDomainInput(editCategoryDomainInput);
    if (!newDomainClean) return;

    const updated = { ...categories };
    if (newDomainClean !== oldDomain) {
      delete updated[oldDomain];
    }
    updated[newDomainClean] = editCategoryTypeInput;

    saveCategories(updated);
    setEditingCategoryDomain(null);
  };

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">WebTime 设置</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>每日时长限制</CardTitle>
            <CardDescription>为特定网站设置每日最长访问时间。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="domain">网站域名</Label>
                <Input
                  id="domain"
                  placeholder="例如 google.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
              <div className="grid gap-2 w-32">
                <Label htmlFor="limit">限额 (分钟)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="60"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
              </div>
              <Button onClick={addLimit}>
                <Plus className="h-4 w-4 mr-2" />
                添加限制
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(limits).map(([domain, seconds]) => {
                const isEditing = editingLimitDomain === domain;
                return (
                  <div key={domain} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2 items-center mr-4">
                        <Input
                          value={editLimitDomainInput}
                          onChange={(e) => setEditLimitDomainInput(e.target.value)}
                          className="h-8 w-1/2"
                          placeholder="域名"
                        />
                        <Input
                          type="number"
                          value={editLimitValueInput}
                          onChange={(e) => setEditLimitValueInput(e.target.value)}
                          className="h-8 w-24"
                          placeholder="分钟"
                        />
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <span className="font-medium">{domain}</span>
                        <span className="text-sm text-muted-foreground">每日限额：{seconds / 60} 分钟</span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEditLimit(domain)} title="保存">
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingLimitDomain(null)} title="取消">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEditLimit(domain, seconds)} title="编辑">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeLimit(domain)} title="删除">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(limits).length === 0 && (
                <p className="text-center text-muted-foreground py-4">暂未设置任何限制。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>网站分类 (专注/娱乐)</CardTitle>
            <CardDescription>
              将网站分类以了解你的时间分配。<br />
              <span className="text-muted-foreground">如果这里没有设置，我们将使用内置字典自动识别主流站点（例如 github.com 自动识别为生产力，bilibili.com 识别为娱乐）。</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="categoryDomain">网站域名 (覆盖内置规则)</Label>
                <Input
                  id="categoryDomain"
                  placeholder="例如 github.com"
                  value={newCategoryDomain}
                  onChange={(e) => setNewCategoryDomain(e.target.value)}
                />
              </div>
              <div className="grid gap-2 w-32">
                <Label htmlFor="categoryType">分类</Label>
                <select
                  id="categoryType"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value)}
                >
                  <option value="Productivity">生产力</option>
                  <option value="Entertainment">娱乐</option>
                  <option value="Neutral">中立</option>
                </select>
              </div>
              <Button onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2" />
                添加规则
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(categories).map(([domain, type]) => {
                const isEditing = editingCategoryDomain === domain;
                return (
                  <div key={domain} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    {isEditing ? (
                      <div className="flex-1 flex gap-2 items-center mr-4">
                        <Input
                          value={editCategoryDomainInput}
                          onChange={(e) => setEditCategoryDomainInput(e.target.value)}
                          className="h-8 w-1/2"
                          placeholder="域名"
                        />
                        <select
                          className="flex h-8 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editCategoryTypeInput}
                          onChange={(e) => setEditCategoryTypeInput(e.target.value)}
                        >
                          <option value="Productivity">生产力</option>
                          <option value="Entertainment">娱乐</option>
                          <option value="Neutral">中立</option>
                        </select>
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <span className="font-medium">{domain}</span>
                        <span className="text-sm text-muted-foreground">
                          {type === 'Productivity' ? '🟢 生产力' : type === 'Entertainment' ? '🟠 娱乐' : '⚪ 中立'} (使用自定义规则)
                        </span>
                      </div>
                    )}
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => saveEditCategory(domain)} title="保存">
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditingCategoryDomain(null)} title="取消">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => startEditCategory(domain, type)} title="编辑">
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => removeCategory(domain)} title="删除">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(categories).length === 0 && (
                <p className="text-center text-muted-foreground py-4">暂无自定义覆盖规则。扩展正在按照内置字典智能分类。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">危险区域</CardTitle>
            <CardDescription>此操作无法撤销，请谨慎操作。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={clearData}>清空所有历史数据</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Options;
