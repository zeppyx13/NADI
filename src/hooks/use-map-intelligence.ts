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

export type TrafficGeometryPhase = 'resolving' | 'resolved';

export type MapIntelligenceState = MapIntelligenceData & {
  isLoading: boolean;
  /** Road-alignment lifecycle of the traffic layer, independent of the rest. */
  trafficGeometryPhase: TrafficGeometryPhase;
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
  // Resolution starts on mount, so 'resolving' is the honest initial value and
  // no state has to be set synchronously inside the effect.
  const [trafficGeometryPhase, setTrafficGeometryPhase] =
    useState<TrafficGeometryPhase>('resolving');

  // Every layer loads from local data straight away. Traffic starts from its
  // coarse anchors here so nothing waits on the network.
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

  // Road alignment runs on its own, updating only the traffic layer. A failure
  // or a slow provider leaves every other layer already on screen.
  useEffect(() => {
    const controller = new AbortController();

    const resolve = async () => {
      const resolved = await trafficRepository.listSegmentsWithRoadGeometry(
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setData((current) => ({ ...current, trafficSegments: resolved }));
      setTrafficGeometryPhase('resolved');
    };

    void resolve().catch(() => undefined);

    return () => controller.abort();
  }, []);

  return { ...data, isLoading, trafficGeometryPhase };
}
