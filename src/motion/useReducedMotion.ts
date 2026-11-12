import { useState, useEffect } from 'react';

function getMediaQuery(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

export function useMediaPreference(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => getMediaQuery(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function useReducedMotion(): boolean {
  return useMediaPreference('(prefers-reduced-motion: reduce)');
}

export function useReducedTransparency(): boolean {
  return useMediaPreference('(prefers-reduced-transparency: reduce)');
}
