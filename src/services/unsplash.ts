import { isUnsplashPhoto, type UnsplashPhoto } from '@/types/unsplash';

const UNSPLASH_RANDOM_PHOTO_ENDPOINT =
  'https://api.unsplash.com/photos/random' +
  '?query=Bali%20Indonesia%20travel' +
  '&orientation=portrait' +
  '&content_filter=high';
const REQUEST_TIMEOUT_MS = 8_000;

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

export async function fetchRandomAuthPhoto(
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
    const response = await fetch(UNSPLASH_RANDOM_PHOTO_ENDPOINT, {
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
