import type { OccupancyLevel, RouteMode } from '@/constants/theme';
import type { DestinationCategory } from '@/types/destination';

export type ItineraryStatus =
  | 'draft'
  | 'analyzing'
  | 'suggested'
  | 'approved'
  | 'active'
  | 'completed'
  | 'cancelled';

export type ItineraryStopStatus =
  | 'upcoming'
  | 'current'
  | 'completed'
  | 'skipped';

export type DurationType =
  | 'half-day'
  | 'one-day'
  | 'two-days'
  | 'three-days'
  | 'custom';

export type TravelStyle = 'relaxed' | 'balanced' | 'intensive';
export type TrafficLevel = 'smooth' | 'moderate' | 'heavy' | 'blocked';
export type RouteRisk = 'low' | 'medium' | 'high';
export type ParkingStatus = 'available' | 'limited' | 'full' | 'unknown';
export type ConditionDataSource = 'mock' | 'live' | 'forecast';

export type ItineraryScenarioId =
  | 'normal'
  | 'destination-crowded'
  | 'route-congested'
  | 'route-incident';

export type StopAssessmentStatus =
  | 'optimal'
  | 'acceptable'
  | 'adjustment-recommended'
  | 'not-recommended';

export type ItineraryIssueType =
  | 'destination-crowding'
  | 'traffic-congestion'
  | 'route-incident'
  | 'road-closure'
  | 'route-risk'
  | 'parking-limited'
  | 'parking-full'
  | 'local-event'
  | 'schedule-delay';

export type ItineraryRecommendationType =
  | 'keep'
  | 'reroute'
  | 'reschedule'
  | 'reorder'
  | 'replace-destination';

export type ItineraryChangeReason =
  | 'initial-approval'
  | 'user-edit'
  | 'crowding'
  | 'traffic'
  | 'incident'
  | 'road-closure'
  | 'route-risk'
  | 'local-event';

export type ItineraryLocation = {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  source?: ItineraryPlaceSource;
};

export type ItineraryPlaceSource = 'nadi-destination' | 'custom-map-point';

export type ItineraryPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: ItineraryPlaceSource;
};

export type TravelPreferences = {
  durationType: DurationType;
  interests: DestinationCategory[];
  travelStyle: TravelStyle;
  routePreference: RouteMode;
  mustVisitDestinationIds: string[];
};

export type RouteSnapshot = {
  mode: RouteMode;
  estimatedTravelMinutes: number;
  trafficLevel: TrafficLevel;
  routeRisk: RouteRisk;
  activeIncidentIds: string[];
  roadClosed: boolean;
};

export type DestinationConditionSnapshot = {
  capturedAt: string;
  predictedArrivalAt: string;
  occupancy: {
    currentLoadRatio: number;
    predictedLoadRatio: number;
    status: OccupancyLevel;
  };
  access: {
    trafficLevel: TrafficLevel;
    routeRisk: RouteRisk;
    activeIncidentIds: string[];
    roadClosed: boolean;
  };
  parking: {
    status: ParkingStatus;
  };
  localContext?: {
    eventId?: string;
    affectsAccess: boolean;
  };
  dataSource: ConditionDataSource;
};

export type ItineraryStop = {
  id: string;
  destinationId: string;
  destinationNameSnapshot: string;
  place: ItineraryPlace;
  plannedArrival: string;
  plannedDeparture: string;
  visitDurationMinutes: number;
  status: ItineraryStopStatus;
  routeToStop?: RouteSnapshot;
  conditionSnapshot?: DestinationConditionSnapshot;
};

export type ItineraryPlan = {
  stops: ItineraryStop[];
  estimatedTotalTravelMinutes: number;
  estimatedTotalVisitMinutes: number;
};

export type ItineraryIssue = {
  type: ItineraryIssueType;
  severity: 'info' | 'warning' | 'danger';
};

export type StopAssessment = {
  stopId: string;
  status: StopAssessmentStatus;
  condition: DestinationConditionSnapshot;
  issues: ItineraryIssue[];
};

export type RecommendationExplanation = {
  key:
    | 'keep'
    | 'reroute'
    | 'reschedule'
    | 'reorder'
    | 'replace-destination';
  destinationName: string;
  originalTime?: string;
  proposedTime?: string;
  replacementName?: string;
};

