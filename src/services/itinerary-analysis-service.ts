import { destinations } from '@/data/destinations';
import {
  destinationScenarioConditions,
  getTravelMinutesBetween,
} from '@/data/itinerary-scenarios';
import { itineraryDecisionThresholds } from '@/data/itinerary-thresholds';
import type { Destination } from '@/types/destination';
import type {
  DestinationConditionSnapshot,
  DestinationAlternativeCandidate,
  Itinerary,
  ItineraryAnalysis,
  ItineraryDraft,
  ItineraryIssue,
  ItineraryIssueType,
  ItineraryLocation,
  ItineraryPlan,
  ItineraryRecommendation,
  ItineraryScenarioId,
  RouteRisk,
  TrafficLevel,
  ItineraryStop,
  StopAssessment,
} from '@/types/itinerary';
import {
  addMinutesToTime,
  calculatePlanTotals,
  clonePlan,
  createItineraryId,
} from '@/utils/itinerary';
import { routeService } from '@/services/route-service';
import {
  itineraryImpactService,
  toConditionSnapshot,
  type ItineraryImpactService,
} from './itinerary-impact-service';
import {
  LocalItineraryNarrativeService,
  type ItineraryNarrativeService,
} from './itinerary-narrative-service';

export interface ItineraryAnalysisService {
  analyze(
    itinerary: ItineraryDraft | Itinerary,
    scenarioId?: ItineraryScenarioId,
    remainingOnly?: boolean,
  ): Promise<ItineraryAnalysis>;
}

function getIssues(condition: DestinationConditionSnapshot): ItineraryIssue[] {
  const issues: ItineraryIssue[] = [];
  if (condition.access.roadClosed) {
    issues.push({ type: 'road-closure', severity: 'danger' });
  }
  if (condition.occupancy.predictedLoadRatio >= itineraryDecisionThresholds.occupancy.high) {
    issues.push({
      type: 'destination-crowding',
      severity:
        condition.occupancy.predictedLoadRatio >=
        itineraryDecisionThresholds.occupancy.critical
          ? 'danger'
          : 'warning',
    });
  }
  if (condition.access.activeIncidentIds.includes('incident-denpasar-01')) {
    issues.push({ type: 'route-incident', severity: 'danger' });
  } else if (condition.access.trafficLevel === 'heavy') {
    issues.push({ type: 'traffic-congestion', severity: 'warning' });
  }
  if (condition.access.routeRisk === 'high') {
    issues.push({ type: 'route-risk', severity: 'danger' });
  }
  if (condition.parking.status === 'full') {
    issues.push({ type: 'parking-full', severity: 'danger' });
  } else if (condition.parking.status === 'limited') {
    issues.push({ type: 'parking-limited', severity: 'warning' });
  }
  if (condition.localContext?.affectsAccess) {
    issues.push({ type: 'local-event', severity: 'warning' });
  }
  return issues;
}

function getAssessmentStatus(issues: ItineraryIssue[]): StopAssessment['status'] {
  if (issues.some((issue) => issue.type === 'road-closure' || issue.type === 'parking-full')) {
    return 'not-recommended';
  }
  if (issues.some((issue) => issue.severity === 'danger')) {
    return 'adjustment-recommended';
  }
  if (issues.some((issue) => issue.severity === 'warning')) return 'acceptable';
  return 'optimal';
}

function shiftStopsFromIndex(plan: ItineraryPlan, index: number, minutes: number) {
  const stops = plan.stops.map((stop, stopIndex) =>
    stopIndex < index || stop.status === 'completed' || stop.status === 'skipped'
      ? stop
      : {
          ...stop,
          plannedArrival: addMinutesToTime(stop.plannedArrival, minutes),
          plannedDeparture: addMinutesToTime(stop.plannedDeparture, minutes),
        },
  );
  return { ...plan, stops };
}

/** Minutes added when no provider alternative could be evaluated. */
const FALLBACK_REROUTE_DELAY_MINUTES = 18;

