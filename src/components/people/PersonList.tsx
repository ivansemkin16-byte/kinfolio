import React, { useState, useMemo } from 'react';
import { Plus, UserPlus, RotateCcw, Trash2, Star } from 'lucide-react';
import { Person, SortOption } from '../../types/person';
import { PersonCard } from './PersonCard';
import { Button } from '../common/Button';
import { SearchInput } from '../common/SearchInput';
import { Select } from '../common/Select';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import { SegmentedControl } from '../common/SegmentedControl';
import { PageHeader } from '../layout/PageHeader';
import { useTranslation } from '../../i18n/LanguageContext';

interface PersonListProps {
  people: Person[];
  deletedPeople?: Person[];
  giftCounts?: Record<string, number>;
  loading?: boolean;
  onSelectPerson: (personId: string) => void;
  onAddPerson: () => void;
  onToggleStar?: (personId: string, nextStarred: boolean) => void;
  onRestorePerson?: (personId: string) => void;
  onLoadDemoData?: () => void;
}

export const PersonList: React.FC<PersonListProps> = ({
  people,
  deletedPeople = [],
  giftCounts = {},
  loading = false,
  onSelectPerson,
  onAddPerson,
  onToggleStar,
  onRestorePerson,
  onLoadDemoData,
}) => {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [currentTab, setCurrentTab] = useState<'active' | 'trash'>('active');
  const [onlyStarred, setOnlyStarred] = useState(false);

  const starredCount = useMemo(
    () => people.filter((p) => Boolean(p.starred)).length,
    [people]
  );

  const filteredAndSortedPeople = useMemo(() => {
    const listToFilter = currentTab === 'active' ? people : deletedPeople;
    let result = [...listToFilter];

    if (currentTab === 'active' && onlyStarred && starredCount > 0) {
      result = result.filter((p) => Boolean(p.starred));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.relationship?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.food.allergies.some((a) => a.toLowerCase().includes(q)) ||
          p.preferences.brands.some((b) => b.toLowerCase().includes(q)) ||
          p.preferences.scents.some((s) => s.toLowerCase().includes(q)) ||
          (p.details.clothingSize && p.details.clothingSize.toLowerCase().includes(q)) ||
          (p.details.shoeSize && p.details.shoeSize.toLowerCase().includes(q)) ||
          (p.details.ringSize && p.details.ringSize.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'updated-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name, locale);
        case 'relationship-asc':
          return (a.relationship || '').localeCompare(b.relationship || '', locale);
        default:
          return 0;
      }
    });

    return result;
  }, [people, deletedPeople, currentTab, onlyStarred, starredCount, searchQuery, sortBy, locale]);

  return (
    <div className="space-y-7">
      <PageHeader
        title={t('personList.title')}
        subtitle={t('personList.subtitle')}
        action={
          <>
            {people.length === 0 && !loading && onLoadDemoData && (
              <Button size="md" variant="secondary" onClick={onLoadDemoData}>
                {t('personList.loadSampleProfiles')}
              </Button>
            )}
            <Button
              size="md"
              variant="primary"
              onClick={onAddPerson}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('personList.addPerson')}
            </Button>
          </>
        }
      />

      {/* Index Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 flex-wrap">
          {deletedPeople.length > 0 && (
            <SegmentedControl<'active' | 'trash'>
              ariaLabel={t('nav.people')}
              roleMode="tablist"
              size="sm"
              value={currentTab}
              onChange={setCurrentTab}
              options={[
                {
                  value: 'active',
                  label: t('personList.activeTab'),
                  badge: people.length,
                },
                {
                  value: 'trash',
                  label: t('personList.trashTab'),
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  badge: deletedPeople.length,
                },
              ]}
            />
          )}

          {currentTab === 'active' && starredCount > 0 && (
            <SegmentedControl<'all' | 'starred'>
              ariaLabel={t('personList.starredFilter')}
              roleMode="radiogroup"
              size="sm"
              value={onlyStarred ? 'starred' : 'all'}
              onChange={(val) => setOnlyStarred(val === 'starred')}
              options={[
                { value: 'all', label: t('personList.allFilter') },
                {
                  value: 'starred',
                  label: t('personList.starredFilter'),
                  icon: <Star className="w-3.5 h-3.5 fill-current text-warning" />,
                  badge: starredCount,
                },
              ]}
            />
          )}

          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('personList.searchPlaceholder')}
              aria-label={t('personList.searchPlaceholder')}
              clearLabel={t('common.clear')}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          <span className="font-mono text-[12px] text-secondary">{t('personList.sortLabel')}</span>
          <Select
            compact
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label={t('personList.sortAriaLabel')}
          >
            <option value="updated-desc">{t('personList.sortUpdated')}</option>
            <option value="name-asc">{t('personList.sortName')}</option>
            <option value="relationship-asc">{t('personList.sortRelationship')}</option>
          </Select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-[4px] p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-12 h-12 rounded-[3px]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : currentTab === 'active' ? (
        filteredAndSortedPeople.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredAndSortedPeople.map((person, index) => (
              <PersonCard
                key={person.id}
                person={person}
                index={index}
                giftCount={giftCounts[person.id] || 0}
                onSelect={onSelectPerson}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UserPlus className="w-5 h-5 text-green-700" />}
            title={searchQuery ? t('personList.noMatchesTitle') : t('personList.noPeopleTitle')}
            description={
              searchQuery
                ? t('personList.noMatchesDesc', { query: searchQuery })
                : t('personList.noPeopleDesc')
            }
            action={
              searchQuery ? (
                <Button size="md" variant="secondary" onClick={() => setSearchQuery('')}>
                  {t('personList.resetSearch')}
                </Button>
              ) : (
                <>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={onAddPerson}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {t('personList.addFirstPerson')}
                  </Button>
                  {onLoadDemoData && (
                    <Button size="md" variant="secondary" onClick={onLoadDemoData}>
                      {t('personList.loadSampleProfiles')}
                    </Button>
                  )}
                </>
              )
            }
          />
        )
      ) : (
        /* Trash Tab */
        <div className="space-y-4">
          <div className="bg-surface-soft border border-dashed border-border-strong px-4 py-3 rounded-sm text-[13px] text-secondary">
            {t('personList.trashBanner')}
          </div>

          {filteredAndSortedPeople.length > 0 ? (
            <div className="space-y-2.5">
              {filteredAndSortedPeople.map((person) => (
                <div
                  key={person.id}
                  className="bg-surface border border-border rounded-sm p-4 flex items-center justify-between gap-4 shadow-soft"
                >
                  <div className="min-w-0">
                    <h4 className="font-serif text-[16px] font-semibold text-primary truncate">
                      {person.name}
                    </h4>
                    {person.relationship && (
                      <p className="type-hand text-[17px] text-secondary truncate">
                        {person.relationship}
                      </p>
                    )}
                  </div>
                  {onRestorePerson && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onRestorePerson(person.id)}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      {t('personList.restore')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-muted text-center py-8">{t('personList.trashEmpty')}</p>
          )}
        </div>
      )}
    </div>
  );
};
