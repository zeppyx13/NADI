import { baliSearchBounds, googlePlacesConfig } from '@/constants/map';
import { readGooglePlaces } from '@/types/google-places';
import type { MapPlaceResult } from '@/types/map';

const REQUEST_TIMEOUT_MS = 8_000;

export type GooglePlaceSearchOutcome =
  | { status: 'ready'; places: readonly MapPlaceResult[] }
  | { status: 'unavailable' }
  | { status: 'error' };

export function isGooglePlacesEnabled(): boolean {
  return googlePlacesConfig.isEnabled;
}

function toPlaceResult(place: {
  id: string;
  displayName: { text: string };
  location: { latitude: number; longitude: number };
  formattedAddress?: string;
}): MapPlaceResult {
  return {
    id: `google:${place.id}`,
    source: 'google-place',
    name: place.displayName.text,
    address: place.formattedAddress,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    placeId: place.id,
  };
}

/**
 * Text search over Google Places. The response already carries coordinates and
 * the place id, so a selected suggestion can move the camera without a second
 * request. Results stay tagged as `google-place`; they never become NADI
 * destinations on their own.
 */
export async function searchGooglePlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GooglePlaceSearchOutcome> {
  const apiKey = googlePlacesConfig.apiKey;
  const trimmedQuery = query.trim();

  if (!apiKey) {
    return { status: 'unavailable' };
  }
  if (trimmedQuery.length === 0 || signal?.aborted) {
    return { status: 'ready', places: [] };
  }

  const requestController = new AbortController();
  const handleExternalAbort = () => requestController.abort();
  signal?.addEventListener('abort', handleExternalAbort, { once: true });
  const timeout = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(googlePlacesConfig.searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': googlePlacesConfig.fieldMask,
      },
      body: JSON.stringify({
        textQuery: trimmedQuery,
        maxResultCount: googlePlacesConfig.maxResults,
        locationBias: {
          rectangle: {
            low: baliSearchBounds.low,
            high: baliSearchBounds.high,
          },
        },
      }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      return { status: 'error' };
    }

    const payload: unknown = await response.json();
    return {
      status: 'ready',
      places: readGooglePlaces(payload).map(toPlaceResult),
    };
  } catch {
    return signal?.aborted ? { status: 'ready', places: [] } : { status: 'error' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}