/**
 * Builds the reroute plan. When a real alternative was evaluated, its own
 * duration and risk are used; otherwise a conservative fixed delay applies.
 */
function createReroutePlan(
  plan: ItineraryPlan,
  stopId: string,
  alternative?: RerouteAlternative,
): ItineraryPlan {
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === stopId);
  if (affectedIndex < 0) return clonePlan(plan);

  const currentMinutes =
    plan.stops[affectedIndex].routeToStop?.estimatedTravelMinutes ?? 45;
  const nextMinutes = alternative
    ? alternative.estimatedTravelMinutes
    : currentMinutes + FALLBACK_REROUTE_DELAY_MINUTES;
  const delayMinutes = Math.max(0, nextMinutes - currentMinutes);

  const shifted = shiftStopsFromIndex(plan, affectedIndex, delayMinutes);
  const stops = shifted.stops.map((stop, index) =>
    index === affectedIndex
      ? {
          ...stop,
          routeToStop: {
            mode: 'safest' as const,
            estimatedTravelMinutes: nextMinutes,
            trafficLevel: alternative?.trafficLevel ?? ('moderate' as const),
            routeRisk: alternative?.routeRisk ?? ('low' as const),
            activeIncidentIds: [...(alternative?.blockingIncidentIds ?? [])],
            roadClosed: false,
          },
        }
      : stop,
  );
  return { ...shifted, stops, ...calculatePlanTotals(stops) };
}

type RerouteAlternative = {
  estimatedTravelMinutes: number;
  trafficLevel: TrafficLevel;
  routeRisk: RouteRisk;
  blockingIncidentIds: readonly string[];
};

/**
 * Asks the existing route service for candidates and picks one that NADI does
 * not consider disturbed.
 *
 * Google Routes has no parameter for "avoid this exact road", so nothing is
 * faked in the request. Candidates are requested normally and then judged
 * against NADI's own incident, closure, traffic and risk data.
 */
async function findRerouteAlternative(
  origin: ItineraryLocation,
  stop: ItineraryStop,
  impactService: ItineraryImpactService,
): Promise<RerouteAlternative | null> {
  try {
    const result = await routeService.computeRoutes({
      origin: {
        id: origin.id ?? 'journey-origin',
        name: origin.name,
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        id: stop.place.id,
        name: stop.place.name,
        latitude: stop.place.latitude,
        longitude: stop.place.longitude,
      },
    });
    if (result.routes.length === 0) return null;

    const impacts = await impactService.assessRouteCandidates(result.routes);
    const clearImpact = impacts.find((impact) => impact.isClear);
    const chosenImpact =
      clearImpact ??
      // Nothing is fully clear, so take whatever avoids a closure at least.
      impacts.find((impact) => !impact.crossesClosedRoad) ??
      null;
    if (!chosenImpact) return null;

    const chosen = result.routes.find(
      (route) => route.candidate.id === chosenImpact.routeId,
    );
    if (!chosen) return null;

    return {
      estimatedTravelMinutes: Math.max(
        1,
        Math.round(chosen.candidate.durationSeconds / 60),
      ),
      trafficLevel: chosenImpact.worstTrafficLevel,
      routeRisk: chosenImpact.routeRisk,
      blockingIncidentIds: chosenImpact.blockingIncidentIds,
    };
  } catch {
    return null;
  }
}

function createReschedulePlan(plan: ItineraryPlan, stopId: string): ItineraryPlan {
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === stopId);
  if (affectedIndex < 0) return clonePlan(plan);
  const shifted = shiftStopsFromIndex(
    plan,
    affectedIndex,
    itineraryDecisionThresholds.rescheduleMinutes,
  );
  return { ...shifted, ...calculatePlanTotals(shifted.stops) };
}

