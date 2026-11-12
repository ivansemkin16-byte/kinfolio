import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Gift as GiftIcon,
  Plus,
  AlertTriangle,
  Edit3,
  Trash2,
  Star,
} from 'lucide-react';
import { Person, UpdatePersonInput } from '../../types/person';
import { PersonProfileTab } from '../../types/navigation';
import { GiftIdea, GiftStatus } from '../../types/gift';
import { Note } from '../../types/note';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SegmentedControl } from '../common/SegmentedControl';
import { TagManager } from '../common/TagManager';
import { PersonAvatar } from './PersonAvatar';
import { DetailGroup, DetailItem } from './DetailGroup';
import { FoodCategory } from './FoodCategory';
import { CustomFieldsEditor } from './CustomFieldsEditor';
import { NoteEditorModal } from './NoteEditorModal';
import { GiftCard } from '../gifts/GiftCard';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatShortDate, selectPluralForm } from '../../i18n/helpers';
import { triggerHaptic } from '../../motion/haptics';
import { useMediaPreference } from '../../motion/useReducedMotion';

interface PersonDetailViewProps {
  person: Person;
  gifts: GiftIdea[];
  notes: Note[];
  initialTab?: PersonProfileTab;
  onBack: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => Promise<void> | void;
  onUpdatePerson: (input: UpdatePersonInput) => Promise<Person>;
  onAddGift: (personId: string) => void;
  onEditGift: (gift: GiftIdea) => void;
  onDeleteGift: (giftId: string) => Promise<void> | void;
  onUpdateGiftStatus: (giftId: string, status: GiftStatus) => void;
  onAddNote: (content: string, category?: string) => Promise<Note>;
  onUpdateNote: (noteId: string, content: string, category?: string) => Promise<Note>;
  onDeleteNote: (noteId: string) => Promise<void> | void;
}

const STICKY_VARIANTS = ['sticky-yellow', 'sticky-pink', 'sticky-sage', 'sticky-blue'];
const NOTE_TILTS = ['md:rotate-[-0.5deg]', 'md:rotate-[0.4deg]', 'md:rotate-[-0.3deg]', 'md:rotate-[0.5deg]'];

