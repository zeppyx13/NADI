import { destinations } from '@/data/destinations';
import {
  destinationScenarioConditions,
  getTravelMinutes,
} from '@/data/itinerary-scenarios';
import { itineraryDecisionThresholds } from '@/data/itinerary-thresholds';
import type { OccupancyLevel } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type {
  DestinationConditionSnapshot,
  DestinationAlternativeCandidate,
  Itinerary,
  ItineraryAnalysis,
  ItineraryDraft,
  ItineraryIssue,
  ItineraryIssueType,
  ItineraryPlan,
  ItineraryRecommendation,
  ItineraryScenarioId,
  ItineraryStop,
  StopAssessment,
} from '@/types/itinerary';
import {
  addMinutesToTime,
  calculatePlanTotals,
  clonePlan,
  createItineraryId,
  parseTimeToMinutes,
} from '@/utils/itinerary';
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

function ratioToOccupancyLevel(ratio: number): OccupancyLevel {
  if (ratio >= itineraryDecisionThresholds.occupancy.critical) return 'critical';
  if (ratio >= itineraryDecisionThresholds.occupancy.high) return 'high';
  if (ratio >= itineraryDecisionThresholds.occupancy.moderate) return 'moderate';
  return 'low';
}

function getPredictedLoad(
  destinationId: string,
  arrivalTime: string,
  scenarioId: ItineraryScenarioId,
): number {
  const base = destinationScenarioConditions[destinationId]?.basePredictedLoadRatio ?? 0.5;
  const arrivalMinutes = parseTimeToMinutes(arrivalTime) ?? 0;
  const hour = Math.floor(arrivalMinutes / 60);

  if (scenarioId === 'destination-crowded') {
    if (destinationId === 'tanah-lot' && hour >= 14 && hour < 17) return 0.94;
    if (destinationId === 'pantai-kuta' && hour >= 10 && hour < 18) return 0.93;
  }

  if (destinationId === 'tanah-lot' && hour >= 17) return 0.58;
  if (destinationId === 'pantai-kuta' && hour >= 18) return 0.64;
  return base;
}

function createConditionSnapshot(
  stop: ItineraryStop,
  scenarioId: ItineraryScenarioId,
  isFirstRemaining: boolean,
  capturedAt: string,
): DestinationConditionSnapshot {
  const source = destinationScenarioConditions[stop.destinationId] ?? {
    currentLoadRatio: 0.5,
    basePredictedLoadRatio: 0.55,
    trafficLevel: 'moderate' as const,
    routeRisk: 'medium' as const,
    parkingStatus: 'unknown' as const,
    roadClosed: false,
    activeIncidentIds: [],
  };
  const predictedLoadRatio = getPredictedLoad(
    stop.destinationId,
    stop.plannedArrival,
    scenarioId,
  );
  const hasRouteIncident = scenarioId === 'route-incident' && isFirstRemaining;
  const hasRouteCongestion = scenarioId === 'route-congested' && isFirstRemaining;
  const arrivalHour = Math.floor((parseTimeToMinutes(stop.plannedArrival) ?? 0) / 60);
  const localEventAffectsAccess =
    Boolean(source.localEventId) && arrivalHour >= 16 && arrivalHour < 20;

  return {
    capturedAt,
    predictedArrivalAt: stop.plannedArrival,
    occupancy: {
      currentLoadRatio: source.currentLoadRatio,
      predictedLoadRatio,
      status: ratioToOccupancyLevel(predictedLoadRatio),
    },
    access: {
      trafficLevel:
        hasRouteIncident || hasRouteCongestion ? 'heavy' : source.trafficLevel,
      routeRisk: hasRouteIncident ? 'high' : source.routeRisk,
      activeIncidentIds: hasRouteIncident
        ? ['incident-denpasar-01']
        : [...source.activeIncidentIds],
      roadClosed: source.roadClosed,
    },
    parking: {
      status: source.parkingStatus,
    },
    localContext: source.localEventId
      ? { eventId: source.localEventId, affectsAccess: localEventAffectsAccess }
      : undefined,
    dataSource: 'mock',
  };
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
    stopIndex < index
      ? stop
      : {
          ...stop,
          plannedArrival: addMinutesToTime(stop.plannedArrival, minutes),
          plannedDeparture: addMinutesToTime(stop.plannedDeparture, minutes),
        },
  );
  return { ...plan, stops };
}