function rebuildSchedule(
  stops: ItineraryStop[],
  startTime: string,
  startLocation: ItineraryLocation,
  mutableStopIds?: ReadonlySet<string>,
): ItineraryStop[] {
  let cursor = startTime;
  let previousLocation: ItineraryLocation = startLocation;

  return stops.map((stop) => {
    if (mutableStopIds && !mutableStopIds.has(stop.id)) {
      previousLocation = stop.place;
      cursor = stop.plannedDeparture;
      return stop;
    }

    const travelMinutes = getTravelMinutesBetween(previousLocation, stop.place);
    const source = destinationScenarioConditions[stop.destinationId];
    const plannedArrival = addMinutesToTime(cursor, travelMinutes);
    const plannedDeparture = addMinutesToTime(
      plannedArrival,
      stop.visitDurationMinutes,
    );
    previousLocation = stop.place;
    cursor = plannedDeparture;
    return {
      ...stop,
      plannedArrival,
      plannedDeparture,
      routeToStop: {
        mode: stop.routeToStop?.mode ?? 'balanced',
        estimatedTravelMinutes: travelMinutes,
        trafficLevel: source?.trafficLevel ?? 'moderate',
        routeRisk: source?.routeRisk ?? 'medium',
        activeIncidentIds: [...(source?.activeIncidentIds ?? [])],
        roadClosed: source?.roadClosed ?? false,
      },
    };
  });
}

function createReorderPlan(
  plan: ItineraryPlan,
  stopId: string,
  startLocation: ItineraryLocation,
): ItineraryPlan {
  const movableStops = plan.stops.filter(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  const affectedMovableIndex = movableStops.findIndex((stop) => stop.id === stopId);
  if (affectedMovableIndex < 0 || movableStops.length < 2) return clonePlan(plan);
  const targetMovableIndex =
    affectedMovableIndex < movableStops.length - 1
      ? affectedMovableIndex + 1
      : affectedMovableIndex - 1;
  const targetStop = movableStops[targetMovableIndex];
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === stopId);
  const targetIndex = plan.stops.findIndex((stop) => stop.id === targetStop?.id);
  if (affectedIndex < 0 || targetIndex < 0) return clonePlan(plan);
  const reordered = clonePlan(plan).stops;
  [reordered[affectedIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[affectedIndex],
  ];
  const firstArrival = plan.stops[0]?.plannedArrival ?? '09:00';
  const firstTravelMinutes = plan.stops[0]?.routeToStop?.estimatedTravelMinutes ?? 45;
  const scheduled = rebuildSchedule(
    reordered,
    addMinutesToTime(firstArrival, -firstTravelMinutes),
    startLocation,
    new Set(movableStops.map((stop) => stop.id)),
  );
  return { stops: scheduled, ...calculatePlanTotals(scheduled) };
}

function findReplacement(
  affected: ItineraryStop,
  plan: ItineraryPlan,
  itinerary: Itinerary,
): Destination | null {
  const original = destinations.find((item) => item.id === affected.destinationId);
  if (!original) return null;
  const usedIds = new Set(plan.stops.map((stop) => stop.destinationId));
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === affected.id);
  const previousLocation =
    affectedIndex > 0
      ? plan.stops[affectedIndex - 1]?.place ?? itinerary.startLocation
      : itinerary.startLocation;
  const candidates: DestinationAlternativeCandidate[] = destinations
    .filter(
      (candidate) =>
        candidate.intelligenceCoverage === 'pilot' &&
        Boolean(destinationScenarioConditions[candidate.id]) &&
        !usedIds.has(candidate.id),
    )
    .map((candidate) => {
      const source = destinationScenarioConditions[candidate.id];
      const sameCategory = candidate.category === original.category;
      const matchesInterest = itinerary.preferences.interests.includes(candidate.category);
      const similarityScore = Math.min(
        1,
        (sameCategory ? 0.85 : 0.45) + (matchesInterest ? 0.15 : 0),
      );
      return {
        destinationId: candidate.id,
        similarityScore,
        predictedLoadRatio: source?.basePredictedLoadRatio ?? 1,
        estimatedTravelMinutes: getTravelMinutesBetween(previousLocation, candidate),
        routeRisk: source?.routeRisk ?? 'high',
        reasons: [
          ...(sameCategory ? ['similar-experience'] : []),
          ...((source?.basePredictedLoadRatio ?? 1) <= 0.7
            ? ['lower-predicted-occupancy']
            : []),
          ...(source?.parkingStatus === 'available' ? ['parking-available'] : []),
          ...(source?.routeRisk === 'low' ? ['lower-route-risk'] : []),
        ],
      };
    })
    .filter(
      (candidate) =>
        candidate.similarityScore >=
          itineraryDecisionThresholds.alternative.minimumSimilarity &&
        candidate.predictedLoadRatio <=
          itineraryDecisionThresholds.alternative.maximumPredictedLoad &&
        candidate.routeRisk !== 'high',
    )
    .sort(
      (first, second) =>
        second.similarityScore - first.similarityScore ||
        first.predictedLoadRatio - second.predictedLoadRatio ||
        first.estimatedTravelMinutes - second.estimatedTravelMinutes,
    );
  const bestCandidate = candidates[0];
  return destinations.find((item) => item.id === bestCandidate?.destinationId) ?? null;
}