export const PersonDetailView: React.FC<PersonDetailViewProps> = ({
  person,
  gifts,
  notes,
  initialTab = 'details',
  onBack,
  onEditPerson,
  onDeletePerson,
  onUpdatePerson,
  onAddGift,
  onEditGift,
  onDeleteGift,
  onUpdateGiftStatus,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const { t, language } = useTranslation();
  const isDesktopSpread = useMediaPreference('(min-width: 1024px)');
  const [activeTab, setActiveTab] = useState<PersonProfileTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, person.id]);

  // Quick note inline capture state
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingQuickNote, setIsAddingQuickNote] = useState(false);

  // Modals & confirmation dialogs
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [giftToDelete, setGiftToDelete] = useState<GiftIdea | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sizes editing mode
  const [isEditingSizes, setIsEditingSizes] = useState(false);
  const [clothingSize, setClothingSize] = useState(person.details.clothingSize || '');
  const [shoeSize, setShoeSize] = useState(person.details.shoeSize || '');
  const [ringSize, setRingSize] = useState(person.details.ringSize || '');
  const [height, setHeight] = useState(person.details.height || '');

  // Food note state
  const [foodNote, setFoodNote] = useState(person.food.notes || '');
  const [isEditingFoodNote, setIsEditingFoodNote] = useState(false);

  useEffect(() => {
    if (!isEditingSizes) {
      setClothingSize(person.details.clothingSize || '');
      setShoeSize(person.details.shoeSize || '');
      setRingSize(person.details.ringSize || '');
      setHeight(person.details.height || '');
    }
    if (!isEditingFoodNote) {
      setFoodNote(person.food.notes || '');
    }
  }, [
    person.id,
    person.updatedAt,
    person.details.clothingSize,
    person.details.shoeSize,
    person.details.ringSize,
    person.details.height,
    person.food.notes,
    isEditingSizes,
    isEditingFoodNote,
  ]);

  const formattedUpdated = formatShortDate(person.updatedAt, language, true);
  const hasAllergies = person.food.allergies && person.food.allergies.length > 0;

  const effectiveTab: PersonProfileTab =
    isDesktopSpread && activeTab === 'details' ? 'notes' : activeTab;

  const rightPageTabs: { value: PersonProfileTab; label: string; badge?: number; isAlert?: boolean }[] = [
    ...(isDesktopSpread ? [] : [{ value: 'details' as const, label: t('personDetail.tabDetails') }]),
    { value: 'notes', label: t('personDetail.tabNotes'), badge: notes.length },
    { value: 'preferences', label: t('personDetail.tabPreferences') },
    {
      value: 'food',
      label: t('personDetail.tabFood'),
      badge: hasAllergies ? person.food.allergies.length : undefined,
      isAlert: hasAllergies,
    },
    { value: 'gifts', label: t('personDetail.tabGifts'), badge: gifts.length },
  ];

  const handleSaveSizes = async () => {
    await onUpdatePerson({
      details: {
        ...person.details,
        clothingSize: clothingSize.trim() || undefined,
        shoeSize: shoeSize.trim() || undefined,
        ringSize: ringSize.trim() || undefined,
        height: height.trim() || undefined,
      },
    });
    setIsEditingSizes(false);
  };

  const handleSaveFoodNote = async () => {
    await onUpdatePerson({
      food: {
        ...person.food,
        notes: foodNote.trim() || undefined,
      },
    });
    setIsEditingFoodNote(false);
  };

  const handleCreateQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    await onAddNote(newNoteText.trim());
    setNewNoteText('');
    setIsAddingQuickNote(false);
  };

  const personGiftsCountText = selectPluralForm(gifts.length, language, {
    singular: t('gifts.personGiftsSingular', { count: gifts.length }),
    few: t('gifts.personGiftsFew', { count: gifts.length }),
    many: t('gifts.personGiftsMany', { count: gifts.length }),
  });

  const renderSizesReceipt = () => (
    <div className="space-y-5 pt-1">
      {isEditingSizes ? (
        <section className="receipt-slip border border-border-strong/75 rounded-[2px] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-border-strong">
            <h3 className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-[0.07em]">
              {t('personDetail.sizesHeading')}
            </h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingSizes(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveSizes}>
                {t('personDetail.saveSizes')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="detail-clothing-size"
                className="font-mono text-[11.5px] uppercase tracking-[0.04em] text-secondary block mb-1"
              >
                {t('personDetail.clothingSizeLabel')}
              </label>
              <input
                id="detail-clothing-size"
                type="text"
                value={clothingSize}
                onChange={(e) => setClothingSize(e.target.value)}
                placeholder={t('personDetail.clothingPlaceholder')}
                className="w-full h-10 bg-surface border border-border-strong rounded-[3px] px-3 font-mono text-[13px] text-primary focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
              />
            </div>
            <div>
              <label
                htmlFor="detail-shoe-size"
                className="font-mono text-[11.5px] uppercase tracking-[0.04em] text-secondary block mb-1"
              >
                {t('personDetail.shoeSizeLabel')}
              </label>
              <input
                id="detail-shoe-size"
                type="text"
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                placeholder={t('personDetail.shoePlaceholder')}
                className="w-full h-10 bg-surface border border-border-strong rounded-[3px] px-3 font-mono text-[13px] text-primary focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
              />
            </div>
            <div>
              <label
                htmlFor="detail-ring-size"
                className="font-mono text-[11.5px] uppercase tracking-[0.04em] text-secondary block mb-1"
              >
                {t('personDetail.ringSizeLabel')}
              </label>
              <input
                id="detail-ring-size"
                type="text"
                value={ringSize}
                onChange={(e) => setRingSize(e.target.value)}
                placeholder={t('personDetail.ringPlaceholder')}
                className="w-full h-10 bg-surface border border-border-strong rounded-[3px] px-3 font-mono text-[13px] text-primary focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
              />
            </div>
            <div>
              <label
                htmlFor="detail-height"
                className="font-mono text-[11.5px] uppercase tracking-[0.04em] text-secondary block mb-1"
              >
                {t('personDetail.heightLabel')}
              </label>
              <input
                id="detail-height"
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={t('personDetail.heightPlaceholder')}
                className="w-full h-10 bg-surface border border-border-strong rounded-[3px] px-3 font-mono text-[13px] text-primary focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/15"
              />
            </div>
          </div>
        </section>
      ) : (
        <DetailGroup
          title={t('personDetail.sizesHeading')}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setClothingSize(person.details.clothingSize || '');
                setShoeSize(person.details.shoeSize || '');
                setRingSize(person.details.ringSize || '');
                setHeight(person.details.height || '');
                setIsEditingSizes(true);
              }}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              {t('personDetail.editSizes')}
            </Button>
          }
        >
          <DetailItem
            label={t('personDetail.clothingLabel')}
            value={person.details.clothingSize}
            emptyText={t('personDetail.notSpecified')}
          />
          <DetailItem
            label={t('personDetail.shoeLabel')}
            value={person.details.shoeSize}
            emptyText={t('personDetail.notSpecified')}
          />
          <DetailItem
            label={t('personDetail.ringLabel')}
            value={person.details.ringSize}
            emptyText={t('personDetail.notSpecified')}
          />
          <DetailItem
            label={t('personDetail.heightLabel')}
            value={person.details.height}
            emptyText={t('personDetail.notSpecified')}
          />
        </DetailGroup>
      )}

      <CustomFieldsEditor
        fields={person.details.customFields || []}
        onChange={(updatedCustomFields) => {
          onUpdatePerson({
            details: {
              ...person.details,
              customFields: updatedCustomFields,
            },
          });
        }}
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Top Return Chapter Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onBack();
          }}
          className="inline-flex items-center gap-2 min-h-[40px] font-mono text-[12.5px] uppercase tracking-[0.04em] text-secondary hover:text-primary transition-[color,background-color,transform] duration-[110ms] active:scale-[0.96] py-1.5 px-2.5 -ml-2.5 rounded-sm hover:bg-surface-soft/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('personDetail.backToPeople')}</span>
        </button>
      </div>

      {/* Open Two-Page Journal Spread (Left Page = Portrait & Size Receipt, Right Page = Living Memory) */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(320px,0.92fr)_1.25fr] gap-8 lg:gap-12 items-start">
        {/* Subtle Center Book Spine Crease on Desktop Spread */}
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute top-0 bottom-0 left-[42.4%] w-10 -translate-x-1/2 book-spine-gutter"
        />

        {/* LEFT PAGE: Pinned Portrait, Allergy Stamp, Sizes Receipt & Delete */}
        <div className="space-y-6 min-w-0">
          {/* Pinned Chapter Card */}
          <header className="relative bg-surface border border-border-strong/75 rounded-[4px] p-5 sm:p-6 pt-7 shadow-card">
            <div
              aria-hidden="true"
              className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-[1px] pointer-events-none"
            />

            <div className="flex items-start gap-4 min-w-0">
              <PersonAvatar name={person.name} photoUrl={person.photoUrl} size="xl" />
              <div className="min-w-0 flex-1">
                <h1 className="type-display text-primary break-words">{person.name}</h1>
                {person.relationship && (
                  <p className="type-hand text-[22px] text-green-700 leading-[1.15] mt-0.5">
                    {person.relationship}
                  </p>
                )}
              </div>
            </div>

            {person.bio && (
              <p className="mt-4 pt-3.5 border-t border-dashed border-border font-serif italic text-[14.5px] text-secondary leading-[1.55] break-words">
                “{person.bio}”
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 font-mono text-[11.5px] text-secondary tabular-nums">
              {person.birthday && (
                <div className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-green-700" />
                  <span>{person.birthday}</span>
                </div>
              )}
              <span className="text-muted">
                {t('personDetail.updatedOn', { date: formattedUpdated })}
              </span>
            </div>

            {/* Chapter Actions */}
            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={person.starred ? 'accent' : 'secondary'}
                aria-pressed={!!person.starred}
                onClick={() => {
                  triggerHaptic('selection');
                  onUpdatePerson({ starred: !person.starred });
                }}
                icon={
                  <Star
                    className={`w-3.5 h-3.5 ${person.starred ? 'fill-current text-warning' : ''}`}
                  />
                }
              >
                {person.starred ? t('personDetail.unstarProfile') : t('personDetail.starProfile')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEditPerson(person)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                {t('personDetail.editProfile')}
              </Button>
              <Button
                size="sm"
                variant="soft"
                onClick={() => onAddGift(person.id)}
                icon={<GiftIcon className="w-3.5 h-3.5" />}
              >
                {t('personDetail.addGiftIdea')}
              </Button>
            </div>
          </header>

          {/* Always-visible Medical Allergy Stamp on Left Page */}
          {hasAllergies && (
            <div className="bg-danger-bg border-2 border-danger-border rounded-[3px] p-4 space-y-2 shadow-soft">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-danger-text">
                  {t('food.allergiesBannerTitle')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {person.food.allergies.map((allergy, idx) => (
                  <span
                    key={`${allergy}-${idx}`}
                    className="ink-stamp inline-block text-[11.5px] font-semibold px-2 py-0.5 rounded-[2px] bg-surface text-danger-text border-danger-border"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Left Page: Sizes & Measurements Receipt */}
          {isDesktopSpread && renderSizesReceipt()}

          {/* Desktop Left Page Delete Card Section */}
          {isDesktopSpread && (
            <div className="pt-4 border-t border-dashed border-border">
              <div className="bg-surface/75 border border-danger-border rounded-[4px] p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.05em] text-danger-text">
                    {t('personDetail.deleteCardSectionTitle')}
                  </h3>
                  <p className="text-[12.5px] text-secondary mt-0.5 leading-[1.4]">
                    {t('personDetail.deleteCardSectionDesc')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  className="shrink-0"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  {t('personDetail.deleteCardBtn')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PAGE: Living Memory Tabs (Notes, Preferences, Food, Gifts, + Sizes on mobile) */}
        <div className="space-y-5 min-w-0">
          <SegmentedControl<PersonProfileTab>
            ariaLabel="Profile sections"
            roleMode="tablist"
            idPrefix="profile"
            size="sm"
            value={effectiveTab}
            onChange={setActiveTab}
            options={rightPageTabs}
          />

          <div
            role="tabpanel"
            id={`profile-panel-${effectiveTab}`}
            aria-labelledby={`profile-tab-${effectiveTab}`}
            className="min-h-[320px]"
          >
            {/* MOBILE DETAILS TAB */}
            {!isDesktopSpread && effectiveTab === 'details' && renderSizesReceipt()}

            {/* NOTES TAB — Colored Sticky-Note Slips */}
            {effectiveTab === 'notes' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="type-hand text-[19px] text-secondary">
                    {t('notes.sectionInfo', { count: notes.length })}
                  </span>
                  {!isAddingQuickNote && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsAddingQuickNote(true)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {t('notes.addNote')}
                    </Button>
                  )}
                </div>

                {isAddingQuickNote && (
                  <form
                    onSubmit={handleCreateQuickNote}
                    className="sticky-yellow border rounded-[4px] p-4 sm:p-5 shadow-card space-y-3"
                  >
                    <label
                      htmlFor="quick-note-textarea"
                      className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary block"
                    >
                      {t('notes.newNoteLabel')}
                    </label>
                    <textarea
                      id="quick-note-textarea"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder={t('notes.newNotePlaceholder')}
                      rows={3}
                      autoFocus
                      className="w-full paper-ruled border border-border-strong/70 text-[14.5px] leading-[1.6] rounded-[3px] p-3 text-primary placeholder:text-muted focus:outline-none focus:border-green-700"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setIsAddingQuickNote(false);
                          setNewNoteText('');
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button size="sm" variant="primary" type="submit" disabled={!newNoteText.trim()}>
                        {t('notes.saveNote')}
                      </Button>
                    </div>
                  </form>
                )}

                {notes.length > 0 ? (
                  <div className="space-y-5 pt-1">
                    {notes.map((note, idx) => {
                      const noteDate = formatShortDate(note.createdAt, language, true);
                      const editedDate =
                        note.updatedAt && note.updatedAt !== note.createdAt
                          ? formatShortDate(note.updatedAt, language, true)
                          : null;
                      const stickyClass = STICKY_VARIANTS[idx % STICKY_VARIANTS.length];
                      const tiltClass = NOTE_TILTS[idx % NOTE_TILTS.length];

                      return (
                        <article
                          key={note.id}
                          className={`relative border rounded-[3px] p-5 pt-6 shadow-card transition-transform duration-[160ms] motion-safe:${tiltClass} hover:rotate-0 ${stickyClass}`}
                        >
                          <div
                            aria-hidden="true"
                            className="washi-tape absolute -top-2 left-6 w-14 h-3.5 rounded-[1px] pointer-events-none"
                          />

                          <div>
                            {note.category && (
                              <span className="ink-stamp inline-block text-[10.5px] font-semibold text-primary border-border-strong/80 bg-surface/65 px-2 py-0.5 rounded-[2px] mb-2.5">
                                {note.category}
                              </span>
                            )}
                            <p className="font-serif text-[15px] text-primary leading-[1.65] whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border-strong/35 flex items-center justify-between gap-2 font-mono text-[11px] text-secondary tabular-nums">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{t('notes.recordedOn', { date: noteDate })}</span>
                              {editedDate && (
                                <span>· {t('notes.updatedOn', { date: editedDate })}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <IconButton
                                label={t('notes.editNoteTitle')}
                                size="sm"
                                onClick={() => setEditingNote(note)}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </IconButton>
                              <IconButton
                                label={t('notes.deleteNoteTitle')}
                                variant="danger"
                                size="sm"
                                onClick={() => setNoteToDelete(note)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </IconButton>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  !isAddingQuickNote && (
                    <div className="text-center py-10 bg-surface/80 rounded-[4px] border border-dashed border-border-strong p-6">
                      <p className="type-title text-primary">{t('notes.emptyTitle')}</p>
                      <p className="type-hand text-[20px] text-secondary mt-1.5 mb-5 max-w-md mx-auto">
                        {t('notes.emptyDesc')}
                      </p>
                      <Button
                        size="md"
                        variant="secondary"
                        onClick={() => setIsAddingQuickNote(true)}
                      >
                        {t('notes.addFirstNote')}
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* PREFERENCES TAB */}
            {effectiveTab === 'preferences' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                <TagManager
                  title={t('preferences.scentsTitle')}
                  hint={t('preferences.scentsHint')}
                  tags={person.preferences.scents || []}
                  placeholder={t('preferences.scentsPlaceholder')}
                  onChange={(scents) =>
                    onUpdatePerson({ preferences: { ...person.preferences, scents } })
                  }
                />

                <TagManager
                  title={t('preferences.brandsTitle')}
                  hint={t('preferences.brandsHint')}
                  tags={person.preferences.brands || []}
                  placeholder={t('preferences.brandsPlaceholder')}
                  onChange={(brands) =>
                    onUpdatePerson({ preferences: { ...person.preferences, brands } })
                  }
                />

                <TagManager
                  title={t('preferences.colorsTitle')}
                  hint={t('preferences.colorsHint')}
                  tags={person.preferences.colors || []}
                  placeholder={t('preferences.colorsPlaceholder')}
                  onChange={(colors) =>
                    onUpdatePerson({ preferences: { ...person.preferences, colors } })
                  }
                />

                <TagManager
                  title={t('preferences.hobbiesTitle')}
                  hint={t('preferences.hobbiesHint')}
                  tags={person.preferences.hobbies || []}
                  placeholder={t('preferences.hobbiesPlaceholder')}
                  onChange={(hobbies) =>
                    onUpdatePerson({ preferences: { ...person.preferences, hobbies } })
                  }
                />

                <TagManager
                  title={t('preferences.likesTitle')}
                  hint={t('preferences.likesHint')}
                  badgeVariant="success"
                  tags={person.preferences.likes || []}
                  placeholder={t('preferences.likesPlaceholder')}
                  onChange={(likes) =>
                    onUpdatePerson({ preferences: { ...person.preferences, likes } })
                  }
                />

                <TagManager
                  title={t('preferences.dislikesTitle')}
                  hint={t('preferences.dislikesHint')}
                  tags={person.preferences.dislikes || []}
                  placeholder={t('preferences.dislikesPlaceholder')}
                  onChange={(dislikes) =>
                    onUpdatePerson({ preferences: { ...person.preferences, dislikes } })
                  }
                />
              </div>
            )}

            {/* FOOD TAB */}
            {effectiveTab === 'food' && (
              <div className="space-y-5">
                <div className="bg-danger-bg border-2 border-danger-border rounded-[4px] p-4 sm:p-5 space-y-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                    <h3 className="font-mono text-[11.5px] font-bold text-danger-text uppercase tracking-[0.06em]">
                      {t('food.allergiesBannerTitle')}
                    </h3>
                  </div>
                  <p className="text-[13px] text-danger-text/90 leading-[1.48]">
                    {t('food.allergiesBannerDesc')}
                  </p>

                  <FoodCategory
                    title={t('food.allergiesTitle')}
                    variant="allergy"
                    seamless
                    items={person.food.allergies || []}
                    placeholder={t('food.allergiesPlaceholder')}
                    onChange={(allergies) =>
                      onUpdatePerson({ food: { ...person.food, allergies } })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <FoodCategory
                    title={t('food.intolerancesTitle')}
                    hint={t('food.intolerancesHint')}
                    variant="intolerance"
                    items={person.food.intolerances || []}
                    placeholder={t('food.intolerancesPlaceholder')}
                    onChange={(intolerances) =>
                      onUpdatePerson({ food: { ...person.food, intolerances } })
                    }
                  />

                  <FoodCategory
                    title={t('food.dietaryTitle')}
                    hint={t('food.dietaryHint')}
                    variant="diet"
                    items={person.food.dietaryRestrictions || []}
                    placeholder={t('food.dietaryPlaceholder')}
                    onChange={(dietaryRestrictions) =>
                      onUpdatePerson({ food: { ...person.food, dietaryRestrictions } })
                    }
                  />

                  <FoodCategory
                    title={t('food.favoriteFoodsTitle')}
                    variant="favorite"
                    items={person.food.favoriteFoods || []}
                    placeholder={t('food.favoriteFoodsPlaceholder')}
                    onChange={(favoriteFoods) =>
                      onUpdatePerson({ food: { ...person.food, favoriteFoods } })
                    }
                  />

                  <FoodCategory
                    title={t('food.dislikedFoodsTitle')}
                    hint={t('food.dislikedFoodsHint')}
                    variant="disliked"
                    items={person.food.dislikedFoods || []}
                    placeholder={t('food.dislikedFoodsPlaceholder')}
                    onChange={(dislikedFoods) =>
                      onUpdatePerson({ food: { ...person.food, dislikedFoods } })
                    }
                  />
                </div>

                <div className="sticky-yellow border rounded-[4px] p-4 sm:p-5 space-y-3 shadow-soft">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border-strong/40">
                    <div>
                      <h3 className="font-mono text-[11.5px] font-semibold text-primary uppercase tracking-[0.06em]">
                        {t('food.kitchenNoteHeading')}
                      </h3>
                      <p className="type-hand text-[17px] text-secondary mt-0.5">
                        {t('food.kitchenNoteSubheading')}
                      </p>
                    </div>

                    {!isEditingFoodNote ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setFoodNote(person.food.notes || '');
                          setIsEditingFoodNote(true);
                        }}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        {t('food.editNote')}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditingFoodNote(false)}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleSaveFoodNote}>
                          {t('food.saveNote')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isEditingFoodNote ? (
                    <p className="font-serif text-[14.5px] text-primary leading-[1.6] whitespace-pre-wrap pt-1">
                      {person.food.notes || (
                        <span className="type-hand text-[18px] text-muted">
                          {t('food.emptyKitchenNote')}
                        </span>
                      )}
                    </p>
                  ) : (
                    <textarea
                      value={foodNote}
                      onChange={(e) => setFoodNote(e.target.value)}
                      placeholder={t('food.kitchenNotePlaceholder')}
                      aria-label={t('food.kitchenNoteHeading')}
                      rows={3}
                      className="w-full paper-ruled border border-border-strong rounded-[3px] p-3 text-[14px] text-primary leading-[1.55] placeholder:text-muted focus:outline-none focus:border-green-700"
                    />
                  )}
                </div>
              </div>
            )}

            {/* GIFTS TAB */}
            {effectiveTab === 'gifts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="type-hand text-[19px] text-secondary">
                    {personGiftsCountText}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onAddGift(person.id)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t('gifts.addGiftIdea')}
                  </Button>
                </div>

                {gifts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {gifts.map((gift) => (
                      <GiftCard
                        key={gift.id}
                        gift={gift}
                        showImagePlaceholder={false}
                        onEdit={() => onEditGift(gift)}
                        onDelete={() => setGiftToDelete(gift)}
                        onUpdateStatus={(st) => onUpdateGiftStatus(gift.id, st)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-surface/80 rounded-[4px] border border-dashed border-border-strong p-6">
                    <div className="w-10 h-10 rounded-full bg-surface-kraft text-primary flex items-center justify-center mx-auto mb-3 border border-border-strong/50">
                      <GiftIcon className="w-4 h-4" />
                    </div>
                    <p className="type-title text-primary">
                      {t('gifts.noPersonGiftsTitle', { name: person.name })}
                    </p>
                    <p className="type-hand text-[19px] text-secondary mt-1 mb-5 max-w-md mx-auto">
                      {t('gifts.noPersonGiftsDesc')}
                    </p>
                    <Button size="md" variant="secondary" onClick={() => onAddGift(person.id)}>
                      {t('gifts.addFirstGift')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Delete Card Footer Section */}
      {!isDesktopSpread && (
        <div className="pt-6 border-t border-dashed border-border">
          <div className="bg-surface/85 border border-danger-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-danger-text">
                {t('personDetail.deleteCardSectionTitle')}
              </h3>
              <p className="text-[13px] text-secondary mt-1 leading-[1.45]">
                {t('personDetail.deleteCardSectionDesc')}
              </p>
            </div>
            <Button
              size="md"
              variant="danger"
              className="shrink-0 self-start sm:self-center"
              onClick={() => setIsDeleteConfirmOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              {t('personDetail.deleteCardBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* Permanent Card Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        isLoading={isDeleting}
        title={t('personDetail.deleteConfirmTitle')}
        description={t('personDetail.deleteConfirmDesc', { name: person.name })}
        confirmLabel={t('personDetail.confirmDeleteCardBtn')}
        onConfirm={async () => {
          try {
            setIsDeleting(true);
            await onDeletePerson(person.id);
            setIsDeleteConfirmOpen(false);
          } finally {
            setIsDeleting(false);
          }
        }}
      />

      {/* Gift Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!giftToDelete}
        onClose={() => setGiftToDelete(null)}
        title={t('gifts.confirmDeleteGift', { title: giftToDelete?.title || '' })}
        description={t('gifts.confirmDeleteDesc', { title: giftToDelete?.title || '' })}
        onConfirm={async () => {
          if (giftToDelete) {
            await onDeleteGift(giftToDelete.id);
            setGiftToDelete(null);
          }
        }}
      />

      {/* Note Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        title={t('notes.confirmDeleteNote')}
        description={t('notes.confirmDeleteDesc')}
        onConfirm={async () => {
          if (noteToDelete) {
            await onDeleteNote(noteToDelete.id);
            setNoteToDelete(null);
          }
        }}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        initialNote={editingNote}
        onSave={async (content, category) => {
          if (editingNote) {
            await onUpdateNote(editingNote.id, content, category);
            setEditingNote(null);
          }
        }}
      />
    </div>
  );
};
