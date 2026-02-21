import React from 'react';
import EditableListCard from './EditableListCard';

interface GoalsSectionProps {
    goals: Record<string, number>;
    onSave: (newGoals: Record<string, number>) => void;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ goals, onSave }) => {
    const data = Object.fromEntries(
        Object.entries(goals).map(([k, v]) => [k, String(v)])
    );

    const handleSave = (newData: Record<string, string>) => {
        const converted = Object.fromEntries(
            Object.entries(newData).map(([k, v]) => [k, Number(v)])
        );
        onSave(converted);
    };

    return (
        <EditableListCard
            title="🎯 每日使用目标"
            description="为网站设定每日最低使用目标，达标后获得成就徽章。适合用于督促自己在学习、编程等网站上投入足够时间。"
            cardClassName="border-green-500/20"
            addButtonLabel="添加目标"
            emptyMessage="暂未设置任何使用目标。"
            data={data}
            onSave={handleSave}
            valueField={{
                label: '目标 (分钟)',
                type: 'number',
                placeholder: '120',
                defaultValue: '',
                toDisplay: (v) => String(Number(v) / 60),
                toStored: (v) => {
                    const mins = parseInt(v);
                    return isNaN(mins) ? null : String(mins * 60);
                },
                formatDisplay: (v) => `🎯 每日目标：${Number(v) / 60} 分钟`,
            }}
        />
    );
};

export default GoalsSection;
