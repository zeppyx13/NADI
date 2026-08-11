/**
 * Minimal shape of a Google Places API (New) `places:searchText` response.
 * Only the fields requested through the field mask are modelled.
 */
export type GooglePlaceLocation = {
  latitude: number;
  longitude: number;
};

export type GooglePlace = {
  id: string;
  displayName: { text: string };
  location: GooglePlaceLocation;
  formattedAddress?: string;
};

export type GooglePlaceSearchResponse = {
  places?: readonly GooglePlace[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGooglePlaceLocation(value: unknown): value is GooglePlaceLocation {
  return (
    isRecord(value) &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude)
  );
}

export function isGooglePlace(value: unknown): value is GooglePlace {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || value.id.length === 0) return false;
  if (!isRecord(value.displayName)) return false;
  if (typeof value.displayName.text !== 'string') return false;
  if (!isGooglePlaceLocation(value.location)) return false;
  if (
    value.formattedAddress !== undefined &&
    typeof value.formattedAddress !== 'string'
  ) {
    return false;
  }
  return true;
}

export function readGooglePlaces(value: unknown): readonly GooglePlace[] {
  if (!isRecord(value)) return [];
  if (!Array.isArray(value.places)) return [];
  return value.places.filter(isGooglePlace);
}