export type DestinationAlternativeCandidate = {
  destinationId: string;
  similarityScore: number;
  predictedLoadRatio: number;
  estimatedTravelMinutes: number;
  routeRisk: RouteRisk;
  reasons: string[];
};

export type ItineraryRecommendation = {
  id: string;
  type: ItineraryRecommendationType;
  affectedStopIds: string[];
  reasonCodes: ItineraryIssueType[];
  proposedPlan: ItineraryPlan;
  impact: {
    travelMinutesDelta: number;
    predictedCrowdingImprovement?: number;
    routeRiskChange?: 'lower' | 'same' | 'higher';
    keepsMustVisitDestinations: boolean;
  };
  explanation: RecommendationExplanation;
  createdAt: string;
};

export type ItineraryAnalysis = {
  scenarioId: ItineraryScenarioId;
  analyzedAt: string;
  stopAssessments: StopAssessment[];
  recommendations: ItineraryRecommendation[];
};

export type ItineraryChangeRecord = {
  id: string;
  version: number;
  reason: ItineraryChangeReason;
  recommendationId?: string;
  changedAt: string;
  summaryKey: string;
};

export type Itinerary = {
  id: string;
  title: string;
  date: string;
  status: ItineraryStatus;
  version: number;
  startLocation: ItineraryLocation;
  preferences: TravelPreferences;
  originalPlan: ItineraryPlan;
  approvedPlan: ItineraryPlan | null;
  latestAnalysis: ItineraryAnalysis | null;
  changeHistory: ItineraryChangeRecord[];
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ManualItineraryStopInput = {
  destinationId: string;
  place: ItineraryPlace;
  plannedArrival: string;
  visitDurationMinutes: number;
};

export type CreateManualItineraryInput = {
  title: string;
  date: string;
  startLocation: ItineraryLocation;
  startTime: string;
  routePreference: RouteMode;
  stops: ManualItineraryStopInput[];
};

export type CreateGeneratedItineraryInput = {
  title: string;
  date: string;
  startLocation: ItineraryLocation;
  startTime: string;
  preferences: TravelPreferences;
};

export type ItineraryDraft = Itinerary;

export type ItineraryStorageState = {
  itineraries: Itinerary[];
  activeItineraryId: string | null;
};

// --- Ingestion types ---

export type ItineraryInputSource =
  | 'pdf'
  | 'chat'
  | 'generated-preferences';

export type ItineraryItemType =
  | 'destination'
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activity'
  | 'custom'
  | 'note';

export type BudgetPreference =
  | 'budget'
  | 'comfortable'
  | 'flexible';

export type TransportPreference =
  | 'motorcycle'
  | 'car'
  | 'driver'
  | 'public-transport';

export type TravelCompanion =
  | 'solo'
  | 'couple'
  | 'friends'
  | 'family';

export type ItinerarySourceSnapshot = {
  type: ItineraryInputSource;
  fileName?: string;
  originalText?: string;
  conversationId?: string;
  createdAt: string;
};

export type ItineraryItem = {
  id: string;
  type: ItineraryItemType;
  title: string;
  rawText?: string;
  plannedTime?: string;
  endTime?: string;
  durationMinutes?: number;
  destinationId?: string | null;
  customLocation?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
};

export type ItineraryDay = {
  id: string;
  date?: string;
  label?: string;
  items: ItineraryItem[];
};

export type StructuredItineraryDraft = {
  title?: string;
  startDate?: string;
  days: ItineraryDay[];
  sourceSnapshot: ItinerarySourceSnapshot;
};

export type ImportedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export type ImportedItineraryResult = {
  success: boolean;
  draft?: StructuredItineraryDraft;
  errorKey?: string;
};

export type ItineraryChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ItineraryChatResponse = {
  message: ItineraryChatMessage;
  isDraftReady: boolean;
};

export type ExtendedTravelPreferences = TravelPreferences & {
  date?: string;
  startTime?: string;
  startLocation?: ItineraryLocation;
  budgetPreference?: BudgetPreference;
  transportPreference?: TransportPreference;
  travelCompanion?: TravelCompanion;
  accessibilityNotes?: string[];
  freeformNotes?: string;
};
