import React, { useEffect, useRef } from 'react';
import { Users, Gift, Search, Settings, Lock, Sun, Moon, Monitor, BookOpen } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { ContentContainer } from './ContentContainer';
import { ActiveView } from '../../types/navigation';
import { ThemeMode } from '../../types/settings';
import { useModalDepth } from '../../motion/ModalDepthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { triggerHaptic } from '../../motion/haptics';

interface AppLayoutProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  peopleCount: number;
  giftsCount: number;
  hasPasscode?: boolean;
  onLockNow?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeView,
  onNavigate,
  peopleCount,
  giftsCount,
  hasPasscode = false,
  onLockNow,
  children,
}) => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { attachShellElement, openCount } = useModalDepth();
  const isModalActive = openCount > 0;

  useEffect(() => {
    attachShellElement(shellRef.current);
    return () => attachShellElement(null);
  }, [attachShellElement]);

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

  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.platform);

  const edgeTabs: Array<{
    id: ActiveView;
    label: string;
    icon: typeof Users;
    badge?: number;
    bgVar: string;
  }> = [
    {
      id: 'people',
      label: t('nav.people'),
      icon: Users,
      badge: peopleCount,
      bgVar: 'var(--tab-people)',
    },
    {
      id: 'gifts',
      label: t('nav.giftsShort'),
      icon: Gift,
      badge: giftsCount,
      bgVar: 'var(--tab-gifts)',
    },
    {
      id: 'search',
      label: t('nav.search'),
      icon: Search,
      bgVar: 'var(--tab-search)',
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      bgVar: 'var(--tab-settings)',
    },
  ];

  return (
    <>
      <div
        ref={shellRef}
        data-modal-active={isModalActive ? 'true' : 'false'}
        aria-hidden={isModalActive ? true : undefined}
        className="app-shell-depth min-h-screen flex flex-col md:py-5 md:px-4 lg:py-7 lg:px-8 antialiased"
      >
        {/* Mobile Top Header */}
        <Header
          activeView={activeView}
          hasPasscode={hasPasscode}
          onLockNow={onLockNow}
        />

        {/* Open Hardcover Notebook Frame (Desktop/Tablet) & Paper Page (Mobile) */}
        <div className="flex-1 w-full max-w-[1220px] mx-auto flex items-stretch min-w-0">
          {/* Outer Leather Binding */}
          <div className="flex-1 min-w-0 flex flex-col md:bg-cover-leather md:p-[7px] md:rounded-[14px] md:shadow-book border-l-[5px] md:border-l-0 border-cover-leather">
            {/* Inner Cream Grid-Paper Folio */}
            <div className="flex-1 min-w-0 paper-grid md:rounded-[8px] md:border md:border-border/80 flex flex-col relative">
              {/* Desktop Bookplate / Desk Ribbon Header */}
              <div className="hidden md:flex items-center justify-between gap-4 px-7 lg:px-10 py-3.5 border-b border-border/80 bg-surface/55 rounded-t-[8px]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onNavigate('people');
                  }}
                  className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 rounded-sm"
                >
                  <span className="w-8 h-8 rounded-sm bg-surface-kraft border border-border-strong/60 flex items-center justify-center text-primary shadow-soft group-hover:rotate-[-3deg] transition-transform">
                    <BookOpen className="w-4 h-4 text-green-700" />
                  </span>
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="font-serif text-[17px] font-semibold tracking-[-0.015em] text-primary">
                      {t('app.name')}
                    </span>
                    <span className="type-hand text-[20px] text-secondary leading-none">
                      — {t('app.slogan')}
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onNavigate('search');
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface border border-border hover:border-border-strong text-[12.5px] text-secondary hover:text-primary active:scale-[0.96] transition-[border-color,color,transform] duration-[110ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
                  >
                    <Search className="w-3.5 h-3.5 text-green-700" />
                    <span>{t('nav.search')}</span>
                    <kbd className="font-mono text-[10.5px] px-1.5 py-0.2 rounded-[3px] bg-surface-soft text-muted border border-border">
                      {isMac ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={cycleTheme}
                    title={`${t('settings.themeLabel')}: ${themeLabel}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-surface border border-border hover:border-border-strong text-[12px] font-medium text-primary active:scale-[0.96] transition-[border-color,transform] duration-[110ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
                  >
                    <ThemeIcon className="w-3.5 h-3.5 text-green-700" />
                    <span className="hidden lg:inline">{themeLabel}</span>
                  </button>

                  <LanguageSwitcher compact />

                  {hasPasscode && onLockNow && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onLockNow();
                      }}
                      title={t('settings.lockNowBtn')}
                      aria-label={t('settings.lockNowBtn')}
                      className="w-8 h-8 rounded-sm bg-surface border border-border hover:border-border-strong text-secondary hover:text-primary flex items-center justify-center active:scale-[0.93] transition-[color,border-color,transform] duration-[110ms] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Page Spread Content */}
              <main className="flex-1 min-w-0 pb-24 md:pb-8">
                <ContentContainer>{children}</ContentContainer>
              </main>
            </div>
          </div>

          {/* Right-Edge Protruding Paper Bookmark Tabs (Desktop & Tablet) */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex flex-col gap-2.5 pt-20 -ml-[3px] z-10 shrink-0 select-none"
          >
            {edgeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                activeView === tab.id ||
                (tab.id === 'people' && activeView === 'person-detail');

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (!isActive) triggerHaptic('selection');
                    onNavigate(tab.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  style={{ backgroundColor: tab.bgVar }}
                  className={`group relative flex items-center justify-between gap-2.5 pl-3.5 pr-3.5 lg:pr-4 py-2.5 rounded-r-md border border-l-0 border-border-strong/80 text-primary transition-[transform,box-shadow,opacity] duration-[150ms] ease-out active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/50 ${
                    isActive
                      ? 'translate-x-1 shadow-card font-semibold z-20 border-border-strong'
                      : 'opacity-85 hover:opacity-100 hover:translate-x-0.5 shadow-soft'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-primary stroke-[2.2]' : 'text-secondary stroke-[1.75]'
                      }`}
                    />
                    <span className="hidden lg:inline text-[13px] tracking-[-0.005em] whitespace-nowrap">
                      {tab.label}
                    </span>
                  </div>

                  {tab.badge !== undefined && (
                    <span className="hidden lg:inline-flex items-center justify-center font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded-[3px] bg-surface/80 text-primary tabular-nums border border-border/70">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Bookmark Tabs outside transformed shell */}
      <div aria-hidden={isModalActive ? true : undefined}>
        <BottomNav
          activeView={activeView}
          onNavigate={onNavigate}
          peopleCount={peopleCount}
          giftsCount={giftsCount}
        />
      </div>
    </>
  );
};
