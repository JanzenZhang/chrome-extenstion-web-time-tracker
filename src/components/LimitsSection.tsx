import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { cleanDomainInput } from '@/lib/utils';

interface LimitsSectionProps {
    limits: Record<string, number>;
    onSave: (newLimits: Record<string, number>) => void;
}

const LimitsSection: React.FC<LimitsSectionProps> = ({ limits, onSave }) => {
    const [newDomain, setNewDomain] = useState('');
    const [newLimit, setNewLimit] = useState('');

    const [editingDomain, setEditingDomain] = useState<string | null>(null);
    const [editDomainInput, setEditDomainInput] = useState('');
    const [editValueInput, setEditValueInput] = useState('');

    const addLimit = () => {
        if (newDomain && newLimit) {
            const domain = cleanDomainInput(newDomain);
            if (!domain) return;

            const updated = { ...limits, [domain]: parseInt(newLimit) * 60 };
            onSave(updated);
            setNewDomain('');
            setNewLimit('');
        }
    };

    const removeLimit = (domain: string) => {
        const updated = { ...limits };
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
        const newLimitMins = parseInt(editValueInput);

        if (!newDomainClean || isNaN(newLimitMins)) return;

        const updated = { ...limits };
        if (newDomainClean !== oldDomain) {
            delete updated[oldDomain];
        }
        updated[newDomainClean] = newLimitMins * 60;

        onSave(updated);
        setEditingDomain(null);
    };

    return (
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
                                        <span className="text-sm text-muted-foreground">每日限额：{seconds / 60} 分钟</span>
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
    );
};

export default LimitsSection;
