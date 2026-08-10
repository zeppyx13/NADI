import { destinations } from '@/data/destinations';
import {
  readItineraryStorage,
  writeItineraryStorage,
} from '@/storage/itinerary-storage';
import type {
  CreateGeneratedItineraryInput,
  CreateManualItineraryInput,
  Itinerary,
  ItineraryAnalysis,
  ItineraryChangeReason,
  ItineraryIssueType,
  ItineraryStorageState,
} from '@/types/itinerary';
import { clonePlan, createItineraryId } from '@/utils/itinerary';
import {
  LocalItineraryAnalysisService,
  type ItineraryAnalysisService,
} from './itinerary-analysis-service';
import {
  LocalItineraryGenerationService,
  type ItineraryGenerationService,
} from './itinerary-generation-service';

export interface ItineraryService {
  hydrate(): Promise<ItineraryStorageState>;
  list(): Promise<Itinerary[]>;
  getById(id: string): Promise<Itinerary | null>;
  createManualDraft(input: CreateManualItineraryInput): Promise<Itinerary>;
  createGeneratedDraft(input: CreateGeneratedItineraryInput): Promise<Itinerary>;
  analyze(id: string): Promise<Itinerary>;
  approve(id: string, recommendationId: string): Promise<Itinerary>;
  approveOriginal(id: string): Promise<Itinerary>;
  start(id: string): Promise<Itinerary>;
  complete(id: string): Promise<Itinerary>;
  reanalyzeRemainingStops(id: string): Promise<Itinerary>;
}

function createBaseItinerary(
  id: string,
  input: CreateGeneratedItineraryInput,
  originalPlan: Itinerary['originalPlan'],
): Itinerary {
  const now = new Date().toISOString();
  return {
    id,
    title: input.title,
    date: input.date,
    status: 'draft',
    version: 0,
    startLocation: input.startLocation,
    preferences: input.preferences,
    originalPlan: clonePlan(originalPlan),
    approvedPlan: null,
    latestAnalysis: null,
    changeHistory: [],
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    startedAt: null,
    completedAt: null,
  };
}

function reasonFromIssues(issueTypes: ItineraryIssueType[]): ItineraryChangeReason {
  if (issueTypes.includes('route-incident')) return 'incident';
  if (issueTypes.includes('road-closure')) return 'road-closure';
  if (issueTypes.includes('destination-crowding')) return 'crowding';
  if (issueTypes.includes('traffic-congestion')) return 'traffic';
  if (issueTypes.includes('route-risk')) return 'route-risk';
  if (issueTypes.includes('local-event')) return 'local-event';
  return 'user-edit';
}

export class LocalItineraryService implements ItineraryService {
  constructor(
    private readonly generationService: ItineraryGenerationService =
      new LocalItineraryGenerationService(),
    private readonly analysisService: ItineraryAnalysisService =
      new LocalItineraryAnalysisService(),
  ) {}

  hydrate(): Promise<ItineraryStorageState> {
    return readItineraryStorage();
  }

  async list(): Promise<Itinerary[]> {
    const state = await readItineraryStorage();
    return [...state.itineraries].sort((first, second) =>
      first.date.localeCompare(second.date),
    );
  }

  async getById(id: string): Promise<Itinerary | null> {
    const state = await readItineraryStorage();
    return state.itineraries.find((itinerary) => itinerary.id === id) ?? null;
  }

  async createManualDraft(input: CreateManualItineraryInput): Promise<Itinerary> {
    const id = createItineraryId('itinerary');
    const originalPlan = await this.generationService.normalizeManualPlan(input, id);
    const interests = input.stops.flatMap((stop) => {
      const category = destinations.find(
        (destination) => destination.id === stop.destinationId,
      )?.category;
      return category ? [category] : [];
    });
    const generatedInput: CreateGeneratedItineraryInput = {
      title: input.title,
      date: input.date,
      startLocation: input.startLocation,
      startTime: input.startTime,
      preferences: {
        durationType: 'one-day',
        interests: [...new Set(interests)],
        travelStyle: 'balanced',
        routePreference: input.routePreference,
        mustVisitDestinationIds: [],
      },
    };
    const itinerary = createBaseItinerary(id, generatedInput, originalPlan);
    await this.persistNew(itinerary);
    return itinerary;
  }

  async createGeneratedDraft(input: CreateGeneratedItineraryInput): Promise<Itinerary> {
    const id = createItineraryId('itinerary');
    const originalPlan = await this.generationService.generateFromPreferences(input, id);
    const itinerary = createBaseItinerary(id, input, originalPlan);
    await this.persistNew(itinerary);
    return itinerary;
  }

  async analyze(id: string): Promise<Itinerary> {
    const itinerary = await this.requireItinerary(id);
    const analysis = await this.analysisService.analyze(
      itinerary,
      'destination-crowded',
    );
    return this.updateItinerary(id, (current) => ({
      ...current,
      status: 'suggested',
      latestAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    }));
  }

