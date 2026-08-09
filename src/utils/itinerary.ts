import type {
  ItineraryPlan,
  ItineraryStop,
  ManualItineraryStopInput,
} from '@/types/itinerary';
import type { TravelAlert } from '@/types/travel-alert';

const MINUTES_PER_DAY = 24 * 60;

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
  itinerary: { approvedPlan: ItineraryPlan | null },
): boolean {
  const remainingStops = (itinerary.approvedPlan?.stops ?? []).filter(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  if (remainingStops.length === 0) return false;
  if (alert.scope === 'route') return true;
  if (alert.scope === 'nearby') return alert.severity === 'danger';

  const normalizedLocation = alert.locationName.toLocaleLowerCase();
  return remainingStops.some((stop) =>
    normalizedLocation.includes(stop.destinationNameSnapshot.toLocaleLowerCase()),
  );
}
