import { useCallback, useEffect, useMemo, useState } from 'react';

import { destinations } from '@/data/destinations';
import {
  isGooglePlacesEnabled,
  searchGooglePlaces,
} from '@/services/google-places-service';
import type { Destination } from '@/types/destination';
import type { MapPlaceResult, MapPlaceSearchStatus } from '@/types/map';

const SEARCH_DEBOUNCE_MS = 320;
const MIN_QUERY_LENGTH = 2;
const MAX_CATALOG_RESULTS = 5;

type GoogleSearchState = {
  /** Query the stored results belong to. */
  query: string;
  results: readonly MapPlaceResult[];
  status: 'ready' | 'error';
};

const emptyGoogleState: GoogleSearchState = {
  query: '',
  results: [],
  status: 'ready',
};

export type PlaceSearchState = {
  query: string;
  setQuery: (value: string) => void;
  clear: () => void;
  catalogResults: readonly MapPlaceResult[];
  googleResults: readonly MapPlaceResult[];
  status: MapPlaceSearchStatus;
  isGoogleEnabled: boolean;
};

function toCatalogResult(destination: Destination): MapPlaceResult {
  return {
    id: `nadi:${destination.id}`,
    source: 'nadi-destination',
    name: destination.name,
    address: `${destination.region}, ${destination.regency}`,
    latitude: destination.latitude,
    longitude: destination.longitude,
    destinationId: destination.id,
  };
}

function matchesCatalog(destination: Destination, query: string): boolean {
  const haystack = [
    destination.name,
    destination.region,
    destination.regency,
    ...destination.tags,
  ]
    .join(' ')
    .toLocaleLowerCase();
  return haystack.includes(query);
}

/**
 * Search foundation for the map. The NADI catalog answers instantly and Google
 * Places widens the reach to any Bali location. Both sides stay separated by
 * `source` so a Google result is never mistaken for a NADI destination.
 */
export function usePlaceSearch(): PlaceSearchState {
  const [query, setQuery] = useState('');
  const [googleState, setGoogleState] =
    useState<GoogleSearchState>(emptyGoogleState);
  const isGoogleEnabled = isGooglePlacesEnabled();

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const isQuerySearchable = normalizedQuery.length >= MIN_QUERY_LENGTH;

  const catalogResults = useMemo(() => {
    if (!isQuerySearchable) return [];
    return destinations
      .filter((destination) => matchesCatalog(destination, normalizedQuery))
      .slice(0, MAX_CATALOG_RESULTS)
      .map(toCatalogResult);
  }, [isQuerySearchable, normalizedQuery]);

  useEffect(() => {
    if (!isQuerySearchable || !isGoogleEnabled) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchGooglePlaces(normalizedQuery, controller.signal).then(
        (outcome) => {
          if (controller.signal.aborted) return;
          setGoogleState({
            query: normalizedQuery,
            results: outcome.status === 'ready' ? outcome.places : [],
            status: outcome.status === 'error' ? 'error' : 'ready',
          });
        },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isGoogleEnabled, isQuerySearchable, normalizedQuery]);

  const hasFreshGoogleResults = googleState.query === normalizedQuery;
  const googleResults =
    isQuerySearchable && hasFreshGoogleResults ? googleState.results : [];

  let status: MapPlaceSearchStatus = 'idle';
  if (isQuerySearchable) {
    if (!isGoogleEnabled) {
      status = 'unavailable';
    } else if (!hasFreshGoogleResults) {
      status = 'searching';
    } else {
      status = googleState.status;
    }
  }

  const clear = useCallback(() => {
    setQuery('');
    setGoogleState(emptyGoogleState);
  }, []);

  return {
    query,
    setQuery,
    clear,
    catalogResults,
    googleResults,
    status,
    isGoogleEnabled,
  };
}