function createReroutePlan(plan: ItineraryPlan, stopId: string): ItineraryPlan {
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === stopId);
  if (affectedIndex < 0) return clonePlan(plan);
  const shifted = shiftStopsFromIndex(plan, affectedIndex, 18);
  const stops = shifted.stops.map((stop, index) =>
    index === affectedIndex
      ? {
          ...stop,
          routeToStop: {
            mode: 'safest' as const,
            estimatedTravelMinutes:
              (stop.routeToStop?.estimatedTravelMinutes ?? 45) + 18,
            trafficLevel: 'moderate' as const,
            routeRisk: 'low' as const,
            activeIncidentIds: [],
            roadClosed: false,
          },
        }
      : stop,
  );
  return { ...shifted, stops, ...calculatePlanTotals(stops) };
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
  startLocationId: string | undefined,
): ItineraryStop[] {
  let cursor = startTime;
  let previousDestinationId = startLocationId;

  return stops.map((stop) => {
    const travelMinutes = getTravelMinutes(previousDestinationId, stop.destinationId);
    const source = destinationScenarioConditions[stop.destinationId];
    const plannedArrival = addMinutesToTime(cursor, travelMinutes);
    const plannedDeparture = addMinutesToTime(
      plannedArrival,
      stop.visitDurationMinutes,
    );
    previousDestinationId = stop.destinationId;
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
  startLocationId: string | undefined,
): ItineraryPlan {
  const affectedIndex = plan.stops.findIndex((stop) => stop.id === stopId);
  if (affectedIndex < 0 || plan.stops.length < 2) return clonePlan(plan);
  const targetIndex = affectedIndex < plan.stops.length - 1
    ? affectedIndex + 1
    : affectedIndex - 1;
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
    startLocationId,
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
  const previousId =
    affectedIndex > 0
      ? plan.stops[affectedIndex - 1]?.destinationId
      : itinerary.startLocation.id;
  const candidates: DestinationAlternativeCandidate[] = destinations
    .filter((candidate) => !usedIds.has(candidate.id))
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
        estimatedTravelMinutes: getTravelMinutes(previousId, candidate.id),
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
  startLocationId: string | undefined,
): ItineraryPlan {
  const replaced = clonePlan(plan).stops.map((stop) =>
    stop.id === stopId
      ? {
          ...stop,
          destinationId: replacement.id,
          destinationNameSnapshot: replacement.name,
        }
      : stop,
  );
  const firstArrival = plan.stops[0]?.plannedArrival ?? '09:00';
  const firstTravelMinutes = plan.stops[0]?.routeToStop?.estimatedTravelMinutes ?? 45;
  const stops = rebuildSchedule(
    replaced,
    addMinutesToTime(firstArrival, -firstTravelMinutes),
    startLocationId,
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
    const assessments = relevantStops.map((stop, index): StopAssessment => {
      const condition = createConditionSnapshot(
        stop,
        scenarioId,
        index === 0,
        analyzedAt,
      );
      const issues = getIssues(condition);
      return {
        stopId: stop.id,
        status: getAssessmentStatus(issues),
        condition,
        issues,
      };
    });
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
      await createRecommendation('reroute', createReroutePlan(plan, affectedStop.id));
    } else {
      await createRecommendation(
        'reschedule',
        createReschedulePlan(plan, affectedStop.id),
      );
    }

    if (plan.stops.length > 1) {
      await createRecommendation(
        'reorder',
        createReorderPlan(plan, affectedStop.id, itinerary.startLocation.id),
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
          itinerary.startLocation.id,
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