  async approve(id: string, recommendationId: string): Promise<Itinerary> {
    return this.updateItinerary(id, (current) => {
      const recommendation = current.latestAnalysis?.recommendations.find(
        (item) => item.id === recommendationId,
      );
      if (!recommendation) throw new Error('Recommendation not found.');

      const now = new Date().toISOString();
      const version = current.version + 1;
      return {
        ...current,
        status: current.status === 'active' ? 'active' : 'approved',
        version,
        approvedPlan: clonePlan(recommendation.proposedPlan),
        latestAnalysis: null,
        changeHistory: [
          ...current.changeHistory,
          {
            id: createItineraryId('change'),
            version,
            reason:
              current.version === 0
                ? 'initial-approval'
                : reasonFromIssues(recommendation.reasonCodes),
            recommendationId,
            changedAt: now,
            summaryKey: `history.${recommendation.type}`,
          },
        ],
        updatedAt: now,
        approvedAt: current.approvedAt ?? now,
      };
    });
  }

  async approveOriginal(id: string): Promise<Itinerary> {
    return this.updateItinerary(id, (current) => {
      const now = new Date().toISOString();
      const version = current.version + 1;
      return {
        ...current,
        status: current.status === 'active' ? 'active' : 'approved',
        version,
        approvedPlan: clonePlan(current.approvedPlan ?? current.originalPlan),
        latestAnalysis: null,
        changeHistory: [
          ...current.changeHistory,
          {
            id: createItineraryId('change'),
            version,
            reason: current.version === 0 ? 'initial-approval' : 'user-edit',
            changedAt: now,
            summaryKey: 'history.keepOriginal',
          },
        ],
        updatedAt: now,
        approvedAt: current.approvedAt ?? now,
      };
    });
  }

  async start(id: string): Promise<Itinerary> {
    const state = await readItineraryStorage();
    const current = state.itineraries.find((itinerary) => itinerary.id === id);
    if (!current || !current.approvedPlan) throw new Error('Approved itinerary not found.');
    const now = new Date().toISOString();
    const approvedPlan = clonePlan(current.approvedPlan);
    const firstRemainingIndex = approvedPlan.stops.findIndex(
      (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
    );
    approvedPlan.stops = approvedPlan.stops.map((stop, index) => ({
      ...stop,
      status: index === firstRemainingIndex ? 'current' : stop.status,
    }));
    const updated = {
      ...current,
      status: 'active' as const,
      approvedPlan,
      startedAt: current.startedAt ?? now,
      updatedAt: now,
    };
    const itineraries = state.itineraries.map((item): Itinerary => {
      if (item.id === id) return updated;
      if (item.status !== 'active') return item;

      const pausedPlan = item.approvedPlan
        ? {
            ...clonePlan(item.approvedPlan),
            stops: item.approvedPlan.stops.map((stop) => ({
              ...stop,
              status: stop.status === 'current' ? 'upcoming' as const : stop.status,
            })),
          }
        : null;
      return {
        ...item,
        status: 'approved',
        approvedPlan: pausedPlan,
        updatedAt: now,
      };
    });
    await writeItineraryStorage({
      itineraries,
      activeItineraryId: id,
    });
    return updated;
  }

  async complete(id: string): Promise<Itinerary> {
    const state = await readItineraryStorage();
    const current = state.itineraries.find((itinerary) => itinerary.id === id);
    if (!current) throw new Error('Itinerary not found.');
    const now = new Date().toISOString();
    const approvedPlan = current.approvedPlan
      ? {
          ...clonePlan(current.approvedPlan),
          stops: current.approvedPlan.stops.map((stop) => ({
            ...stop,
            status: stop.status === 'skipped' ? 'skipped' as const : 'completed' as const,
          })),
        }
      : null;
    const updated = {
      ...current,
      status: 'completed' as const,
      approvedPlan,
      completedAt: now,
      updatedAt: now,
    };
    await writeItineraryStorage({
      itineraries: state.itineraries.map((item) => (item.id === id ? updated : item)),
      activeItineraryId: state.activeItineraryId === id ? null : state.activeItineraryId,
    });
    return updated;
  }

  async reanalyzeRemainingStops(id: string): Promise<Itinerary> {
    const itinerary = await this.requireItinerary(id);
    if (itinerary.status !== 'active') throw new Error('Itinerary is not active.');
    const analysis: ItineraryAnalysis = await this.analysisService.analyze(
      itinerary,
      'route-incident',
      true,
    );
    return this.updateItinerary(id, (current) => ({
      ...current,
      latestAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    }));
  }

  private async persistNew(itinerary: Itinerary): Promise<void> {
    const state = await readItineraryStorage();
    await writeItineraryStorage({
      ...state,
      itineraries: [...state.itineraries, itinerary],
    });
  }

  private async requireItinerary(id: string): Promise<Itinerary> {
    const itinerary = await this.getById(id);
    if (!itinerary) throw new Error('Itinerary not found.');
    return itinerary;
  }

  private async updateItinerary(
    id: string,
    updater: (itinerary: Itinerary) => Itinerary,
  ): Promise<Itinerary> {
    const state = await readItineraryStorage();
    const current = state.itineraries.find((itinerary) => itinerary.id === id);
    if (!current) throw new Error('Itinerary not found.');
    const updated = updater(current);
    await writeItineraryStorage({
      ...state,
      itineraries: state.itineraries.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  }
}
