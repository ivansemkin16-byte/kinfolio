import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Gift, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { PersonProfileTab } from '../../types/navigation';
import { searchAllRecords, SearchResultItem, SearchCategory } from '../../services/searchService';
import { peopleRepository } from '../../db/repositories/peopleRepository';
import { Badge } from '../common/Badge';
import { SearchInput } from '../common/SearchInput';
import { EmptyState } from '../common/EmptyState';
import { PageHeader } from '../layout/PageHeader';
import { useTranslation } from '../../i18n/LanguageContext';
import { selectPluralForm } from '../../i18n/helpers';
import { triggerHaptic } from '../../motion/haptics';

interface SearchViewProps {
  onSelectPerson: (personId: string, initialTab?: PersonProfileTab) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectPerson }) => {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    peopleRepository.getAll().then((people) => {
      if (!mounted) return;
      const picked: string[] = [];
      const pushUnique = (val?: string) => {
        const clean = val?.split('(')[0].trim();
        if (!clean || clean.length < 2) return;
        if (!picked.some((p) => p.toLowerCase() === clean.toLowerCase())) {
          picked.push(clean);
        }
      };

      for (const p of people) {
        if (p.food.allergies[0]) pushUnique(p.food.allergies[0]);
        if (p.preferences.brands[0]) pushUnique(p.preferences.brands[0]);
        if (p.details.shoeSize) pushUnique(p.details.shoeSize);
        if (p.preferences.hobbies[0]) pushUnique(p.preferences.hobbies[0]);
        if (picked.length >= 6) break;
      }

      if (picked.length === 0) {
        const fallback =
          language === 'ru'
            ? ['Peanuts', 'Aesop', 'EU 38', 'Кольцо', 'Coffee', 'Berlin']
            : ['Peanuts', 'Aesop', 'EU 38', 'Ring', 'Coffee', 'Berlin'];
        setSuggestions(fallback);
      } else {
        setSuggestions(picked.slice(0, 6));
      }
    });
    return () => {
      mounted = false;
    };
  }, [language]);

  useEffect(() => {
    let isCancelled = false;

    if (query.trim().length >= 2) {
      setIsSearching(true);
      searchAllRecords(query, language).then((items) => {
        if (!isCancelled) {
          setResults(items);
          setActiveIndex(items.length > 0 ? 0 : -1);
          setIsSearching(false);
        }
      });
    } else {
      setResults([]);
      setActiveIndex(-1);
      setIsSearching(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [query, language]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      if (document.activeElement === inputRef.current) {
        e.preventDefault();
        triggerHaptic('selection');
        const chosen = results[activeIndex];
        onSelectPerson(chosen.personId, chosen.targetTab);
      }
    }
  };

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'Person':
        return <User className="w-4 h-4 text-green-700" />;
      case 'Gift':
        return <Gift className="w-4 h-4 text-green-700" />;
      case 'Food & Allergies':
        return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'Note':
        return <FileText className="w-4 h-4 text-green-700" />;
      default:
        return <Search className="w-4 h-4 text-green-700" />;
    }
  };

  const getCategoryLabel = (cat: SearchCategory) => {
    switch (cat) {
      case 'Person':
        return t('search.catPerson');
      case 'Sizes & Details':
        return t('search.catDetails');
      case 'Preferences':
        return t('search.catPreferences');
      case 'Food & Allergies':
        return t('search.catFood');
      case 'Gift':
        return t('search.catGift');
      case 'Note':
        return t('search.catNote');
    }
  };

  const matchLabel = selectPluralForm(results.length, language, {
    singular: t('search.matchSingular'),
    few: t('search.matchFew'),
    many: t('search.matchMany'),
  });

  return (
    <div className="space-y-7 max-w-3xl" onKeyDown={handleSearchKeyDown}>
      <PageHeader title={t('search.heading')} subtitle={t('search.subtitle')} />

      {/* Search Pad */}
      <SearchInput
        ref={inputRef}
        size="lg"
        value={query}
        onChange={setQuery}
        placeholder={t('search.placeholder')}
        clearLabel={t('common.clear')}
        aria-label={t('search.heading')}
        autoFocus
      />

      {/* Torn Paper Suggestion Scraps */}
      {!query && suggestions.length > 0 && (
        <div className="space-y-2.5">
          <p className="type-hand text-[19px] text-secondary">{t('search.quickSuggestions')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setQuery(term);
                }}
                className="font-mono text-[12px] bg-surface-kraft/85 border border-border-strong/60 px-3 py-1.5 min-h-[36px] rounded-[3px] text-primary hover:bg-surface-green hover:border-green-300 active:scale-[0.95] transition-[background-color,border-color,transform] duration-[110ms] shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query.trim().length >= 2 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-mono text-[12px] text-secondary tabular-nums">
            <span>
              {isSearching
                ? t('search.searching')
                : `${results.length} ${matchLabel} ${t('search.foundSuffix')}`}
            </span>
          </div>

          {results.length > 0 ? (
            <div className="space-y-2.5">
              {results.map((match, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectPerson(match.personId, match.targetTab);
                    }}
                    className={`w-full text-left bg-surface border rounded-[4px] p-4 transition-[border-color,box-shadow,background-color,transform] duration-[120ms] cursor-pointer hover:shadow-card active:scale-[0.99] flex items-center justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700/45 ${
                      match.isAllergyAlert
                        ? 'border-danger-border hover:border-danger bg-danger-bg/65'
                        : isSelected
                        ? 'border-border-strong shadow-card'
                        : 'border-border hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 ${
                          match.isAllergyAlert
                            ? 'bg-danger-bg border-danger-border'
                            : 'bg-surface-kraft/60 border-border'
                        }`}
                      >
                        {getCategoryIcon(match.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-serif text-[16px] font-semibold text-primary group-hover:text-green-900 transition-colors">
                            {match.personName}
                          </span>
                          <Badge
                            size="sm"
                            variant={match.isAllergyAlert ? 'danger' : 'default'}
                          >
                            {getCategoryLabel(match.category)}
                          </Badge>
                        </div>
                        <p className="text-[13.5px] text-secondary mt-1 line-clamp-2 break-words leading-[1.45]">
                          {match.snippet}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            !isSearching && (
              <EmptyState
                icon={<Search className="w-5 h-5 text-green-700" />}
                title={t('personList.noMatchesTitle')}
                description={t('search.noResults', { query })}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};
