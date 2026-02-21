import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { cleanDomainInput } from '@/lib/utils';

interface GoalsSectionProps {
    goals: Record<string, number>;
    onSave: (newGoals: Record<string, number>) => void;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ goals, onSave }) => {
    const [newDomain, setNewDomain] = useState('');
    const [newGoal, setNewGoal] = useState('');

    const [editingDomain, setEditingDomain] = useState<string | null>(null);
    const [editDomainInput, setEditDomainInput] = useState('');
    const [editValueInput, setEditValueInput] = useState('');

    const addGoal = () => {
        if (newDomain && newGoal) {
            const domain = cleanDomainInput(newDomain);
            if (!domain) return;

            const updated = { ...goals, [domain]: parseInt(newGoal) * 60 };
            onSave(updated);
            setNewDomain('');
            setNewGoal('');
        }
    };

    const removeGoal = (domain: string) => {
        const updated = { ...goals };
        delete updated[domain];
        onSave(updated);
    };

    const startEdit = (domain: string, seconds: number) => {
        setEditingDomain(domain);
        setEditDomainInput(domain);
        setEditValueInput((seconds / 60).toString());
    };

    const saveEdit = (oldDomain: string) => {
        const newDomainClean = cleanDomainInput(editDomainInput);
        const newGoalMins = parseInt(editValueInput);

        if (!newDomainClean || isNaN(newGoalMins)) return;

        const updated = { ...goals };
        if (newDomainClean !== oldDomain) {
            delete updated[oldDomain];
        }
        updated[newDomainClean] = newGoalMins * 60;

        onSave(updated);
        setEditingDomain(null);
    };

    return (
        <Card className="border-green-500/20">
            <CardHeader>
                <CardTitle>🎯 每日使用目标</CardTitle>
                <CardDescription>为网站设定每日最低使用目标，达标后获得成就徽章。适合用于督促自己在学习、编程等网站上投入足够时间。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="grid gap-2 flex-1">
                        <Label htmlFor="goalDomain">网站域名</Label>
                        <Input
                            id="goalDomain"
                            placeholder="例如 github.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2 w-32">
                        <Label htmlFor="goalMinutes">目标 (分钟)</Label>
                        <Input
                            id="goalMinutes"
                            type="number"
                            placeholder="120"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                        />
                    </div>
                    <Button onClick={addGoal}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加目标
                    </Button>
                </div>

                <div className="space-y-4">
                    {Object.entries(goals).map(([domain, seconds]) => {
                        const isEditing = editingDomain === domain;
                        return (
                            <div key={domain} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                {isEditing ? (
                                    <div className="flex-1 flex gap-2 items-center mr-4">
                                        <Input
                                            value={editDomainInput}
                                            onChange={(e) => setEditDomainInput(e.target.value)}
                                            className="h-8 w-1/2"
                                            placeholder="域名"
                                        />
                                        <Input
                                            type="number"
                                            value={editValueInput}
                                            onChange={(e) => setEditValueInput(e.target.value)}
                                            className="h-8 w-24"
                                            placeholder="分钟"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid gap-1">
                                        <span className="font-medium">{domain}</span>
                                        <span className="text-sm text-muted-foreground">🎯 每日目标：{seconds / 60} 分钟</span>
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    {isEditing ? (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => saveEdit(domain)} title="保存">
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingDomain(null)} title="取消">
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(domain, seconds)} title="编辑">
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => removeGoal(domain)} title="删除">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(goals).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">暂未设置任何使用目标。</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default GoalsSection;
