import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ThemeToggle } from './components/ThemeToggle';
import LimitsSection from './components/LimitsSection';
import CategoriesSection from './components/CategoriesSection';

const Options = () => {
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    chrome.storage.local.get(['limits', 'categories'], (data) => {
      setLimits((data.limits || {}) as Record<string, number>);
      setCategories((data.categories || {}) as Record<string, string>);
    });
  }, []);

  const saveLimits = (newLimits: Record<string, number>) => {
    setLimits(newLimits);
    chrome.storage.local.set({ limits: newLimits });
  };

  const saveCategories = (newCats: Record<string, string>) => {
    setCategories(newCats);
    chrome.storage.local.set({ categories: newCats });
  };

  const clearData = () => {
    if (confirm('确定要清空所有使用统计数据吗？此操作无法恢复。')) {
      chrome.storage.local.set({ stats: {}, notifications: {} });
    }
  };

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">WebTime 设置</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-6">
        <LimitsSection limits={limits} onSave={saveLimits} />

        <CategoriesSection categories={categories} onSave={saveCategories} />

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
