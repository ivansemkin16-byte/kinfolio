import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/types';
import { useToast } from '../../hooks/useToast';
import { resolveTranslation } from '../../i18n/helpers';
import { SegmentedControl } from './SegmentedControl';

interface LanguageSwitcherProps {
  compact?: boolean;
  showIcon?: boolean;
  notifyOnSwitch?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  showIcon = false,
  notifyOnSwitch = true,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const { showToast } = useToast();

  const handleSelect = async (lang: Language) => {
    if (lang === language) return;
    await setLanguage(lang);
    if (notifyOnSwitch) {
      showToast(resolveTranslation(lang, 'toasts.languageChanged'));
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {showIcon && <Globe className="w-4 h-4 text-secondary shrink-0" />}
      <SegmentedControl<Language>
        ariaLabel={t('settings.languageLabel')}
        roleMode="radiogroup"
        size={compact ? 'xs' : 'sm'}
        value={language}
        onChange={handleSelect}
        options={[
          {
            value: 'en',
            label: compact ? 'EN' : 'English',
            ariaLabel: 'English',
          },
          {
            value: 'ru',
            label: compact ? 'RU' : 'Русский',
            ariaLabel: 'Русский',
          },
        ]}
      />
    </div>
  );
};
