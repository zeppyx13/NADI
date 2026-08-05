import { useCallback, useEffect, useState } from 'react';

import { fetchRandomDestinationPhoto } from '@/services/unsplash';
import {
  isDestinationPhotoCacheFresh,
  readCachedDestinationPhoto,
  removeCachedDestinationPhoto,
  writeCachedDestinationPhoto,
  type CachedDestinationPhoto,
} from '@/storage/destination-image-cache';
import type { UnsplashPhoto } from '@/types/unsplash';

type DestinationImageSource = 'remote' | 'cache' | 'fallback';

type DestinationImageState = {
  photo: UnsplashPhoto | null;
  previousPhoto: UnsplashPhoto | null;
  source: DestinationImageSource;
  isLoading: boolean;
};

const memoryCache = new Map<string, CachedDestinationPhoto>();
const inFlightRequests = new Map<string, Promise<UnsplashPhoto | null>>();

function requestDestinationPhoto(
  destinationId: string,
  imageQuery: string,
): Promise<UnsplashPhoto | null> {
  const activeRequest = inFlightRequests.get(destinationId);
  if (activeRequest) return activeRequest;

  const request = fetchRandomDestinationPhoto(imageQuery).finally(() => {
    inFlightRequests.delete(destinationId);
  });
  inFlightRequests.set(destinationId, request);
  return request;
}

export function useDestinationImage(destinationId: string, imageQuery: string) {
  const [state, setState] = useState<DestinationImageState>({
    photo: memoryCache.get(destinationId)?.photo ?? null,
    previousPhoto: null,
    source: memoryCache.has(destinationId) ? 'cache' : 'fallback',
    isLoading: !memoryCache.has(destinationId),
  });

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      const memoryPhoto = memoryCache.get(destinationId);
      const cachedPhoto = memoryPhoto ?? (await readCachedDestinationPhoto(destinationId));
      if (!isActive) return;

      if (cachedPhoto) {
        memoryCache.set(destinationId, cachedPhoto);
        setState({
          photo: cachedPhoto.photo,
          previousPhoto: null,
          source: 'cache',
          isLoading: !isDestinationPhotoCacheFresh(cachedPhoto.cachedAt),
        });

        if (isDestinationPhotoCacheFresh(cachedPhoto.cachedAt)) return;
      }

      const nextPhoto = await requestDestinationPhoto(destinationId, imageQuery);
      if (!isActive) return;

      if (!nextPhoto) {
        setState((current) => ({ ...current, isLoading: false }));
        return;
      }

      setState((current) => ({
        photo: nextPhoto,
        previousPhoto: current.photo,
        source: 'remote',
        isLoading: false,
      }));

      const cachedAt = Date.now();
      memoryCache.set(destinationId, { photo: nextPhoto, cachedAt });
      await writeCachedDestinationPhoto(destinationId, nextPhoto);
    };

    void initialize();

    return () => {
      isActive = false;
    };
  }, [destinationId, imageQuery]);

  const handleImageError = useCallback(() => {
    if (state.previousPhoto) {
      const fallbackCache = {
        photo: state.previousPhoto,
        cachedAt: Date.now(),
      };
      memoryCache.set(destinationId, fallbackCache);
      void writeCachedDestinationPhoto(destinationId, state.previousPhoto);
      setState({
        photo: state.previousPhoto,
        previousPhoto: null,
        source: 'cache',
        isLoading: false,
      });
      return;
    }

    memoryCache.delete(destinationId);
    void removeCachedDestinationPhoto(destinationId);
    setState({
      photo: null,
      previousPhoto: null,
      source: 'fallback',
      isLoading: false,
    });
  }, [destinationId, state.previousPhoto]);

  return {
    photo: state.photo,
    imageUrl: state.photo?.urls.regular ?? null,
    source: state.source,
    isLoading: state.isLoading,
    handleImageError,
  };
}
