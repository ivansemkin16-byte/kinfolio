import React from 'react';
import { Users, Gift, Search, Settings } from 'lucide-react';
import { ActiveView } from '../../types/navigation';
import { useTranslation } from '../../i18n/LanguageContext';
import { triggerHaptic } from '../../motion/haptics';

interface BottomNavProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  peopleCount: number;
  giftsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onNavigate,
  peopleCount,
  giftsCount,
}) => {
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'people' as ActiveView,
      label: t('nav.people'),
      icon: Users,
      badge: peopleCount,
      tabColor: 'var(--tab-people)',
    },
    {
      id: 'gifts' as ActiveView,
      label: t('nav.giftsShort'),
      icon: Gift,
      badge: giftsCount,
      tabColor: 'var(--tab-gifts)',
    },
    {
      id: 'search' as ActiveView,
      label: t('nav.search'),
      icon: Search,
      tabColor: 'var(--tab-search)',
    },
    {
      id: 'settings' as ActiveView,
      label: t('nav.settings'),
      icon: Settings,
      tabColor: 'var(--tab-settings)',
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 material-chrome-heavy border-t border-border-strong/70 shadow-[0_-4px_18px_rgba(35,30,25,0.10)] px-2 pt-1.5 pb-safe flex items-end justify-around gap-1"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          activeView === item.id ||
          (item.id === 'people' && activeView === 'person-detail');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!isActive) {
                triggerHaptic('selection');
              }
              onNavigate(item.id);
            }}
            aria-current={isActive ? 'page' : undefined}
            style={isActive ? { backgroundColor: item.tabColor } : undefined}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-t-md min-h-[48px] transition-[background-color,color,transform] duration-[120ms] ease-out active:scale-[0.93] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 ${
              isActive
                ? 'text-primary font-semibold border border-b-0 border-border-strong/70 shadow-soft -translate-y-0.5'
                : 'text-secondary font-medium hover:text-primary'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-[18px] h-[18px] ${
                  isActive ? 'text-primary stroke-[2.1]' : 'stroke-[1.75]'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 font-mono text-[9.5px] min-w-[15px] h-[15px] px-1 rounded-[3px] bg-btn-primary text-btn-primary-text flex items-center justify-center font-semibold tabular-nums">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 leading-tight tracking-[0.005em] truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
