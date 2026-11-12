import React from 'react';
import { Gift, AlertTriangle, ArrowUpRight, Star } from 'lucide-react';
import { Person } from '../../types/person';
import { PersonAvatar } from './PersonAvatar';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatShortDate, selectPluralForm } from '../../i18n/helpers';
import { triggerHaptic } from '../../motion/haptics';

interface PersonCardProps {
  person: Person;
  giftCount?: number;
  index?: number;
  onSelect: (personId: string) => void;
  onToggleStar?: (personId: string, nextStarred: boolean) => void;
}

const ROTATION_CLASSES = [
  'md:rotate-[-0.7deg]',
  'md:rotate-[0.6deg]',
  'md:rotate-[-0.4deg]',
  'md:rotate-[0.8deg]',
];

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  giftCount = 0,
  index = 0,
  onSelect,
  onToggleStar,
}) => {
  const { t, language } = useTranslation();

  const formattedUpdated = formatShortDate(person.updatedAt, language);
  const hasAllergies = person.food.allergies && person.food.allergies.length > 0;

  const giftLabel = selectPluralForm(giftCount, language, {
    singular: t('personCard.giftSingular'),
    few: t('personCard.giftFew'),
    many: t('personCard.giftMany'),
  });

  const quickLines: Array<{ label: string; value: string }> = [];
  if (person.details.clothingSize) {
    quickLines.push({
      label: t('personCard.clothPrefix'),
      value: person.details.clothingSize.split('(')[0].trim(),
    });
  }
  if (person.details.shoeSize) {
    quickLines.push({
      label: t('personCard.shoePrefix'),
      value: person.details.shoeSize.split('(')[0].trim(),
    });
  }
  if (person.birthday) {
    quickLines.push({
      label: t('personCard.birthdayPrefix'),
      value: person.birthday.split(',')[0].trim(),
    });
  } else if (person.details.ringSize && quickLines.length < 3) {
    quickLines.push({
      label: t('personCard.ringPrefix'),
      value: person.details.ringSize.split('(')[0].trim(),
    });
  }

  const tiltClass = ROTATION_CLASSES[index % ROTATION_CLASSES.length];

  return (
    <article
      className={`group relative bg-surface border border-border-strong/65 hover:border-border-strong rounded-[4px] p-5 pt-6 shadow-card transition-[border-color,box-shadow,transform] duration-[170ms] ease-out motion-safe:${tiltClass} hover:rotate-0 hover:-translate-y-0.5 active:scale-[0.985] flex flex-col justify-between text-left`}
    >
      {/* Translucent Washi Tape Strip pinning card onto page */}
      <div
        aria-hidden="true"
        className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-[1px] pointer-events-none"
      />

      <div>
        {/* Top Header: Polaroid Avatar + Editorial Serif Name + Star Pin */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <PersonAvatar name={person.name} photoUrl={person.photoUrl} size="md" />
            <div className="min-w-0">
              <h3 className="font-serif text-[1.125rem] font-semibold tracking-[-0.015em] text-primary leading-[1.25] group-hover:text-green-900 transition-colors">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelect(person.id);
                  }}
                  aria-label={t('personCard.openProfile', { name: person.name })}
                  className="text-left block w-full truncate after:content-[''] after:absolute after:inset-0 after:rounded-[4px] focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-green-700/50"
                >
                  {person.name}
                </button>
              </h3>
              {person.relationship && (
                <p className="type-hand text-[18px] text-secondary leading-[1.1] mt-0.5 truncate">
                  {person.relationship}
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-0.5 shrink-0">
            {onToggleStar && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  onToggleStar(person.id, !person.starred);
                }}
                aria-pressed={!!person.starred}
                aria-label={
                  person.starred
                    ? t('personCard.unstarAction', { name: person.name })
                    : t('personCard.starAction', { name: person.name })
                }
                title={person.starred ? t('personCard.starred') : t('personDetail.starProfile')}
                className={`relative w-8 h-8 rounded-sm flex items-center justify-center transition-[color,background-color,transform] duration-[110ms] active:scale-[0.86] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 before:content-[''] before:absolute before:-inset-1 ${
                  person.starred
                    ? 'text-warning bg-warning-bg border border-warning-border'
                    : 'text-muted hover:text-primary hover:bg-surface-soft'
                }`}
              >
                <Star className={`w-4 h-4 ${person.starred ? 'fill-current' : ''}`} />
              </button>
            )}
            <ArrowUpRight
              aria-hidden="true"
              className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-[150ms]"
            />
          </div>
        </div>

        {/* Short Bio Quote or Monospace Quick-Ref Slip */}
        {person.bio && (
          <p className="mt-3.5 font-serif italic text-[13px] text-secondary leading-[1.45] line-clamp-2 break-words">
            “{person.bio}”
          </p>
        )}

        {quickLines.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-dashed border-border space-y-1">
            {quickLines.map((line, i) => (
              <div
                key={i}
                className="font-mono text-[12px] leading-[1.45] flex items-baseline justify-between gap-2 min-w-0"
              >
                <span className="text-muted uppercase tracking-[0.04em] text-[11px] shrink-0">
                  {line.label}
                </span>
                <span className="flex-1 border-b border-dotted border-border-strong/45 min-w-[12px]" />
                <span className="text-primary font-medium truncate tabular-nums">
                  {line.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rubber Ink Allergy Stamp */}
        {hasAllergies && (
          <div className="mt-3.5">
            <span className="ink-stamp inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-[2px] bg-danger-bg text-danger-text border-danger-border max-w-full">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {t('personCard.allergyPrefix')}: {person.food.allergies[0].split('(')[0].trim()}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-2.5 border-t border-border/80 flex items-center justify-between gap-2 font-mono text-[11px] text-muted tabular-nums">
        <div className="flex items-center gap-1.5 min-w-0">
          {giftCount > 0 && (
            <div className="inline-flex items-center gap-1.5 text-secondary font-medium truncate">
              <Gift className="w-3.5 h-3.5 text-green-700 shrink-0" />
              <span className="truncate">
                {giftCount} {giftLabel}
              </span>
            </div>
          )}
        </div>

        <span className="shrink-0">
          {t('personCard.updatedPrefix')} {formattedUpdated}
        </span>
      </div>
    </article>
  );
};
