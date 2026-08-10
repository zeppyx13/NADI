import type {
  DurationType,
  ItineraryAnalysis,
  ItineraryPlan,
  ItineraryStop,
  ManualItineraryStopInput,
  TravelStyle,
} from '@/types/itinerary';
import type { TravelAlert } from '@/types/travel-alert';

const MINUTES_PER_DAY = 24 * 60;
const LOCAL_KILOMETERS_PER_LATITUDE_DEGREE = 110.57;
const LOCAL_KILOMETERS_PER_LONGITUDE_DEGREE = 111.32;
const NEXT_LEG_ALERT_CORRIDOR_KILOMETERS = 3;

export function getMaximumItineraryStops(
  durationType: DurationType,
  travelStyle: TravelStyle,
): number {
  if (durationType === 'half-day') return travelStyle === 'relaxed' ? 2 : 3;
  if (durationType === 'one-day') {
    if (travelStyle === 'relaxed') return 3;
    if (travelStyle === 'intensive') return 5;
    return 4;
  }
  return 5;
}

export function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutesToTime(value: string, minutes: number): string {
  return formatMinutesAsTime((parseTimeToMinutes(value) ?? 0) + minutes);
}

export function getLocalDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfLocalDay(date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && getLocalDateInput(date) === value;
}

