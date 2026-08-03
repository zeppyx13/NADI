import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { colors } from '@/constants/theme';
import { fetchRandomAuthPhoto } from '@/services/unsplash';
import {
  isAuthHeroCacheFresh,
  readCachedAuthHeroPhoto,
  writeCachedAuthHeroPhoto,
} from '@/storage/auth-hero-cache';
import type { UnsplashPhoto } from '@/types/unsplash';

export type AuthHeroState = {
  photo: UnsplashPhoto | null;
  imageUrl: string | null;
  fallbackColor: string;
  isLoading: boolean;
  source: 'remote' | 'cache' | 'fallback';
  refresh: () => Promise<void>;
};

const AuthHeroContext = createContext<AuthHeroState | null>(null);

export function AuthHeroProvider({ children }: PropsWithChildren) {
  const [photo, setPhoto] = useState<UnsplashPhoto | null>(null);
  const [source, setSource] = useState<AuthHeroState['source']>('fallback');
  const [isLoading, setIsLoading] = useState(true);
  const requestControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    requestControllerRef.current?.abort();
    const requestController = new AbortController();
    requestControllerRef.current = requestController;
    setIsLoading(true);

    try {
      const nextPhoto = await fetchRandomAuthPhoto(requestController.signal);
      if (!nextPhoto || requestController.signal.aborted) {
        return;
      }

      setPhoto(nextPhoto);
      setSource('remote');
      await writeCachedAuthHeroPhoto(nextPhoto);
    } finally {
      if (requestControllerRef.current === requestController) {
        requestControllerRef.current = null;
        if (!requestController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      const cachedPhoto = await readCachedAuthHeroPhoto();
      if (!isActive) return;

      if (cachedPhoto) {
        setPhoto(cachedPhoto.photo);
        setSource('cache');
      }

      if (cachedPhoto && isAuthHeroCacheFresh(cachedPhoto.cachedAt)) {
        setIsLoading(false);
        return;
      }

      await refresh();
    };

    void initialize();

    return () => {
      isActive = false;
      requestControllerRef.current?.abort();
    };
  }, [refresh]);

  const value = useMemo<AuthHeroState>(
    () => ({
      photo,
      imageUrl: photo?.urls.regular ?? null,
      fallbackColor: colors.brand[700],
      isLoading,
      source,
      refresh,
    }),
    [isLoading, photo, refresh, source],
  );

  return <AuthHeroContext.Provider value={value}>{children}</AuthHeroContext.Provider>;
}

export function useAuthHeroImage(): AuthHeroState {
  const context = useContext(AuthHeroContext);
  if (!context) {
    throw new Error('useAuthHeroImage must be used within AuthHeroProvider.');
  }
  return context;
}
