import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Person, CreatePersonInput, UpdatePersonInput } from '../../types/person';
import { processImageFile } from '../../services/imageService';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { PersonAvatar } from './PersonAvatar';
import { useTranslation } from '../../i18n/LanguageContext';

interface PersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: CreatePersonInput | UpdatePersonInput) => void;
  initialPerson?: Person | null;
}

export const PersonFormModal: React.FC<PersonFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPerson,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthday, setBirthday] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [clothingSize, setClothingSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [ringSize, setRingSize] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [error, setError] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialPerson) {
      setName(initialPerson.name);
      setRelationship(initialPerson.relationship || '');
      setBirthday(initialPerson.birthday || '');
      setBio(initialPerson.bio || '');
      setPhotoUrl(initialPerson.photoUrl);
      setClothingSize(initialPerson.details?.clothingSize || '');
      setShoeSize(initialPerson.details?.shoeSize || '');
      setRingSize(initialPerson.details?.ringSize || '');
      setAllergiesInput(initialPerson.food?.allergies?.join(', ') || '');
    } else {
      setName('');
      setRelationship('');
      setBirthday('');
      setBio('');
      setPhotoUrl(undefined);
      setClothingSize('');
      setShoeSize('');
      setRingSize('');
      setAllergiesInput('');
    }
    setError('');
    setShowUnsavedConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPerson?.id, isOpen]);

  const isDirty = (() => {
    if (!isOpen) return false;
    if (initialPerson) {
      return (
        name !== initialPerson.name ||
        relationship !== (initialPerson.relationship || '') ||
        birthday !== (initialPerson.birthday || '') ||
        bio !== (initialPerson.bio || '') ||
        photoUrl !== initialPerson.photoUrl ||
        clothingSize !== (initialPerson.details?.clothingSize || '') ||
        shoeSize !== (initialPerson.details?.shoeSize || '') ||
        ringSize !== (initialPerson.details?.ringSize || '') ||
        allergiesInput !== (initialPerson.food?.allergies?.join(', ') || '')
      );
    }
    return Boolean(
      name.trim() ||
        relationship.trim() ||
        birthday.trim() ||
        bio.trim() ||
        photoUrl ||
        clothingSize.trim() ||
        shoeSize.trim() ||
        ringSize.trim() ||
        allergiesInput.trim()
    );
  })();

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      const compressed = await processImageFile(file, 400, 0.85);
      setPhotoUrl(compressed);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('personForm.nameError'));
      return;
    }

    const allergiesArray = allergiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      name: name.trim(),
      relationship: relationship.trim() || undefined,
      birthday: birthday.trim() || undefined,
      bio: bio.trim() || undefined,
      photoUrl: photoUrl || undefined,
      details: {
        clothingSize: clothingSize.trim() || undefined,
        shoeSize: shoeSize.trim() || undefined,
        ringSize: ringSize.trim() || undefined,
        height: initialPerson?.details?.height,
        customFields: initialPerson?.details?.customFields || [],
      },
      food: {
        allergies: allergiesArray,
        intolerances: initialPerson?.food?.intolerances || [],
        dietaryRestrictions: initialPerson?.food?.dietaryRestrictions || [],
        favoriteFoods: initialPerson?.food?.favoriteFoods || [],
        dislikedFoods: initialPerson?.food?.dislikedFoods || [],
        notes: initialPerson?.food?.notes,
      },
      preferences: initialPerson?.preferences || {
        colors: [],
        brands: [],
        scents: [],
        hobbies: [],
        likes: [],
        dislikes: [],
      },
    });

    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleAttemptClose}
        title={initialPerson ? t('personForm.editTitle') : t('personForm.addTitle')}
        subtitle={t('personForm.subtitle')}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={handleAttemptClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="person-form" variant="primary">
              {initialPerson ? t('personForm.saveChanges') : t('personForm.createPerson')}
            </Button>
          </div>
        }
      >
        <form id="person-form" onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar Photo Upload Row */}
          <div className="flex items-center gap-4 pb-1">
            <PersonAvatar name={name || '?'} photoUrl={photoUrl} size="lg" />
            <div className="space-y-1.5">
              <span className="text-[13px] font-medium text-primary block">
                {t('personForm.photoLabel')}
              </span>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="person-photo-input"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isProcessingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Camera className="w-3.5 h-3.5" />}
                >
                  {photoUrl ? t('personForm.changePhoto') : t('personForm.uploadPhoto')}
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setPhotoUrl(undefined)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                  >
                    {t('personForm.removePhoto')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Input
            label={t('personForm.nameLabel')}
            placeholder={t('personForm.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('personForm.relationshipLabel')}
              placeholder={t('personForm.relationshipPlaceholder')}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />

            <Input
              label={t('personForm.birthdayLabel')}
              placeholder={t('personForm.birthdayPlaceholder')}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          <Textarea
            label={t('personForm.bioLabel')}
            placeholder={t('personForm.bioPlaceholder')}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
          />

          <div className="pt-3 border-t border-border">
            <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider block mb-2.5">
              {t('personForm.keySizesLabel')}
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <Input
                label={t('personDetail.clothingLabel')}
                placeholder={t('personDetail.clothingPlaceholder')}
                value={clothingSize}
                onChange={(e) => setClothingSize(e.target.value)}
              />
              <Input
                label={t('personDetail.shoeLabel')}
                placeholder={t('personDetail.shoePlaceholder')}
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
              />
              <Input
                label={t('personDetail.ringLabel')}
                placeholder={t('personDetail.ringPlaceholder')}
                value={ringSize}
                onChange={(e) => setRingSize(e.target.value)}
              />
            </div>
          </div>

          <Input
            label={t('personForm.allergiesLabel')}
            placeholder={t('personForm.allergiesPlaceholder')}
            value={allergiesInput}
            onChange={(e) => setAllergiesInput(e.target.value)}
            hint={t('personForm.allergiesHint')}
          />
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
