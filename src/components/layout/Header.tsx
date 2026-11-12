import React, { useEffect, useState } from 'react';
import { Lock, Moon, Sun, Monitor, BookOpen } from 'lucide-react';
import { ActiveView } from '../../types/navigation';
import { ThemeMode } from '../../types/settings';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { IconButton } from '../common/IconButton';
import { triggerHaptic } from '../../motion/haptics';

interface HeaderProps {
  activeView: ActiveView;
  title?: string;
  hasPasscode?: boolean;
  onLockNow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  title,
  hasPasscode = false,
  onLockNow,
}) => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getHeaderTitle = () => {
    if (title) return title;
    switch (activeView) {
      case 'people':
        return t('nav.people');
      case 'person-detail':
        return t('nav.profile');
      case 'gifts':
        return t('nav.giftsShort');
      case 'search':
        return t('nav.search');
      case 'settings':
        return t('nav.settings');
      default:
        return t('app.name');
    }
  };

  const cycleTheme = () => {
    triggerHaptic('selection');
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    setThemeMode(next);
  };

  const ThemeIcon = themeMode === 'dark' ? Moon : themeMode === 'light' ? Sun : Monitor;
  const themeLabel =
    themeMode === 'dark'
      ? t('settings.themeDark')
      : themeMode === 'light'
      ? t('settings.themeLight')
      : t('settings.themeSystem');

  return (
    <header
      data-scrolled={scrolled}
      className="md:hidden sticky top-0 z-30 material-chrome scroll-edge-header px-3.5 h-14 flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-sm bg-surface-kraft border border-border-strong/60 flex items-center justify-center text-primary shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-green-700" />
        </div>
        <span className="font-serif text-[16px] font-semibold tracking-[-0.012em] text-primary truncate">
          {getHeaderTitle()}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasPasscode && onLockNow && (
          <IconButton
            label={t('settings.lockNowBtn')}
            size="sm"
            onClick={() => {
              triggerHaptic('selection');
              onLockNow();
            }}
          >
            <Lock className="w-4 h-4" />
          </IconButton>
        )}
        <IconButton
          label={`${t('settings.themeLabel')}: ${themeLabel}`}
          size="sm"
          onClick={cycleTheme}
        >
          <ThemeIcon className="w-4 h-4" />
        </IconButton>
        <LanguageSwitcher compact />
      </div>
    </header>
  );
};
