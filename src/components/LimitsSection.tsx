import React from 'react';
import EditableListCard from './EditableListCard';

interface LimitsSectionProps {
    limits: Record<string, number>;
    onSave: (newLimits: Record<string, number>) => void;
}

const LimitsSection: React.FC<LimitsSectionProps> = ({ limits, onSave }) => {
    // Convert Record<string, number> ↔ Record<string, string> for the generic component
    const data = Object.fromEntries(
        Object.entries(limits).map(([k, v]) => [k, String(v)])
    );

    const handleSave = (newData: Record<string, string>) => {
        const converted = Object.fromEntries(
            Object.entries(newData).map(([k, v]) => [k, Number(v)])
        );
        onSave(converted);
    };

    return (
        <EditableListCard
            title="每日时长限制"
            description="为特定网站设置每日最长访问时间。"
            addButtonLabel="添加限制"
            emptyMessage="暂未设置任何限制。"
            data={data}
            onSave={handleSave}
            valueField={{
                label: '限额 (分钟)',
                type: 'number',
                placeholder: '60',
                defaultValue: '',
                toDisplay: (v) => String(Number(v) / 60),
                toStored: (v) => {
                    const mins = parseInt(v);
                    return isNaN(mins) ? null : String(mins * 60);
                },
                formatDisplay: (v) => `每日限额：${Number(v) / 60} 分钟`,
            }}
        />
    );
};

export default LimitsSection;
