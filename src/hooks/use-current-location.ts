import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapLatLng } from '@/types/map';

export type CurrentLocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export type CurrentLocationState = {
  coordinate: MapLatLng | null;
  status: CurrentLocationStatus;
  /** Explicit user-triggered resolve. Prompts for permission at most once. */
  resolve: () => Promise<MapLatLng | null>;
};

function toCoordinate(position: Location.LocationObject): MapLatLng {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/**
 * Device location is an enhancement, never a requirement. When permission is
 * missing or the platform service fails, the map keeps working from the
 * simulated start location provided by the caller.
 */
export function useCurrentLocation(): CurrentLocationState {
  const [coordinate, setCoordinate] = useState<MapLatLng | null>(null);
  const [status, setStatus] = useState<CurrentLocationStatus>('idle');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reads the already-granted permission without showing a prompt.
  useEffect(() => {
    let cancelled = false;

    const readGrantedLocation = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (cancelled || !permission.granted) return;

        const lastKnown = await Location.getLastKnownPositionAsync();
        if (cancelled || !lastKnown) {
          if (!cancelled) setStatus('granted');
          return;
        }
        setCoordinate(toCoordinate(lastKnown));
        setStatus('granted');
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    };

    void readGrantedLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolve = useCallback(async (): Promise<MapLatLng | null> => {
    setStatus('requesting');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        if (isMountedRef.current) setStatus('denied');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextCoordinate = toCoordinate(position);
      if (isMountedRef.current) {
        setCoordinate(nextCoordinate);
        setStatus('granted');
      }
      return nextCoordinate;
    } catch {
      if (isMountedRef.current) setStatus('unavailable');
      return null;
    }
  }, []);

  return { coordinate, status, resolve };
}
