import React, { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { cleanDomainInput } from '@/lib/utils';
import Favicon from './Favicon';

/** Configuration for the value field (the second input alongside the domain) */
interface ValueFieldConfig {
    /** Label shown above the input */
    label: string;
    /** Input type: 'number' for limits/goals, 'custom' for rendering your own component */
    type: 'number' | 'custom';
    /** Placeholder text for number inputs */
    placeholder?: string;
    /** Width class for the value column (default: 'w-32') */
    widthClass?: string;
    /** Default value for new entries */
    defaultValue: string;
    /**
     * Convert a stored value to the display/edit string.
     * e.g. seconds → minutes: `(v) => String(v / 60)`
     */
    toDisplay: (storedValue: string) => string;
    /**
     * Convert the user input string to the stored value string.
     * e.g. minutes → seconds: `(v) => String(Number(v) * 60)`
     * Return null if the input is invalid.
     */
    toStored: (inputValue: string) => string | null;
    /**
     * Format the stored value for the read-only list display.
     * e.g. `(v) => \`每日限额：${Number(v)/60} 分钟\``
     */
    formatDisplay: (storedValue: string) => string;
    /**
     * Render a custom input for the value field (used when type === 'custom').
     * Receives current value and onChange handler.
     */
    renderInput?: (value: string, onChange: (value: string) => void, id: string, className?: string) => ReactNode;
}

interface EditableListCardProps {
    /** Card title */
    title: string;
    /** Card description (supports JSX) */
    description?: ReactNode;
    /** Extra className on the Card element */
    cardClassName?: string;
    /** Domain input label */
    domainLabel?: string;
    /** Domain input placeholder */
    domainPlaceholder?: string;
    /** Label for the add button */
    addButtonLabel: string;
    /** Empty state message */
    emptyMessage: string;
    /** The current data entries */
    data: Record<string, string>;
    /** Called with updated data when entries are added, edited, or removed */
    onSave: (newData: Record<string, string>) => void;
    /** Configuration for the value field */
    valueField: ValueFieldConfig;
}

const EditableListCard: React.FC<EditableListCardProps> = ({
    title,
    description,
    cardClassName,
    domainLabel = '网站域名',
    domainPlaceholder = '例如 google.com',
    addButtonLabel,
    emptyMessage,
    data,
    onSave,
    valueField,
}) => {
    const [newDomain, setNewDomain] = useState('');
    const [newValue, setNewValue] = useState(valueField.defaultValue);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editDomainInput, setEditDomainInput] = useState('');
    const [editValueInput, setEditValueInput] = useState('');

    const addEntry = () => {
        if (!newDomain || !newValue) return;
        const domain = cleanDomainInput(newDomain);
        if (!domain) return;

        const stored = valueField.toStored(newValue);
        if (stored === null) return;

        onSave({ ...data, [domain]: stored });
        setNewDomain('');
        setNewValue(valueField.defaultValue);
    };

    const removeEntry = (key: string) => {
        const updated = { ...data };
        delete updated[key];
        onSave(updated);
    };

    const startEdit = (key: string, storedValue: string) => {
        setEditingKey(key);
        setEditDomainInput(key);
        setEditValueInput(valueField.toDisplay(storedValue));
    };

    const saveEdit = (oldKey: string) => {
        const newDomainClean = cleanDomainInput(editDomainInput);
        if (!newDomainClean) return;

        const stored = valueField.toStored(editValueInput);
        if (stored === null) return;

        const updated = { ...data };
        if (newDomainClean !== oldKey) {
            delete updated[oldKey];
        }
        updated[newDomainClean] = stored;
        onSave(updated);
        setEditingKey(null);
    };

    const renderValueInput = (value: string, onChange: (v: string) => void, id: string, className?: string) => {
        if (valueField.type === 'custom' && valueField.renderInput) {
            return valueField.renderInput(value, onChange, id, className);
        }
        return (
            <Input
                id={id}
                type="number"
                placeholder={valueField.placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
            />
        );
    };

    return (
        <Card className={cardClassName}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="grid gap-2 flex-1">
                        <Label htmlFor={`${title}-domain`}>{domainLabel}</Label>
                        <Input
                            id={`${title}-domain`}
                            placeholder={domainPlaceholder}
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                        />
                    </div>
                    <div className={`grid gap-2 ${valueField.widthClass || 'w-32'}`}>
                        <Label htmlFor={`${title}-value`}>{valueField.label}</Label>
                        {renderValueInput(newValue, setNewValue, `${title}-value`)}
                    </div>
                    <Button onClick={addEntry}>
                        <Plus className="h-4 w-4 mr-2" />
                        {addButtonLabel}
                    </Button>
                </div>

                <div className="space-y-4">
                    {Object.entries(data).map(([key, storedValue]) => {
                        const isEditing = editingKey === key;
                        return (
                            <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                {isEditing ? (
                                    <div className="flex-1 flex gap-2 items-center mr-4">
                                        <Input
                                            value={editDomainInput}
                                            onChange={(e) => setEditDomainInput(e.target.value)}
                                            className="h-8 w-1/2"
                                            placeholder="域名"
                                        />
                                        {renderValueInput(editValueInput, setEditValueInput, `${title}-edit-value`, `h-8 ${valueField.widthClass || 'w-24'}`)}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Favicon domain={key} size={20} />
                                        <div className="grid gap-1">
                                            <span className="font-medium">{key}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {valueField.formatDisplay(storedValue)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    {isEditing ? (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => saveEdit(key)} title="保存">
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingKey(null)} title="取消">
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => startEdit(key, storedValue)} title="编辑">
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => removeEntry(key)} title="删除">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(data).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">{emptyMessage}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default EditableListCard;
