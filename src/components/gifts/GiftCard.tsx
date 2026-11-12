import React from 'react';
import { ExternalLink, Edit3, Trash2 } from 'lucide-react';
import { GiftIdea, GiftStatus } from '../../types/gift';
import { GiftImage } from './GiftImage';
import { GiftStatusBadge } from './GiftStatusBadge';
import { IconButton } from '../common/IconButton';
import { useTranslation } from '../../i18n/LanguageContext';
import { sanitizeExternalUrl } from '../../utils/url';
import { triggerHaptic } from '../../motion/haptics';

interface GiftCardProps {
  gift: GiftIdea;
  recipientName?: string;
  recipientRelationship?: string;
  showImagePlaceholder?: boolean;
  onSelectPerson?: (personId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: GiftStatus) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  recipientName,
  recipientRelationship,
  showImagePlaceholder = true,
  onSelectPerson,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const { t } = useTranslation();
  const safeUrl = sanitizeExternalUrl(gift.url);

  const getStatusLabel = (status: GiftStatus) => {
    switch (status) {
      case 'idea':
        return t('gifts.statusIdea');
      case 'bought':
        return t('gifts.statusBought');
      case 'given':
        return t('gifts.statusGiven');
      case 'archived':
        return t('gifts.statusArchived');
    }
  };

  return (
    <article className="relative bg-surface border border-border-strong/65 hover:border-border-strong rounded-[4px] overflow-hidden shadow-card transition-[border-color,box-shadow,transform] duration-[150ms] hover:-translate-y-0.5 flex flex-col justify-between">
      {/* Subtle top kraft parcel tape accent when no photo */}
      {!gift.imageUrl && (
        <div
          aria-hidden="true"
          className="h-1.5 w-full bg-surface-kraft border-b border-border/70"
        />
      )}

      <div>
        <GiftImage
          src={gift.imageUrl}
          alt={gift.title}
          showPlaceholder={showImagePlaceholder}
        />

        <div className="p-5">
          {/* Top metadata row: handwritten recipient OR status stamp + Edit/Delete */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              {recipientName && onSelectPerson ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectPerson(gift.personId);
                  }}
                  className="type-hand text-[19px] leading-tight text-green-700 hover:text-green-900 hover:underline font-semibold text-left block w-full max-w-full pr-1.5 truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 rounded-sm"
                >
                  {t('gifts.forPerson', { name: recipientName })}
                  {recipientRelationship ? ` · ${recipientRelationship}` : ''}
                </button>
              ) : (
                <GiftStatusBadge status={gift.status} />
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-1">
              <IconButton label={t('gifts.editGift')} size="sm" onClick={onEdit}>
                <Edit3 className="w-3.5 h-3.5" />
              </IconButton>
              <IconButton
                label={t('gifts.deleteGift')}
                variant="danger"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          </div>

          <h3 className="font-serif text-[1.0625rem] font-semibold tracking-[-0.012em] text-primary leading-[1.3] break-words">
            {gift.title}
          </h3>

          {gift.description && (
            <p className="text-[13.5px] text-secondary mt-2 leading-[1.52] line-clamp-3 break-words">
              {gift.description}
            </p>
          )}

          {(gift.price !== undefined || gift.occasion || safeUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 font-mono text-[12px]">
              {gift.price !== undefined && (
                <span className="font-semibold text-primary bg-surface-kraft/85 px-2.5 py-0.5 rounded-[2px] border border-border-strong/50 tabular-nums">
                  {gift.currency || '€'}
                  {gift.price}
                </span>
              )}
              {gift.occasion && (
                <span className="text-secondary bg-surface-soft px-2.5 py-0.5 rounded-[2px] border border-border break-words">
                  {gift.occasion}
                </span>
              )}
              {safeUrl && (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-700 hover:text-green-900 hover:underline font-medium px-1 py-0.5 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
                >
                  <span>{t('gifts.storeLink')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Single-row Rubber Stamp Status Track */}
      <div className="px-3 py-2 bg-surface-soft/70 border-t border-dashed border-border-strong/60">
        <div
          className="grid grid-cols-4 gap-1"
          role="group"
          aria-label={t('gifts.statusGroupLabel')}
        >
          {(['idea', 'bought', 'given', 'archived'] as GiftStatus[]).map((st) => {
            const isSelected = gift.status === st;
            return (
              <button
                key={st}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  if (!isSelected) {
                    triggerHaptic('selection');
                    onUpdateStatus(st);
                  }
                }}
                className={`relative font-mono text-[10.5px] sm:text-[11px] uppercase tracking-[0.04em] px-1 py-1.5 rounded-[3px] truncate text-center transition-[background-color,color,border-color,transform] duration-[110ms] active:scale-[0.94] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 before:content-[''] before:absolute before:-inset-y-1.5 before:inset-x-0 ${
                  isSelected
                    ? 'bg-btn-primary text-btn-primary-text font-semibold shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-surface'
                }`}
              >
                {getStatusLabel(st)}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
};
