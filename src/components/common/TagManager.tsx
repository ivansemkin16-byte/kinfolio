import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { triggerHaptic } from '../../motion/haptics';

interface TagManagerProps {
  title: string;
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
  badgeVariant?: 'default' | 'accent' | 'warning' | 'danger' | 'success';
  hint?: string;
  isAllergy?: boolean;
  seamless?: boolean;
}

export const TagManager: React.FC<TagManagerProps> = ({
  title,
  tags,
  onChange,
  placeholder,
  badgeVariant = 'default',
  hint,
  isAllergy = false,
  seamless = false,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const effectivePlaceholder = placeholder || t('tagManager.defaultPlaceholder');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const isDuplicate = tags.some((item) => item.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setDuplicateWarning(true);
      triggerHaptic('warning');
      return;
    }
    triggerHaptic('selection');
    onChange([...tags, trimmed]);
    setInputValue('');
    setDuplicateWarning(false);
    setIsAdding(false);
  };

  const handleRemove = (indexToRemove: number) => {
    triggerHaptic('selection');
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
      setDuplicateWarning(false);
    }
  };

  return (
    <div
      className={
        seamless
          ? 'pt-2 flex flex-col justify-between'
          : 'bg-surface border border-border-strong/65 rounded-[4px] p-4 sm:p-5 flex flex-col justify-between shadow-soft'
      }
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b border-dashed border-border">
          <div className="min-w-0">
            <h4 className="font-mono text-[11.5px] font-semibold text-primary uppercase tracking-[0.06em]">
              {title}
            </h4>
            {hint && (
              <p className="type-hand text-[17px] text-secondary mt-0.5 leading-[1.15]">
                {hint}
              </p>
            )}
          </div>

          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setDuplicateWarning(false);
              }}
              className="relative font-mono text-[11.5px] text-green-700 hover:text-green-900 px-2 py-1 rounded-[3px] hover:bg-surface-green active:scale-[0.95] transition-[background-color,color,transform] duration-[110ms] inline-flex items-center gap-1 font-semibold shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 before:content-[''] before:absolute before:-inset-1"
              title={t('tagManager.addItemTitle')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('tagManager.add')}</span>
            </button>
          )}
        </div>

        {/* Specimen Tags */}
        <div className="flex flex-wrap gap-2 min-h-[34px] items-center">
          {tags.length > 0 ? (
            tags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className={`inline-flex items-center gap-1.5 text-[12.5px] pl-2.5 pr-1.5 py-1 rounded-[3px] font-medium transition-colors ${
                  isAllergy
                    ? 'bg-danger-bg text-danger-text border border-danger-border font-mono text-[12px]'
                    : badgeVariant === 'warning'
                    ? 'bg-warning-bg text-warning-text border border-warning-border'
                    : badgeVariant === 'success'
                    ? 'bg-surface-green text-green-900 border border-green-300/70'
                    : 'bg-surface-soft text-primary border border-border-strong/50'
                }`}
              >
                <span className="break-words">{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="relative text-secondary hover:text-danger-text p-1 rounded-[2px] transition-[color,transform] duration-[110ms] active:scale-[0.88] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 before:content-[''] before:absolute before:-inset-2"
                  aria-label={t('tagManager.removeLabel', { tag })}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            !isAdding && (
              <span className="type-hand text-[17px] text-muted">{t('common.noneRecorded')}</span>
            )
          )}
        </div>
      </div>

      {/* Add Tag Input field */}
      {isAdding && (
        <div className="mt-4 pt-3 border-t border-dashed border-border space-y-2">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (duplicateWarning) setDuplicateWarning(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={effectivePlaceholder}
              aria-label={title}
              autoFocus
              className="flex-1 min-w-[160px] h-10 bg-surface border border-border-strong text-[13.5px] rounded-[3px] px-3 text-primary placeholder:text-muted focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="h-10 text-[12.5px] bg-btn-primary text-btn-primary-text px-3.5 rounded-[3px] font-semibold disabled:opacity-45 hover:bg-btn-primary-hover active:scale-[0.97] transition-[background-color,transform] duration-[110ms]"
              >
                {t('tagManager.add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setInputValue('');
                  setDuplicateWarning(false);
                }}
                className="h-10 text-[12.5px] text-secondary hover:text-primary px-2.5 rounded-[3px] hover:bg-surface-soft active:scale-[0.97] transition-[background-color,color,transform] duration-[110ms]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
          {duplicateWarning && (
            <p className="text-[12px] text-warning-text font-medium">
              {t('tagManager.duplicateHint')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
