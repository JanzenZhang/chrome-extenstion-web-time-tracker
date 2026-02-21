import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { cleanDomainInput } from '@/lib/utils';

interface CategoriesSectionProps {
    categories: Record<string, string>;
    onSave: (newCategories: Record<string, string>) => void;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ categories, onSave }) => {
    const [newDomain, setNewDomain] = useState('');
    const [newType, setNewType] = useState('Productivity');

    const [editingDomain, setEditingDomain] = useState<string | null>(null);
    const [editDomainInput, setEditDomainInput] = useState('');
    const [editTypeInput, setEditTypeInput] = useState('Productivity');

    const addCategory = () => {
        if (newDomain && newType) {
            const domain = cleanDomainInput(newDomain);
            if (!domain) return;

            const updated = { ...categories, [domain]: newType };
            onSave(updated);
            setNewDomain('');
        }
    };

    const removeCategory = (domain: string) => {
        const updated = { ...categories };
        delete updated[domain];
        onSave(updated);
    };

    const startEdit = (domain: string, type: string) => {
        setEditingDomain(domain);
        setEditDomainInput(domain);
        setEditTypeInput(type);
    };

    const saveEdit = (oldDomain: string) => {
        const newDomainClean = cleanDomainInput(editDomainInput);
        if (!newDomainClean) return;

        const updated = { ...categories };
        if (newDomainClean !== oldDomain) {
            delete updated[oldDomain];
        }
        updated[newDomainClean] = editTypeInput;

        onSave(updated);
        setEditingDomain(null);
    };

    return (
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
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2 w-32">
                        <Label htmlFor="categoryType">分类</Label>
                        <Select
                            id="categoryType"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                        >
                            <option value="Productivity">生产力</option>
                            <option value="Entertainment">娱乐</option>
                            <option value="Neutral">中立</option>
                        </Select>
                    </div>
                    <Button onClick={addCategory}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加规则
                    </Button>
                </div>

                <div className="space-y-4">
                    {Object.entries(categories).map(([domain, type]) => {
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
                                        <Select
                                            className="h-8 w-32"
                                            value={editTypeInput}
                                            onChange={(e) => setEditTypeInput(e.target.value)}
                                        >
                                            <option value="Productivity">生产力</option>
                                            <option value="Entertainment">娱乐</option>
                                            <option value="Neutral">中立</option>
                                        </Select>
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
                                            <Button variant="ghost" size="icon" onClick={() => saveEdit(domain)} title="保存">
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingDomain(null)} title="取消">
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(domain, type)} title="编辑">
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
    );
};

export default CategoriesSection;