export function formatItineraryDate(value: string, language: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function createItineraryId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function clonePlan(plan: ItineraryPlan): ItineraryPlan {
  return {
    ...plan,
    stops: plan.stops.map((stop) => ({
      ...stop,
      place: { ...stop.place },
      routeToStop: stop.routeToStop
        ? { ...stop.routeToStop, activeIncidentIds: [...stop.routeToStop.activeIncidentIds] }
        : undefined,
      conditionSnapshot: stop.conditionSnapshot
        ? {
            ...stop.conditionSnapshot,
            occupancy: { ...stop.conditionSnapshot.occupancy },
            access: {
              ...stop.conditionSnapshot.access,
              activeIncidentIds: [...stop.conditionSnapshot.access.activeIncidentIds],
            },
            parking: { ...stop.conditionSnapshot.parking },
            localContext: stop.conditionSnapshot.localContext
              ? { ...stop.conditionSnapshot.localContext }
              : undefined,
          }
        : undefined,
    })),
  };
}

export function calculatePlanTotals(stops: ItineraryStop[]): Pick<
  ItineraryPlan,
  'estimatedTotalTravelMinutes' | 'estimatedTotalVisitMinutes'
> {
  return {
    estimatedTotalTravelMinutes: stops.reduce(
      (total, stop) => total + (stop.routeToStop?.estimatedTravelMinutes ?? 0),
      0,
    ),
    estimatedTotalVisitMinutes: stops.reduce(
      (total, stop) => total + stop.visitDurationMinutes,
      0,
    ),
  };
}

export function validateManualStopSequence(stops: ManualItineraryStopInput[]): boolean {
  let previousArrival = -1;

  return stops.every((stop) => {
    const arrival = parseTimeToMinutes(stop.plannedArrival);
    const valid =
      arrival !== null &&
      arrival >= previousArrival &&
      Number.isFinite(stop.visitDurationMinutes) &&
      stop.visitDurationMinutes > 0;
    if (arrival !== null) previousArrival = arrival;
    return valid;
  });
}

export function isEventRelevantToItinerary(
  alert: TravelAlert,
  itinerary: {
    approvedPlan: ItineraryPlan | null;
    latestAnalysis?: Pick<ItineraryAnalysis, 'stopAssessments'> | null;
  },
): boolean {
  const remainingStops = (itinerary.approvedPlan?.stops ?? []).filter(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  if (remainingStops.length === 0) return false;

  const remainingStopIds = new Set(remainingStops.map((stop) => stop.id));
  const activeIncidentIds = new Set(
    remainingStops.flatMap((stop) => [
      ...(stop.routeToStop?.activeIncidentIds ?? []),
      ...(stop.conditionSnapshot?.access.activeIncidentIds ?? []),
    ]),
  );
  itinerary.latestAnalysis?.stopAssessments.forEach((assessment) => {
    if (!remainingStopIds.has(assessment.stopId)) return;
    assessment.condition.access.activeIncidentIds.forEach((incidentId) =>
      activeIncidentIds.add(incidentId),
    );
  });
  if (activeIncidentIds.has(alert.id)) return true;

  const normalizedLocation = alert.locationName.toLocaleLowerCase();
  return remainingStops.some((stop) => {
    const destinationName = stop.destinationNameSnapshot.toLocaleLowerCase();
    return (
      normalizedLocation.includes(destinationName) ||
      destinationName.includes(normalizedLocation)
    );
  });
}

export function isRouteDisruptionAlert(
  alert: Pick<TravelAlert, 'type'>,
): boolean {
  return (
    alert.type === 'incident' ||
    alert.type === 'traffic' ||
    alert.type === 'road-closure'
  );
}

function getDistanceToLegKilometers(
  point: { latitude: number; longitude: number },
  legStart: { latitude: number; longitude: number },
  legEnd: { latitude: number; longitude: number },
): number {
  const referenceLatitudeRadians =
    (((point.latitude + legStart.latitude + legEnd.latitude) / 3) * Math.PI) /
    180;
  const longitudeScale =
    LOCAL_KILOMETERS_PER_LONGITUDE_DEGREE *
    Math.cos(referenceLatitudeRadians);
  const toLocalPoint = (coordinate: {
    latitude: number;
    longitude: number;
  }) => ({
    x: coordinate.longitude * longitudeScale,
    y: coordinate.latitude * LOCAL_KILOMETERS_PER_LATITUDE_DEGREE,
  });
  const localPoint = toLocalPoint(point);
  const localStart = toLocalPoint(legStart);
  const localEnd = toLocalPoint(legEnd);
  const legX = localEnd.x - localStart.x;
  const legY = localEnd.y - localStart.y;
  const legLengthSquared = legX ** 2 + legY ** 2;

  if (legLengthSquared === 0) {
    return Math.hypot(
      localPoint.x - localStart.x,
      localPoint.y - localStart.y,
    );
  }

  const projection = Math.min(
    1,
    Math.max(
      0,
      ((localPoint.x - localStart.x) * legX +
        (localPoint.y - localStart.y) * legY) /
        legLengthSquared,
    ),
  );
  const nearestX = localStart.x + projection * legX;
  const nearestY = localStart.y + projection * legY;

  return Math.hypot(localPoint.x - nearestX, localPoint.y - nearestY);
}

/**
 * Determines whether a mobility alert is close enough to the next remaining
 * itinerary leg to justify running the deterministic route-incident scenario.
 * Display relevance remains stricter and is handled by
 * `isEventRelevantToItinerary` after analysis records the incident ID.
 */
export function isEventNearNextItineraryLeg(
  alert: TravelAlert,
  itinerary: {
    startLocation: {
      latitude: number;
      longitude: number;
    };
    approvedPlan: ItineraryPlan | null;
  },
): boolean {
  if (!isRouteDisruptionAlert(alert)) {
    return false;
  }

  const stops = itinerary.approvedPlan?.stops ?? [];
  const nextStopIndex = stops.findIndex(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  if (nextStopIndex < 0) return false;

  const nextStop = stops[nextStopIndex];
  const previousCompletedStop = stops
    .slice(0, nextStopIndex)
    .reverse()
    .find((stop) => stop.status === 'completed');
  const legStart = previousCompletedStop?.place ?? itinerary.startLocation;

  return (
    getDistanceToLegKilometers(alert, legStart, nextStop.place) <=
    NEXT_LEG_ALERT_CORRIDOR_KILOMETERS
  );
}