function createReplacementPlan(
  plan: ItineraryPlan,
  stopId: string,
  replacement: Destination,
  startLocation: ItineraryLocation,
): ItineraryPlan {
  const replaced = clonePlan(plan).stops.map((stop) =>
    stop.id === stopId
      ? {
          ...stop,
          destinationId: replacement.id,
          destinationNameSnapshot: replacement.name,
          place: {
            id: replacement.id,
            name: replacement.name,
            latitude: replacement.latitude,
            longitude: replacement.longitude,
            source: 'nadi-destination' as const,
          },
        }
      : stop,
  );
  const firstArrival = plan.stops[0]?.plannedArrival ?? '09:00';
  const firstTravelMinutes = plan.stops[0]?.routeToStop?.estimatedTravelMinutes ?? 45;
  const stops = rebuildSchedule(
    replaced,
    addMinutesToTime(firstArrival, -firstTravelMinutes),
    startLocation,
    new Set(
      plan.stops
        .filter(
          (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
        )
        .map((stop) => stop.id),
    ),
  );
  return { stops, ...calculatePlanTotals(stops) };
}

function uniqueReasonCodes(issues: ItineraryIssue[]): ItineraryIssueType[] {
  return [...new Set(issues.map((issue) => issue.type))];
}

export class LocalItineraryAnalysisService implements ItineraryAnalysisService {
  constructor(
    private readonly narrativeService: ItineraryNarrativeService =
      new LocalItineraryNarrativeService(),
    /**
     * Reads the map intelligence repositories. Injected the same way the
     * narrative service is, so nothing new is invented for wiring.
     */
    private readonly impactService: ItineraryImpactService = itineraryImpactService,
  ) {}

  async analyze(
    itinerary: ItineraryDraft | Itinerary,
    scenarioId: ItineraryScenarioId = 'destination-crowded',
    remainingOnly = false,
  ): Promise<ItineraryAnalysis> {
    const analyzedAt = new Date().toISOString();
    const plan = itinerary.approvedPlan ?? itinerary.originalPlan;
    const relevantStops = remainingOnly
      ? plan.stops.filter((stop) => stop.status !== 'completed' && stop.status !== 'skipped')
      : plan.stops;
    // Conditions now come from the map intelligence repositories: traffic with
    // road-aligned geometry, verified incidents, safety zones, crowd and
    // parking. The deterministic scenario is layered on the next remaining stop.
    const assessedStops = await Promise.all(
      relevantStops.map(async (stop, index) => {
        const intelligence = await this.impactService.assessStop(
          stop,
          scenarioId,
          index === 0,
        );
        return {
          stop,
          condition: toConditionSnapshot(
            intelligence,
            stop.plannedArrival,
            analyzedAt,
          ),
        };
      }),
    );
    const assessments = assessedStops.flatMap(
      ({ stop, condition }): StopAssessment[] => {
        if (!condition) return [];

        const issues = getIssues(condition);
        return [
          {
            stopId: stop.id,
            status: getAssessmentStatus(issues),
            condition,
            issues,
          },
        ];
      },
    );
    const affectedAssessment = assessments.find((assessment) =>
      assessment.issues.some((issue) => issue.severity === 'danger'),
    ) ?? assessments.find((assessment) => assessment.issues.length > 0);

    if (!affectedAssessment) {
      return {
        scenarioId,
        analyzedAt,
        stopAssessments: assessments,
        recommendations: [],
      };
    }

    const affectedStop = plan.stops.find(
      (stop) => stop.id === affectedAssessment.stopId,
    );
    if (!affectedStop) {
      return {
        scenarioId,
        analyzedAt,
        stopAssessments: assessments,
        recommendations: [],
      };
    }

    const reasonCodes = uniqueReasonCodes(affectedAssessment.issues);
    const hasRouteProblem = reasonCodes.some((reason) =>
      ['route-incident', 'road-closure', 'traffic-congestion', 'route-risk'].includes(reason),
    );
    const recommendations: ItineraryRecommendation[] = [];
    const createRecommendation = async (
      type: ItineraryRecommendation['type'],
      proposedPlan: ItineraryPlan,
      replacementName?: string,
    ) => {
      const proposedAffectedStop = proposedPlan.stops.find(
        (stop) => stop.id === affectedStop.id,
      );
      const explanation = await this.narrativeService.explainRecommendation({
        type,
        destinationName: affectedStop.destinationNameSnapshot,
        originalTime: affectedStop.plannedArrival,
        proposedTime: proposedAffectedStop?.plannedArrival,
        replacementName,
      });
      recommendations.push({
        id: createItineraryId(`recommendation-${type}`),
        type,
        affectedStopIds: [affectedStop.id],
        reasonCodes,
        proposedPlan,
        impact: {
          travelMinutesDelta:
            proposedPlan.estimatedTotalTravelMinutes - plan.estimatedTotalTravelMinutes,
          predictedCrowdingImprovement:
            type === 'reschedule' || type === 'reorder' || type === 'replace-destination'
              ? 0.28
              : undefined,
          routeRiskChange: type === 'reroute' ? 'lower' : 'same',
          keepsMustVisitDestinations:
            type !== 'replace-destination' ||
            !itinerary.preferences.mustVisitDestinationIds.includes(
              affectedStop.destinationId,
            ),
        },
        explanation,
        createdAt: analyzedAt,
      });
    };

    if (hasRouteProblem) {
      const alternative = await findRerouteAlternative(
        itinerary.startLocation,
        affectedStop,
        this.impactService,
      );
      await createRecommendation(
        'reroute',
        createReroutePlan(plan, affectedStop.id, alternative ?? undefined),
      );
    } else {
      await createRecommendation(
        'reschedule',
        createReschedulePlan(plan, affectedStop.id),
      );
    }

    if (relevantStops.length > 1) {
      await createRecommendation(
        'reorder',
        createReorderPlan(plan, affectedStop.id, itinerary.startLocation),
      );
    }

    const replacement = findReplacement(affectedStop, plan, itinerary);
    const mustVisit = itinerary.preferences.mustVisitDestinationIds.includes(
      affectedStop.destinationId,
    );
    const unavailable = reasonCodes.includes('road-closure');
    if (replacement && (!mustVisit || unavailable)) {
      await createRecommendation(
        'replace-destination',
        createReplacementPlan(
          plan,
          affectedStop.id,
          replacement,
          itinerary.startLocation,
        ),
        replacement.name,
      );
    }

    return {
      scenarioId,
      analyzedAt,
      stopAssessments: assessments,
      recommendations,
    };
  }
}
