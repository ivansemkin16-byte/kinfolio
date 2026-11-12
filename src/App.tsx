import React, { useState, useEffect, useCallback } from 'react';
import { ActiveView, PersonProfileTab } from './types/navigation';
import { Person, CreatePersonInput, UpdatePersonInput } from './types/person';
import { GiftIdea, GiftStatus, CreateGiftInput, UpdateGiftInput } from './types/gift';
import { usePeople } from './hooks/usePeople';
import { useGifts, GiftWithRecipient } from './hooks/useGifts';
import { usePersonDetails } from './hooks/usePersonDetails';
import { ToastProvider } from './hooks/useToast';
import { ThemeProvider } from './hooks/useTheme';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
import { ModalDepthProvider } from './motion/ModalDepthContext';
import { AppLayout } from './components/layout/AppLayout';
import { PersonList } from './components/people/PersonList';
import { PersonDetailView } from './components/people/PersonDetailView';
import { PersonFormModal } from './components/people/PersonFormModal';
import { GiftView } from './components/gifts/GiftView';
import { GiftFormModal } from './components/gifts/GiftFormModal';
import { SearchView } from './components/search/SearchView';
import { SettingsView } from './components/settings/SettingsView';
import { LockScreen } from './components/security/LockScreen';
import { EmptyState } from './components/common/EmptyState';
import { Button } from './components/common/Button';
import { Skeleton } from './components/common/Skeleton';
import { lockService } from './services/lockService';
import { settingsRepository } from './db/repositories/settingsRepository';
import { UserX } from 'lucide-react';

