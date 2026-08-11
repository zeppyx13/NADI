import { destinationCrowd } from '@/data/destination-crowd';
import { mapIncidents } from '@/data/map-incidents';
import { monitoringPoints } from '@/data/monitoring-points';
import { parkingAreas } from '@/data/parking-areas';
import { safetyZones } from '@/data/safety-zones';
import { trafficSegments } from '@/data/traffic-segments';
import type {
  DestinationCrowd,
  MapIncident,
  MonitoringPoint,
  ParkingArea,
  SafetyZone,
  TrafficSegment,
} from '@/types/map-intelligence';

/**
 * Read models behind the map intelligence layers. Each interface stands on its
 * own so a future API-backed implementation can replace one source without
 * touching the others. Every method is async because the replacement will be.
 *
 * Hiding a layer on the map never removes data from these repositories.
 */

export interface TrafficRepository {
  listSegments(): Promise<readonly TrafficSegment[]>;
}

export interface MonitoringRepository {
  listPoints(): Promise<readonly MonitoringPoint[]>;
  getPointById(id: string): Promise<MonitoringPoint | null>;
}

export interface IncidentRepository {
  /** Active incidents only; resolved entries stay available via `listAll`. */
  listActive(): Promise<readonly MapIncident[]>;
  listAll(): Promise<readonly MapIncident[]>;
  listLocalEvents(): Promise<readonly MapIncident[]>;
  getByAlertId(alertId: string): Promise<MapIncident | null>;
}

export interface CrowdRepository {
  listDestinationCrowd(): Promise<readonly DestinationCrowd[]>;
}

export interface SafetyRepository {
  listZones(): Promise<readonly SafetyZone[]>;
}

export interface ParkingRepository {
  listAreas(): Promise<readonly ParkingArea[]>;
}

export class LocalTrafficRepository implements TrafficRepository {
  listSegments(): Promise<readonly TrafficSegment[]> {
    return Promise.resolve(trafficSegments);
  }
}

export class LocalMonitoringRepository implements MonitoringRepository {
  listPoints(): Promise<readonly MonitoringPoint[]> {
    return Promise.resolve(monitoringPoints);
  }

  getPointById(id: string): Promise<MonitoringPoint | null> {
    return Promise.resolve(
      monitoringPoints.find((point) => point.id === id) ?? null,
    );
  }
}

export class LocalIncidentRepository implements IncidentRepository {
  listActive(): Promise<readonly MapIncident[]> {
    return Promise.resolve(
      mapIncidents.filter((incident) => incident.status !== 'resolved'),
    );
  }

  listAll(): Promise<readonly MapIncident[]> {
    return Promise.resolve(mapIncidents);
  }

  listLocalEvents(): Promise<readonly MapIncident[]> {
    return Promise.resolve(
      mapIncidents.filter(
        (incident) =>
          incident.type === 'local-event' && incident.status !== 'resolved',
      ),
    );
  }

  getByAlertId(alertId: string): Promise<MapIncident | null> {
    return Promise.resolve(
      mapIncidents.find((incident) => incident.alertId === alertId) ?? null,
    );
  }
}

export class LocalCrowdRepository implements CrowdRepository {
  listDestinationCrowd(): Promise<readonly DestinationCrowd[]> {
    return Promise.resolve(destinationCrowd);
  }
}

export class LocalSafetyRepository implements SafetyRepository {
  listZones(): Promise<readonly SafetyZone[]> {
    return Promise.resolve(safetyZones);
  }
}

export class LocalParkingRepository implements ParkingRepository {
  listAreas(): Promise<readonly ParkingArea[]> {
    return Promise.resolve(parkingAreas);
  }
}

export const trafficRepository: TrafficRepository = new LocalTrafficRepository();
export const monitoringRepository: MonitoringRepository =
  new LocalMonitoringRepository();
export const incidentRepository: IncidentRepository =
  new LocalIncidentRepository();
export const crowdRepository: CrowdRepository = new LocalCrowdRepository();
export const safetyRepository: SafetyRepository = new LocalSafetyRepository();
export const parkingRepository: ParkingRepository = new LocalParkingRepository();
