import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Calendar } from 'lucide-react';
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const datePickerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  const relationshipChoices = [
    t('personForm.relSister'),
    t('personForm.relBrother'),
    t('personForm.relPartner'),
    t('personForm.relFriend'),
    t('personForm.relMother'),
    t('personForm.relFather'),
    t('personForm.relColleague'),
  ];

  const bioStarters = [
    t('personForm.bioStarterCoffee'),
    t('personForm.bioStarterCreative'),
    t('personForm.bioStarterIntrovert'),
    t('personForm.bioStarterFamily'),
    t('personForm.bioStarterTravel'),
  ];

  const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const shoeSizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
  const ringSizes = ['15', '15.5', '16', '16.5', '17', '17.5', '18'];

  const allergyChoices = [
    t('personForm.allergyNuts'),
    t('personForm.allergyDairy'),
    t('personForm.allergyGluten'),
    t('personForm.allergySeafood'),
    t('personForm.allergyCitrus'),
  ];

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

          {/* Full Name */}
          <Input
            id="person-form-name"
            ref={nameInputRef}
            label={t('personForm.nameLabel')}
            placeholder={t('personForm.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
          />

          {/* Relationship with Interactive Choice Chips */}
          <div className="space-y-1.5">
            <Input
              id="person-form-relationship"
              label={t('personForm.relationshipLabel')}
              placeholder={t('personForm.relationshipPlaceholder')}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-muted font-medium mr-0.5">
                {t('personForm.quickSuggestions')}
              </span>
              {relationshipChoices.map((choice) => {
                const isSelected = relationship.trim().toLowerCase() === choice.toLowerCase();
                return (
                  <button
                    key={choice}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setRelationship(isSelected ? '' : choice)}
                    className={`px-2.5 py-0.5 text-[11.5px] rounded-full border transition-[colors,box-shadow] duration-150 ${
                      isSelected
                        ? 'bg-green-700 text-inverse border-green-700 font-medium shadow-xs'
                        : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary hover:border-green-300'
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birthday with Text Input + Native Date Picker Button */}
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                id="person-form-birthday"
                label={t('personForm.birthdayLabel')}
                placeholder={t('personForm.birthdayPlaceholder')}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (datePickerInputRef.current) {
                    try {
                      (datePickerInputRef.current as any).showPicker?.();
                    } catch {
                      datePickerInputRef.current.focus();
                    }
                  }
                }}
                title={t('personForm.pickDate')}
                aria-label={t('personForm.pickDate')}
                className="absolute right-2.5 top-[32px] text-secondary hover:text-green-700 p-1.5 rounded-md hover:bg-surface-soft transition-colors"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <input
                ref={datePickerInputRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute opacity-0 pointer-events-none w-0 h-0 right-0 bottom-0"
                onChange={(e) => {
                  if (e.target.value) {
                    setBirthday(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {/* Short Bio with Quick Starter Prompts */}
          <div className="space-y-1.5">
            <Textarea
              id="person-form-bio"
              label={t('personForm.bioLabel')}
              placeholder={t('personForm.bioPlaceholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-muted font-medium mr-0.5">
                {t('personForm.quickSuggestions')}
              </span>
              {bioStarters.map((starter) => {
                const isSelected = bio.toLowerCase().includes(starter.toLowerCase());
                return (
                  <button
                    key={starter}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setBio((curr) => {
                        const trimmed = curr.trim();
                        if (!trimmed) return starter;
                        if (trimmed.toLowerCase().includes(starter.toLowerCase())) {
                          return trimmed
                            .replace(new RegExp(`(^|[,;\\s]+)${starter}([,;\\s]+|$)`, 'gi'), ' ')
                            .trim();
                        }
                        return `${trimmed}, ${starter}`;
                      });
                    }}
                    className={`px-2.5 py-0.5 text-[11.5px] rounded-full border transition-[colors,box-shadow] duration-150 ${
                      isSelected
                        ? 'bg-green-700 text-inverse border-green-700 font-medium shadow-xs'
                        : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary hover:border-green-300'
                    }`}
                  >
                    {starter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Sizes with Size Selector Chips */}
          <div className="pt-3 border-t border-border">
            <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider block mb-2.5">
              {t('personForm.keySizesLabel')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Input
                  id="person-form-clothing"
                  label={t('personDetail.clothingLabel')}
                  placeholder={t('personDetail.clothingPlaceholder')}
                  value={clothingSize}
                  onChange={(e) => setClothingSize(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {clothingSizes.map((size) => {
                    const isSelected = clothingSize.trim().toUpperCase() === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setClothingSize(isSelected ? '' : size)}
                        className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-green-700 text-inverse border-green-700 font-medium'
                            : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="person-form-shoe"
                  label={t('personDetail.shoeLabel')}
                  placeholder={t('personDetail.shoePlaceholder')}
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {shoeSizes.slice(0, 6).map((size) => {
                    const isSelected = shoeSize.trim() === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShoeSize(isSelected ? '' : size)}
                        className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-green-700 text-inverse border-green-700 font-medium'
                            : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Input
                  id="person-form-ring"
                  label={t('personDetail.ringLabel')}
                  placeholder={t('personDetail.ringPlaceholder')}
                  value={ringSize}
                  onChange={(e) => setRingSize(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {ringSizes.map((size) => {
                    const isSelected = ringSize.trim() === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setRingSize(isSelected ? '' : size)}
                        className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                          isSelected
                            ? 'bg-green-700 text-inverse border-green-700 font-medium'
                            : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Medical Allergies with Multi-Select Choice Chips */}
          <div className="space-y-1.5">
            <Input
              id="person-form-allergies"
              label={t('personForm.allergiesLabel')}
              placeholder={t('personForm.allergiesPlaceholder')}
              value={allergiesInput}
              onChange={(e) => setAllergiesInput(e.target.value)}
              hint={t('personForm.allergiesHint')}
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-muted font-medium mr-0.5">
                {t('personForm.quickSuggestions')}
              </span>
              {allergyChoices.map((allergy) => {
                const activeList = allergiesInput
                  .split(',')
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean);
                const isSelected = activeList.includes(allergy.toLowerCase());
                return (
                  <button
                    key={allergy}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const currentItems = allergiesInput
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      let next: string[];
                      if (currentItems.some((s) => s.toLowerCase() === allergy.toLowerCase())) {
                        next = currentItems.filter((s) => s.toLowerCase() !== allergy.toLowerCase());
                      } else {
                        next = [...currentItems, allergy];
                      }
                      setAllergiesInput(next.join(', '));
                    }}
                    className={`px-2.5 py-0.5 text-[11.5px] rounded-full border transition-[colors,box-shadow] duration-150 ${
                      isSelected
                        ? 'bg-green-700 text-inverse border-green-700 font-medium shadow-xs'
                        : 'bg-surface-soft text-secondary border-border hover:bg-surface-green/50 hover:text-primary hover:border-green-300'
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>
          </div>
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