const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ActiveView>('people');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPersonInitialTab, setSelectedPersonInitialTab] = useState<PersonProfileTab>('details');

  // Local Passcode Lock state
  const [hasPasscode, setHasPasscode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      lockService.hasPasscode(),
      settingsRepository.get<number>('autoLockMinutes', 15),
    ]).then(([enabled, timeout]) => {
      if (!mounted) return;
      setHasPasscode(enabled);
      setIsLocked(enabled);
      setAutoLockMinutes(timeout);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Inactivity timer when passcode lock is active
  useEffect(() => {
    if (!hasPasscode || isLocked || autoLockMinutes <= 0) return;

    const timeoutMs = autoLockMinutes * 60 * 1000;
    let timerId = window.setTimeout(() => setIsLocked(true), timeoutMs);

    const resetTimer = () => {
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => setIsLocked(true), timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      window.clearTimeout(timerId);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [hasPasscode, isLocked, autoLockMinutes]);

  // Global keyboard shortcut: Cmd/Ctrl + K -> Search
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSelectedPersonId(null);
        setActiveView('search');
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [isLocked]);

  // People hook
  const {
    people,
    deletedPeople,
    loading: peopleLoading,
    createPerson,
    updatePerson,
    deletePerson,
    restorePerson,
    reloadDemoData,
    refresh: refreshPeople,
  } = usePeople();

  // Gifts hook (for global gifts view)
  const {
    gifts: globalGifts,
    addGift: addGlobalGift,
    updateGift: updateGlobalGift,
    updateGiftStatus: updateGlobalGiftStatus,
    deleteGift: deleteGlobalGift,
    refresh: refreshGifts,
  } = useGifts();

  // Person Details hook (for individual person profile)
  const {
    person: selectedPerson,
    gifts: personGifts,
    notes: personNotes,
    loading: personDetailsLoading,
    updatePerson: updateSelectedPerson,
    addGift: addPersonGift,
    updateGift: updatePersonGift,
    updateGiftStatus: updatePersonGiftStatus,
    deleteGift: deletePersonGift,
    addNote: addPersonNote,
    updateNote: updatePersonNote,
    deleteNote: deletePersonNote,
    refresh: refreshPersonDetails,
  } = usePersonDetails(selectedPersonId);

  // Sync gifts list after initial people/demo seeding completes
  useEffect(() => {
    if (!peopleLoading) {
      refreshGifts();
    }
  }, [peopleLoading, people.length, refreshGifts]);

  const handleLoadDemoData = async () => {
    await reloadDemoData();
    await refreshGifts();
  };

  // Modals state
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftIdea | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string | undefined>(undefined);

  // Navigation handlers
  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    if (view !== 'person-detail') {
      setSelectedPersonId(null);
    }
  };

  const handleSelectPerson = (personId: string, initialTab?: PersonProfileTab) => {
    setSelectedPersonId(personId);
    setSelectedPersonInitialTab(initialTab || 'details');
    setActiveView('person-detail');
  };

  const handleBackToPeople = () => {
    setSelectedPersonId(null);
    setActiveView('people');
    refreshPeople();
    refreshGifts();
  };

  const handleToggleStar = useCallback(
    async (personId: string, nextStarred: boolean) => {
      await updatePerson(personId, { starred: nextStarred });
      if (selectedPersonId === personId) {
        await refreshPersonDetails();
      }
    },
    [updatePerson, selectedPersonId, refreshPersonDetails]
  );

  // Person CRUD triggers
  const handleOpenAddPerson = () => {
    setEditingPerson(null);
    setIsPersonModalOpen(true);
  };

  const handleOpenEditPerson = (personToEdit: Person) => {
    setEditingPerson(personToEdit);
    setIsPersonModalOpen(true);
  };

  const handleSavePerson = async (personData: CreatePersonInput | UpdatePersonInput) => {
    if (editingPerson) {
      await updatePerson(editingPerson.id, personData);
      if (selectedPersonId === editingPerson.id) {
        await refreshPersonDetails();
      }
    } else {
      const created = await createPerson(personData as CreatePersonInput);
      handleSelectPerson(created.id);
    }
    await refreshGifts();
  };

  const handleDeletePerson = async (personId: string) => {
    await deletePerson(personId, true);
    if (selectedPersonId === personId) {
      handleBackToPeople();
    } else {
      await refreshGifts();
    }
  };

  // Gift CRUD triggers
  const handleOpenAddGift = (personId?: string) => {
    setEditingGift(null);
    setGiftRecipientId(personId || selectedPersonId || people[0]?.id);
    setIsGiftModalOpen(true);
  };

  const handleOpenEditGift = (giftToEdit: GiftIdea) => {
    setEditingGift(giftToEdit);
    setGiftRecipientId(giftToEdit.personId);
    setIsGiftModalOpen(true);
  };

  const handleSaveGift = async (giftData: CreateGiftInput | UpdateGiftInput) => {
    if (editingGift) {
      if (selectedPersonId) {
        await updatePersonGift(editingGift.id, giftData as UpdateGiftInput);
      } else {
        await updateGlobalGift(editingGift.id, giftData as UpdateGiftInput);
      }
    } else {
      const createInput = giftData as CreateGiftInput;
      if (selectedPersonId && createInput.personId === selectedPersonId) {
        await addPersonGift(createInput);
      } else {
        await addGlobalGift(createInput);
      }
    }
    await refreshGifts();
    if (selectedPersonId) {
      await refreshPersonDetails();
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (selectedPersonId) {
      await deletePersonGift(giftId);
    } else {
      await deleteGlobalGift(giftId);
    }
    await refreshGifts();
  };

  const handleUpdateGiftStatus = async (giftId: string, newStatus: GiftStatus) => {
    if (selectedPersonId) {
      await updatePersonGiftStatus(giftId, newStatus);
    } else {
      await updateGlobalGiftStatus(giftId, newStatus);
    }
    await refreshGifts();
  };

  const handleDataReset = async () => {
    setSelectedPersonId(null);
    setActiveView('people');
    const [enabled, timeout] = await Promise.all([
      lockService.hasPasscode(),
      settingsRepository.get<number>('autoLockMinutes', 15),
    ]);
    setHasPasscode(enabled);
    setAutoLockMinutes(timeout);
    await refreshPeople();
    await refreshGifts();
  };

  // Calculate gift counts per person
  const giftCountsMap: Record<string, number> = {};
  globalGifts.forEach((g) => {
    giftCountsMap[g.personId] = (giftCountsMap[g.personId] || 0) + 1;
  });

  return (
    <>
      <AppLayout
        activeView={activeView}
        onNavigate={handleNavigate}
        peopleCount={people.length}
        giftsCount={globalGifts.length}
        hasPasscode={hasPasscode}
        onLockNow={() => setIsLocked(true)}
      >
        {/* People View */}
        {activeView === 'people' && (
          <PersonList
            people={people}
            deletedPeople={deletedPeople}
            giftCounts={giftCountsMap}
            loading={peopleLoading}
            onSelectPerson={handleSelectPerson}
            onAddPerson={handleOpenAddPerson}
            onToggleStar={handleToggleStar}
            onRestorePerson={restorePerson}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {/* Person Detail View */}
        {activeView === 'person-detail' &&
          (selectedPerson ? (
            <PersonDetailView
              person={selectedPerson}
              gifts={personGifts}
              notes={personNotes}
              initialTab={selectedPersonInitialTab}
              onBack={handleBackToPeople}
              onEditPerson={handleOpenEditPerson}
              onDeletePerson={handleDeletePerson}
              onUpdatePerson={async (input) => {
                const res = await updateSelectedPerson(input);
                await refreshPeople();
                return res;
              }}
              onAddGift={handleOpenAddGift}
              onEditGift={handleOpenEditGift}
              onDeleteGift={handleDeleteGift}
              onUpdateGiftStatus={handleUpdateGiftStatus}
              onAddNote={addPersonNote}
              onUpdateNote={updatePersonNote}
              onDeleteNote={deletePersonNote}
            />
          ) : personDetailsLoading ? (
            <div className="space-y-6" aria-label={t('personDetail.loadingProfile')}>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-44 w-full rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<UserX className="w-5 h-5 text-green-700" />}
              title={t('personDetail.notFoundTitle')}
              description={t('personDetail.notFoundDesc')}
              action={
                <Button size="md" variant="primary" onClick={handleBackToPeople}>
                  {t('personDetail.backToPeople')}
                </Button>
              }
            />
          ))}

        {/* Gifts View */}
        {activeView === 'gifts' && (
          <GiftView
            gifts={globalGifts}
            people={people}
            onAddGift={() => handleOpenAddGift()}
            onEditGift={(gift: GiftWithRecipient) => handleOpenEditGift(gift)}
            onDeleteGift={handleDeleteGift}
            onSelectPerson={handleSelectPerson}
            onUpdateGiftStatus={handleUpdateGiftStatus}
          />
        )}

        {/* Search View */}
        {activeView === 'search' && <SearchView onSelectPerson={handleSelectPerson} />}

        {/* Settings View */}
        {activeView === 'settings' && (
          <SettingsView
            hasPasscode={hasPasscode}
            onPasscodeChange={(enabled) => {
              setHasPasscode(enabled);
              if (!enabled) setIsLocked(false);
            }}
            onAutoLockChange={setAutoLockMinutes}
            onLockNow={() => setIsLocked(true)}
            onDataReset={handleDataReset}
            onLoadDemoData={handleLoadDemoData}
          />
        )}

        {/* Modals */}
        <PersonFormModal
          isOpen={isPersonModalOpen}
          onClose={() => setIsPersonModalOpen(false)}
          onSave={handleSavePerson}
          initialPerson={editingPerson}
        />

        <GiftFormModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          onSave={handleSaveGift}
          people={people}
          defaultPersonId={giftRecipientId}
          initialGift={editingGift}
        />
      </AppLayout>

      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ModalDepthProvider>
            <MainApp />
          </ModalDepthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
