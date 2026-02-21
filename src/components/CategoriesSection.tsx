import React from 'react';
import { Select } from "@/components/ui/select";
import EditableListCard from './EditableListCard';

interface CategoriesSectionProps {
    categories: Record<string, string>;
    onSave: (newCategories: Record<string, string>) => void;
}

const categoryLabels: Record<string, string> = {
    Productivity: '🟢 生产力',
    Entertainment: '🟠 娱乐',
    Neutral: '⚪ 中立',
};

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ categories, onSave }) => {
    const renderCategorySelect = (value: string, onChange: (v: string) => void, id: string, className?: string) => (
        <Select
            id={id}
            className={className}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="Productivity">生产力</option>
            <option value="Entertainment">娱乐</option>
            <option value="Neutral">中立</option>
        </Select>
    );

    return (
        <EditableListCard
            title="网站分类 (专注/娱乐)"
            description={
                <>
                    将网站分类以了解你的时间分配。<br />
                    <span className="text-muted-foreground">如果这里没有设置，我们将使用内置字典自动识别主流站点（例如 github.com 自动识别为生产力，bilibili.com 识别为娱乐）。</span>
                </>
            }
            domainLabel="网站域名 (覆盖内置规则)"
            addButtonLabel="添加规则"
            emptyMessage="暂无自定义覆盖规则。扩展正在按照内置字典智能分类。"
            data={categories}
            onSave={onSave}
            valueField={{
                label: '分类',
                type: 'custom',
                widthClass: 'w-32',
                defaultValue: 'Productivity',
                toDisplay: (v) => v,
                toStored: (v) => v,
                formatDisplay: (v) => `${categoryLabels[v] || v} (使用自定义规则)`,
                renderInput: renderCategorySelect,
            }}
        />
    );
};

export default CategoriesSection;
