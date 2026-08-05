import { isUnsplashPhoto, type UnsplashPhoto } from '@/types/unsplash';

const UNSPLASH_RANDOM_PHOTO_ENDPOINT = 'https://api.unsplash.com/photos/random';
const REQUEST_TIMEOUT_MS = 8_000;

type UnsplashOrientation = 'landscape' | 'portrait';

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function appendUnsplashUtm(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=nadi&utm_medium=referral`;
}

function buildRandomPhotoEndpoint(
  query: string,
  orientation: UnsplashOrientation,
): string {
  return (
    `${UNSPLASH_RANDOM_PHOTO_ENDPOINT}?query=${encodeURIComponent(query)}` +
    `&orientation=${orientation}&content_filter=high`
  );
}

async function fetchRandomPhoto(
  query: string,
  orientation: UnsplashOrientation,
  signal?: AbortSignal,
): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY?.trim();
  if (!accessKey || signal?.aborted) {
    return null;
  }

  const requestController = new AbortController();
  const handleExternalAbort = () => requestController.abort();
  signal?.addEventListener('abort', handleExternalAbort, { once: true });

  const timeout = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildRandomPhotoEndpoint(query, orientation), {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
      signal: requestController.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    if (!isUnsplashPhoto(payload)) {
      return null;
    }

    if (!isHttpsUrl(payload.urls.regular) || !isHttpsUrl(payload.user.links.html)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}

export function fetchRandomAuthPhoto(
  signal?: AbortSignal,
): Promise<UnsplashPhoto | null> {
  return fetchRandomPhoto('Bali Indonesia travel', 'portrait', signal);
}

export function fetchRandomDestinationPhoto(
  query: string,
  signal?: AbortSignal,
): Promise<UnsplashPhoto | null> {
  return fetchRandomPhoto(query, 'landscape', signal);
}
