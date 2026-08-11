import { itineraryDecisionThresholds } from '@/data/itinerary-thresholds';
import {
  crowdRepository,
  parkingRepository,
  safetyRepository,
} from '@/services/map-intelligence-repository';
import type { OccupancyLevel } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { ParkingStatus, RouteRisk } from '@/types/itinerary';
import type { MapLatLng } from '@/types/map';
import { distanceToPathMeters } from '@/utils/geo';

/**
 * Condition of a destination now and at the moment the traveller is expected to
 * arrive. Every field is optional coverage: a destination NADI does not monitor
 * simply returns nothing rather than an invented reading.
 *
 * The forecast comes from the local deterministic dataset introduced in Phase 2,
 * not from a trained model.
 */
export type DestinationArrivalCondition = {
  destinationId: string;
  /** Minutes from now used to derive `arrivalAt`. */
  travelMinutes: number;
  arrivalAt: string;
  currentLevel?: OccupancyLevel;
  predictedLevel?: OccupancyLevel;
  currentLoadRatio?: number;
  predictedLoadRatio?: number;
  parkingStatus?: ParkingStatus;
  /** Access risk of the surrounding area, separate from route scoring. */
  areaRisk?: RouteRisk;
  hasCoverage: boolean;
};

const AREA_RISK_RADIUS_MULTIPLIER = 1.2;

function ratioToOccupancyLevel(ratio: number): OccupancyLevel {
  if (ratio >= itineraryDecisionThresholds.occupancy.critical) return 'critical';
  if (ratio >= itineraryDecisionThresholds.occupancy.high) return 'high';
  if (ratio >= itineraryDecisionThresholds.occupancy.moderate) return 'moderate';
  return 'low';
}

function formatClockTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function riskAtLocation(
  location: MapLatLng,
  zones: readonly { latitude: number; longitude: number; radiusMeters: number; risk: RouteRisk }[],
): RouteRisk | undefined {
  const severity: Record<RouteRisk, number> = { low: 0, medium: 1, high: 2 };
  let worst: RouteRisk | undefined;

  zones.forEach((zone) => {
    const distance = distanceToPathMeters(zone, [location]);
    if (distance > zone.radiusMeters * AREA_RISK_RADIUS_MULTIPLIER) return;
    if (!worst || severity[zone.risk] > severity[worst]) worst = zone.risk;
  });

  return worst;
}

export interface DestinationConditionService {
  getArrivalCondition(
    destination: Destination,
    travelMinutes: number,
    now?: Date,
  ): Promise<DestinationArrivalCondition>;
}

export class LocalDestinationConditionService
  implements DestinationConditionService
{
  async getArrivalCondition(
    destination: Destination,
    travelMinutes: number,
    now: Date = new Date(),
  ): Promise<DestinationArrivalCondition> {
    const [crowdEntries, parkingAreas, safetyZones] = await Promise.all([
      crowdRepository.listDestinationCrowd(),
      parkingRepository.listAreas(),
      safetyRepository.listZones(),
    ]);

    const crowd = crowdEntries.find(
      (entry) => entry.destinationId === destination.id,
    );
    const parking = parkingAreas.find(
      (area) => area.destinationId === destination.id,
    );
    const areaRisk = riskAtLocation(destination, safetyZones);

    const arrival = new Date(now.getTime() + travelMinutes * 60_000);
    const predictedLoadRatio = crowd?.predictedLoadRatio ?? crowd?.currentLoadRatio;

    return {
      destinationId: destination.id,
      travelMinutes,
      arrivalAt: formatClockTime(arrival),
      currentLevel: crowd
        ? ratioToOccupancyLevel(crowd.currentLoadRatio)
        : undefined,
      predictedLevel:
        predictedLoadRatio !== undefined
          ? ratioToOccupancyLevel(predictedLoadRatio)
          : undefined,
      currentLoadRatio: crowd?.currentLoadRatio,
      predictedLoadRatio,
      parkingStatus: parking?.status,
      areaRisk,
      hasCoverage: Boolean(crowd || parking || areaRisk),
    };
  }
}

export const destinationConditionService: DestinationConditionService =
  new LocalDestinationConditionService();
