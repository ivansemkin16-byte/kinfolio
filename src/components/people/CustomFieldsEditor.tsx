import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CustomField } from '../../types/person';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { useTranslation } from '../../i18n/LanguageContext';

interface CustomFieldsEditorProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({ fields, onChange }) => {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddField = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    const newField: CustomField = {
      id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: newLabel.trim(),
      value: newValue.trim(),
    };
    onChange([...fields, newField]);
    setNewLabel('');
    setNewValue('');
    setIsAdding(false);
  };

  const handleRemoveField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updatedLabel: string, updatedValue: string) => {
    onChange(
      fields.map((f) =>
        f.id === id ? { ...f, label: updatedLabel, value: updatedValue } : f
      )
    );
  };

  return (
    <section className="receipt-slip border border-border-strong/65 rounded-[2px] p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-dashed border-border-strong/70">
        <div>
          <h3 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-[0.08em]">
            {t('customFields.heading')}
          </h3>
          <p className="type-hand text-[17px] text-secondary mt-0.5 leading-[1.2]">
            {t('customFields.subheading')}
          </p>
        </div>

        {!isAdding && (
          <Button
            size="sm"
            variant="secondary"
            className="self-start sm:self-auto shrink-0"
            onClick={() => setIsAdding(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('customFields.addField')}
          </Button>
        )}
      </div>

      {/* Field List */}
      <div className="divide-y divide-dotted divide-border-strong/60">
        {fields.length > 0 ? (
          fields.map((field) => (
            <div
              key={field.id}
              className="py-2.5 first:pt-0.5 last:pb-0.5 flex flex-col sm:flex-row sm:items-center gap-2"
            >
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleUpdateField(field.id, e.target.value, field.value)}
                placeholder={t('customFields.labelPlaceholder')}
                aria-label={t('customFields.labelPlaceholder')}
                className="sm:w-2/5 h-9 bg-surface/80 border border-border rounded-[3px] px-2.5 text-primary font-mono text-[12px] uppercase tracking-[0.03em] focus:outline-none focus:border-green-700 focus:bg-surface"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleUpdateField(field.id, field.label, e.target.value)}
                placeholder={t('customFields.valuePlaceholder')}
                aria-label={t('customFields.valuePlaceholder')}
                className="flex-1 h-9 bg-surface/80 border border-border rounded-[3px] px-2.5 text-primary font-mono text-[13px] font-medium focus:outline-none focus:border-green-700 focus:bg-surface"
              />
              <div className="self-end sm:self-auto">
                <IconButton
                  label={t('customFields.deleteFieldTitle')}
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveField(field.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </div>
          ))
        ) : (
          !isAdding && (
            <p className="type-hand text-[17px] text-muted py-1.5">
              {t('customFields.empty')}
            </p>
          )
        )}
      </div>

      {/* New field row */}
      {isAdding && (
        <div className="bg-surface-soft/85 border border-dashed border-border-strong rounded-[3px] p-3.5 space-y-2.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-primary block">
            {t('customFields.newMeasurement')}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder={t('customFields.newLabelPlaceholder')}
              aria-label={t('customFields.newLabelPlaceholder')}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-9 bg-surface border border-border-strong rounded-[3px] px-2.5 text-[13px] text-primary placeholder:text-muted focus:outline-none focus:border-green-700"
              autoFocus
            />
            <input
              type="text"
              placeholder={t('customFields.newValuePlaceholder')}
              aria-label={t('customFields.newValuePlaceholder')}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddField();
              }}
              className="h-9 bg-surface border border-border-strong rounded-[3px] px-2.5 text-[13px] font-mono text-primary placeholder:text-muted focus:outline-none focus:border-green-700"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewLabel('');
                setNewValue('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="button"
              onClick={handleAddField}
              disabled={!newLabel.trim() || !newValue.trim()}
            >
              {t('customFields.addField')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
