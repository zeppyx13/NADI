import { destinations } from '@/data/destinations';
import {
  destinationScenarioConditions,
  getTravelMinutesBetween,
} from '@/data/itinerary-scenarios';
import type { Destination } from '@/types/destination';
import type {
  CreateGeneratedItineraryInput,
  CreateManualItineraryInput,
  ItineraryLocation,
  ItineraryPlan,
  ItineraryStop,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';
import {
  addMinutesToTime,
  calculatePlanTotals,
  getMaximumItineraryStops,
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

function getVisitDurationMinutes(
  destination: Destination,
  style: CreateGeneratedItineraryInput['preferences']['travelStyle'],
) {
  const styleMultiplier = style === 'relaxed' ? 1.15 : style === 'intensive' ? 0.75 : 1;
  const adjustedMinutes = destination.suggestedVisitMinutes * styleMultiplier;
  return Math.min(180, Math.max(60, Math.round(adjustedMinutes / 15) * 15));
}

function orderByNearestNeighbor(
  candidates: Destination[],
  startLocation: ItineraryLocation,
): Destination[] {
  const remaining = [...candidates];
  const ordered: Destination[] = [];
  let previousLocation: ItineraryLocation = startLocation;

  while (remaining.length > 0) {
    remaining.sort(
      (first, second) =>
        getTravelMinutesBetween(previousLocation, first) -
          getTravelMinutesBetween(previousLocation, second) ||
        first.id.localeCompare(second.id),
    );
    const next = remaining.shift();
    if (!next) break;
    ordered.push(next);
    previousLocation = next;
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
  const intelligenceBackedFallbacks = destinations.filter(
    (destination) =>
      destination.intelligenceCoverage === 'pilot' &&
      destinationScenarioConditions[destination.id]?.basePredictedLoadRatio < 0.9,
  );
  const candidates = [
    ...mustVisit,
    ...matchesInterest,
    ...intelligenceBackedFallbacks,
    ...destinations,
  ].filter(
    (destination, index, list) =>
      list.findIndex((item) => item.id === destination.id) === index,
  );
  const selected = candidates.slice(
    0,
    getMaximumItineraryStops(
      input.preferences.durationType,
      input.preferences.travelStyle,
    ),
  );
  const ordered = orderByNearestNeighbor(selected, input.startLocation);

  return ordered.sort((first, second) => {
    const firstMustVisit = input.preferences.mustVisitDestinationIds.includes(first.id);
    const secondMustVisit = input.preferences.mustVisitDestinationIds.includes(second.id);
    if (firstMustVisit === secondMustVisit) return 0;
    return firstMustVisit ? -1 : 1;
  });
}

function createRouteSnapshot(
  from: ItineraryLocation,
  destination: ItineraryLocation,
  mode: CreateGeneratedItineraryInput['preferences']['routePreference'],
) {
  const destinationId = destination.id ?? destination.name;
  return {
    mode,
    estimatedTravelMinutes: getTravelMinutesBetween(from, destination),
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
    let previousLocation: ItineraryLocation = input.startLocation;
    let cursor = input.startTime;

    const stops = selectedDestinations.map((destination, index): ItineraryStop => {
      const visitDurationMinutes = getVisitDurationMinutes(
        destination,
        input.preferences.travelStyle,
      );
      const routeToStop = createRouteSnapshot(
        previousLocation,
        destination,
        input.preferences.routePreference,
      );
      const plannedArrival = addMinutesToTime(
        cursor,
        routeToStop.estimatedTravelMinutes,
      );
      const plannedDeparture = addMinutesToTime(plannedArrival, visitDurationMinutes);
      previousLocation = destination;
      cursor = plannedDeparture;

      return {
        id: `${itineraryId}-stop-${index + 1}`,
        destinationId: destination.id,
        destinationNameSnapshot: destination.name,
        place: {
          id: destination.id,
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
          source: 'nadi-destination',
        },
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
    let previousLocation: ItineraryLocation = input.startLocation;
    const stops = input.stops.map((stopInput, index): ItineraryStop => {
      const routeToStop = createRouteSnapshot(
        previousLocation,
        stopInput.place,
        input.routePreference,
      );
      previousLocation = stopInput.place;

      return {
        id: `${itineraryId}-stop-${index + 1}`,
        destinationId: stopInput.destinationId,
        destinationNameSnapshot: stopInput.place.name,
        place: stopInput.place,
        plannedArrival: stopInput.plannedArrival,
        plannedDeparture: addMinutesToTime(
          stopInput.plannedArrival,
          stopInput.visitDurationMinutes,
        ),
        visitDurationMinutes: stopInput.visitDurationMinutes,
        status: 'upcoming',
        routeToStop,
      };
    });

    return { stops, ...calculatePlanTotals(stops) };
  }
}
