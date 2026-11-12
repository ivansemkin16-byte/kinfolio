import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { Person } from '../../types/person';
import { GiftIdea, GiftStatus, CreateGiftInput, UpdateGiftInput } from '../../types/gift';
import { processImageFile } from '../../services/imageService';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { useTranslation } from '../../i18n/LanguageContext';

interface GiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (giftData: CreateGiftInput | UpdateGiftInput) => void;
  people: Person[];
  defaultPersonId?: string;
  initialGift?: GiftIdea | null;
}

export const GiftFormModal: React.FC<GiftFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  people,
  defaultPersonId,
  initialGift,
}) => {
  const { t } = useTranslation();
  const [personId, setPersonId] = useState(defaultPersonId || people[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('€');
  const [occasion, setOccasion] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<GiftStatus>('idea');
  const [error, setError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialGift) {
      setPersonId(initialGift.personId);
      setTitle(initialGift.title);
      setDescription(initialGift.description || '');
      setPrice(initialGift.price ? String(initialGift.price) : '');
      setCurrency(initialGift.currency || '€');
      setOccasion(initialGift.occasion || '');
      setUrl(initialGift.url || '');
      setImageUrl(initialGift.imageUrl);
      setStatus(initialGift.status);
    } else {
      setPersonId(defaultPersonId || people[0]?.id || '');
      setTitle('');
      setDescription('');
      setPrice('');
      setCurrency('€');
      setOccasion('');
      setUrl('');
      setImageUrl(undefined);
      setStatus('idea');
    }
    setError('');
    setShowUnsavedConfirm(false);
    // Reset only when modal opens or edited item/default target changes (not when `people` refreshes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGift?.id, defaultPersonId, isOpen]);

  const isDirty = (() => {
    if (!isOpen) return false;
    if (initialGift) {
      return (
        title !== initialGift.title ||
        description !== (initialGift.description || '') ||
        price !== (initialGift.price ? String(initialGift.price) : '') ||
        currency !== (initialGift.currency || '€') ||
        occasion !== (initialGift.occasion || '') ||
        url !== (initialGift.url || '') ||
        imageUrl !== initialGift.imageUrl ||
        status !== initialGift.status
      );
    }
    return Boolean(
      title.trim() || description.trim() || price.trim() || occasion.trim() || url.trim() || imageUrl
    );
  })();

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await processImageFile(file, 800, 0.85);
      setImageUrl(compressedDataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('giftForm.titleError'));
      return;
    }
    if (!personId) {
      setError(t('giftForm.recipientError'));
      return;
    }

    onSave({
      personId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      currency,
      occasion: occasion.trim() || undefined,
      url: url.trim() || undefined,
      imageUrl: imageUrl || undefined,
      status,
    });

    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleAttemptClose}
        title={initialGift ? t('giftForm.editTitle') : t('giftForm.addTitle')}
        subtitle={t('giftForm.subtitle')}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={handleAttemptClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="gift-form" variant="primary">
              {initialGift ? t('giftForm.updateGift') : t('giftForm.saveGift')}
            </Button>
          </div>
        }
      >
        <form id="gift-form" onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('giftForm.recipientLabel')}
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            disabled={!!initialGift}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.relationship ? `(${p.relationship})` : ''}
              </option>
            ))}
          </Select>

          <Input
            label={t('giftForm.titleLabel')}
            placeholder={t('giftForm.titlePlaceholder')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex gap-2">
              <div className="w-20 shrink-0">
                <Select
                  label={t('giftForm.currencyLabel')}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="€">€</option>
                  <option value="$">$</option>
                  <option value="£">£</option>
                  <option value="₽">₽</option>
                </Select>
              </div>
              <div className="flex-1">
                <Input
                  label={t('giftForm.priceLabel')}
                  type="number"
                  placeholder="45"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <Input
              label={t('giftForm.occasionLabel')}
              placeholder={t('giftForm.occasionPlaceholder')}
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
            />
          </div>

          <Input
            label={t('giftForm.urlLabel')}
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <Textarea
            label={t('giftForm.notesLabel')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('giftForm.notesPlaceholder')}
            rows={2}
          />

          {/* Local Image Upload */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-primary">
              {t('giftForm.photoLabel')}
            </span>
            {imageUrl ? (
              <div className="relative inline-block w-28 h-28 border border-border rounded-md overflow-hidden group">
                <img
                  src={imageUrl}
                  alt="Gift preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="absolute inset-0 bg-[var(--color-scrim)] text-white flex items-center justify-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label={t('giftForm.removePhoto')}
                  title={t('giftForm.removePhoto')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="gift-photo-input"
                />
                <label
                  htmlFor="gift-photo-input"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-border rounded-md text-[13px] text-secondary hover:text-primary hover:border-green-300 cursor-pointer transition-colors bg-surface-soft/70"
                >
                  <ImageIcon className="w-4 h-4 text-green-700" />
                  <span>{isProcessingImage ? t('giftForm.optimizingPhoto') : t('giftForm.uploadPhoto')}</span>
                </label>
              </div>
            )}
          </div>

          <Select
            label={t('giftForm.statusLabel')}
            value={status}
            onChange={(e) => setStatus(e.target.value as GiftStatus)}
          >
            <option value="idea">{t('giftForm.statusOptionIdea')}</option>
            <option value="bought">{t('giftForm.statusOptionBought')}</option>
            <option value="given">{t('giftForm.statusOptionGiven')}</option>
            <option value="archived">{t('giftForm.statusOptionArchived')}</option>
          </Select>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showUnsavedConfirm}
        onClose={() => setShowUnsavedConfirm(false)}
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          onClose();
        }}
        title={t('personForm.unsavedTitle')}
        description={t('personForm.unsavedDesc')}
        cancelLabel={t('personForm.keepEditing')}
        confirmLabel={t('personForm.discardChanges')}
      />
    </>
  );
};
