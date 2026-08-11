import { useEffect, useState } from 'react';

import {
  crowdRepository,
  incidentRepository,
  monitoringRepository,
  parkingRepository,
  safetyRepository,
  trafficRepository,
} from '@/services/map-intelligence-repository';
import type {
  DestinationCrowd,
  MapIncident,
  MonitoringPoint,
  ParkingArea,
  SafetyZone,
  TrafficSegment,
} from '@/types/map-intelligence';

export type MapIntelligenceData = {
  trafficSegments: readonly TrafficSegment[];
  monitoringPoints: readonly MonitoringPoint[];
  incidents: readonly MapIncident[];
  destinationCrowd: readonly DestinationCrowd[];
  safetyZones: readonly SafetyZone[];
  parkingAreas: readonly ParkingArea[];
};

export type MapIntelligenceState = MapIntelligenceData & {
  isLoading: boolean;
};

const emptyIntelligence: MapIntelligenceData = {
  trafficSegments: [],
  monitoringPoints: [],
  incidents: [],
  destinationCrowd: [],
  safetyZones: [],
  parkingAreas: [],
};

/**
 * Loads every intelligence layer once and keeps it in memory. Layer visibility
 * is handled separately on the map screen, so toggling a layer off never drops
 * the data loaded here.
 */
export function useMapIntelligence(): MapIntelligenceState {
  const [data, setData] = useState<MapIntelligenceData>(emptyIntelligence);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [
        loadedTraffic,
        loadedMonitoring,
        loadedIncidents,
        loadedCrowd,
        loadedSafety,
        loadedParking,
      ] = await Promise.all([
        trafficRepository.listSegments(),
        monitoringRepository.listPoints(),
        incidentRepository.listActive(),
        crowdRepository.listDestinationCrowd(),
        safetyRepository.listZones(),
        parkingRepository.listAreas(),
      ]);

      if (cancelled) return;
      setData({
        trafficSegments: loadedTraffic,
        monitoringPoints: loadedMonitoring,
        incidents: loadedIncidents,
        destinationCrowd: loadedCrowd,
        safetyZones: loadedSafety,
        parkingAreas: loadedParking,
      });
      setIsLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, isLoading };
}
