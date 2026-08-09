import { destinations } from '@/data/destinations';
import {
  destinationScenarioConditions,
  getTravelMinutes,
} from '@/data/itinerary-scenarios';
import type { Destination } from '@/types/destination';
import type {
  CreateGeneratedItineraryInput,
  CreateManualItineraryInput,
  ItineraryPlan,
  ItineraryStop,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';
import {
  addMinutesToTime,
  calculatePlanTotals,
} from '@/utils/itinerary';

export interface ItineraryGenerationService {
  generateFromPreferences(
    input: CreateGeneratedItineraryInput,
    itineraryId?: string,
  ): Promise<ItineraryPlan>;
  normalizeManualPlan(
    input: CreateManualItineraryInput,
    itineraryId?: string,
  ): Promise<ItineraryPlan>;
}

function getRouteRisk(destinationId: string): RouteRisk {
  return destinationScenarioConditions[destinationId]?.routeRisk ?? 'medium';
}

function getTrafficLevel(destinationId: string): TrafficLevel {
  return destinationScenarioConditions[destinationId]?.trafficLevel ?? 'moderate';
}

function getVisitDurationMinutes(style: CreateGeneratedItineraryInput['preferences']['travelStyle']) {
  if (style === 'relaxed') return 105;
  if (style === 'intensive') return 60;
  return 90;
}

function getMaximumStops(input: CreateGeneratedItineraryInput): number {
  const { durationType, travelStyle } = input.preferences;
  if (durationType === 'half-day') return travelStyle === 'relaxed' ? 2 : 3;
  if (durationType === 'one-day') {
    if (travelStyle === 'relaxed') return 3;
    if (travelStyle === 'intensive') return 5;
    return 4;
  }
  return 5;
}

function orderByNearestNeighbor(
  candidates: Destination[],
  startLocationId: string | undefined,
): Destination[] {
  const remaining = [...candidates];
  const ordered: Destination[] = [];
  let previousId = startLocationId ?? 'denpasar';

  while (remaining.length > 0) {
    remaining.sort(
      (first, second) =>
        getTravelMinutes(previousId, first.id) - getTravelMinutes(previousId, second.id) ||
        first.id.localeCompare(second.id),
    );
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    previousId = next.id;
  }

  return ordered;
}

function selectDestinations(input: CreateGeneratedItineraryInput): Destination[] {
  const mustVisit = input.preferences.mustVisitDestinationIds.flatMap((destinationId) => {
    const destination = destinations.find((item) => item.id === destinationId);
    return destination ? [destination] : [];
  });
  const matchesInterest = destinations.filter((destination) =>
    input.preferences.interests.includes(destination.category),
  );
  const safeFallbacks = destinations.filter(
    (destination) =>
      destinationScenarioConditions[destination.id]?.basePredictedLoadRatio < 0.9,
  );
  const candidates = [...mustVisit, ...matchesInterest, ...safeFallbacks, ...destinations].filter(
    (destination, index, list) =>
      list.findIndex((item) => item.id === destination.id) === index,
  );
  const selected = candidates.slice(0, getMaximumStops(input));
  const ordered = orderByNearestNeighbor(selected, input.startLocation.id);

  return ordered.sort((first, second) => {
    const firstMustVisit = input.preferences.mustVisitDestinationIds.includes(first.id);
    const secondMustVisit = input.preferences.mustVisitDestinationIds.includes(second.id);
    if (firstMustVisit === secondMustVisit) return 0;
    return firstMustVisit ? -1 : 1;
  });
}

function createRouteSnapshot(
  fromId: string | undefined,
  destinationId: string,
  mode: CreateGeneratedItineraryInput['preferences']['routePreference'],
) {
  return {
    mode,
    estimatedTravelMinutes: getTravelMinutes(fromId, destinationId),
    trafficLevel: getTrafficLevel(destinationId),
    routeRisk: getRouteRisk(destinationId),
    activeIncidentIds: [
      ...(destinationScenarioConditions[destinationId]?.activeIncidentIds ?? []),
    ],
    roadClosed: destinationScenarioConditions[destinationId]?.roadClosed ?? false,
  };
}

export class LocalItineraryGenerationService implements ItineraryGenerationService {
  async generateFromPreferences(
    input: CreateGeneratedItineraryInput,
    itineraryId = 'generated-draft',
  ): Promise<ItineraryPlan> {
    const selectedDestinations = selectDestinations(input);
    const visitDurationMinutes = getVisitDurationMinutes(input.preferences.travelStyle);
    let previousId = input.startLocation.id;
    let cursor = input.startTime;

    const stops = selectedDestinations.map((destination, index): ItineraryStop => {
      const routeToStop = createRouteSnapshot(
        previousId,
        destination.id,
        input.preferences.routePreference,
      );
      const plannedArrival = addMinutesToTime(
        cursor,
        routeToStop.estimatedTravelMinutes,
      );
      const plannedDeparture = addMinutesToTime(plannedArrival, visitDurationMinutes);
      previousId = destination.id;
      cursor = plannedDeparture;

      return {
        id: `${itineraryId}-stop-${index + 1}`,
        destinationId: destination.id,
        destinationNameSnapshot: destination.name,
        plannedArrival,
        plannedDeparture,
        visitDurationMinutes,
        status: 'upcoming',
        routeToStop,
      };
    });

    return { stops, ...calculatePlanTotals(stops) };
  }

  async normalizeManualPlan(
    input: CreateManualItineraryInput,
    itineraryId = 'manual-draft',
  ): Promise<ItineraryPlan> {
    let previousId = input.startLocation.id;
    const stops = input.stops.flatMap((stopInput, index): ItineraryStop[] => {
      const destination = destinations.find(
        (item) => item.id === stopInput.destinationId,
      );
      if (!destination) return [];

      const routeToStop = createRouteSnapshot(
        previousId,
        destination.id,
        input.routePreference,
      );
      previousId = destination.id;

      return [
        {
          id: `${itineraryId}-stop-${index + 1}`,
          destinationId: destination.id,
          destinationNameSnapshot: destination.name,
          plannedArrival: stopInput.plannedArrival,
          plannedDeparture: addMinutesToTime(
            stopInput.plannedArrival,
            stopInput.visitDurationMinutes,
          ),
          visitDurationMinutes: stopInput.visitDurationMinutes,
          status: 'upcoming',
          routeToStop,
        },
      ];
    });

    return { stops, ...calculatePlanTotals(stops) };
  }
}
