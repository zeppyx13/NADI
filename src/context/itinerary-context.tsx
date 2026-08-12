import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import {
  LocalItineraryService,
  type ItineraryService,
} from '@/services/itinerary-service';
import { hydrateDemoScenario } from '@/storage/demo-scenario-storage';
import type {
  CreateGeneratedItineraryInput,
  CreateManualItineraryInput,
  Itinerary,
  StructuredItineraryDraft,
} from '@/types/itinerary';

type ItineraryContextState = {
  itineraries: Itinerary[];
  activeItineraryId: string | null;
  isHydrated: boolean;
};

type ItineraryAction =
  | {
      type: 'hydrate';
      itineraries: Itinerary[];
      activeItineraryId: string | null;
    }
  | { type: 'upsert'; itinerary: Itinerary }
  | { type: 'complete'; itinerary: Itinerary };

type ItineraryContextValue = ItineraryContextState & {
  activeItinerary: Itinerary | null;
  getItinerary: (id: string) => Itinerary | null;
  createManualDraft: (input: CreateManualItineraryInput) => Promise<Itinerary>;
  createGeneratedDraft: (
    input: CreateGeneratedItineraryInput,
  ) => Promise<Itinerary>;
  createFromDraft: (draft: StructuredItineraryDraft) => Promise<Itinerary>;
  analyze: (id: string) => Promise<Itinerary>;
  approve: (id: string, recommendationId: string) => Promise<Itinerary>;
  approveOriginal: (id: string) => Promise<Itinerary>;
  start: (id: string) => Promise<Itinerary>;
  complete: (id: string) => Promise<Itinerary>;
  reanalyzeRemainingStops: (id: string) => Promise<Itinerary>;
};

const initialState: ItineraryContextState = {
  itineraries: [],
  activeItineraryId: null,
  isHydrated: false,
};

const itineraryService: ItineraryService = new LocalItineraryService();

function reducer(
  state: ItineraryContextState,
  action: ItineraryAction,
): ItineraryContextState {
  if (action.type === 'hydrate') {
    return {
      itineraries: action.itineraries,
      activeItineraryId: action.activeItineraryId,
      isHydrated: true,
    };
  }

  const itineraries = state.itineraries.some(
    (itinerary) => itinerary.id === action.itinerary.id,
  )
    ? state.itineraries.map((itinerary) =>
        itinerary.id === action.itinerary.id ? action.itinerary : itinerary,
      )
    : [...state.itineraries, action.itinerary];

  if (action.type === 'complete') {
    return {
      ...state,
      itineraries,
      activeItineraryId:
        state.activeItineraryId === action.itinerary.id
          ? null
          : state.activeItineraryId,
    };
  }
  return { ...state, itineraries };
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isMounted = true;
    // The demo scenario is restored before any analysis can run.
    void hydrateDemoScenario();
    void itineraryService.hydrate().then((storedState) => {
      if (!isMounted) return;
      dispatch({ type: 'hydrate', ...storedState });
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const upsertFrom = useCallback(
    async (operation: Promise<Itinerary>): Promise<Itinerary> => {
      const itinerary = await operation;
      dispatch({ type: 'upsert', itinerary });
      return itinerary;
    },
    [],
  );

  const createManualDraft = useCallback(
    (input: CreateManualItineraryInput) =>
      upsertFrom(itineraryService.createManualDraft(input)),
    [upsertFrom],
  );
  const createGeneratedDraft = useCallback(
    (input: CreateGeneratedItineraryInput) =>
      upsertFrom(itineraryService.createGeneratedDraft(input)),
    [upsertFrom],
  );
  const createFromDraft = useCallback(
    (draft: StructuredItineraryDraft) =>
      upsertFrom(itineraryService.createFromDraft(draft)),
    [upsertFrom],
  );
  const analyze = useCallback(
    (id: string) => upsertFrom(itineraryService.analyze(id)),
    [upsertFrom],
  );
  const approve = useCallback(
    (id: string, recommendationId: string) =>
      upsertFrom(itineraryService.approve(id, recommendationId)),
    [upsertFrom],
  );
  const approveOriginal = useCallback(
    (id: string) => upsertFrom(itineraryService.approveOriginal(id)),
    [upsertFrom],
  );
  const start = useCallback(async (id: string) => {
    const itinerary = await itineraryService.start(id);
    const storedState = await itineraryService.hydrate();
    dispatch({ type: 'hydrate', ...storedState });
    return itinerary;
  }, []);
  const complete = useCallback(async (id: string) => {
    const itinerary = await itineraryService.complete(id);
    dispatch({ type: 'complete', itinerary });
    return itinerary;
  }, []);
  const reanalyzeRemainingStops = useCallback(
    (id: string) => upsertFrom(itineraryService.reanalyzeRemainingStops(id)),
    [upsertFrom],
  );
  const getItinerary = useCallback(
    (id: string) => state.itineraries.find((itinerary) => itinerary.id === id) ?? null,
    [state.itineraries],
  );
  const activeItinerary =
    state.itineraries.find(
      (itinerary) => itinerary.id === state.activeItineraryId,
    ) ?? null;

  const value = useMemo<ItineraryContextValue>(
    () => ({
      ...state,
      activeItinerary,
      getItinerary,
      createManualDraft,
      createGeneratedDraft,
      createFromDraft,
      analyze,
      approve,
      approveOriginal,
      start,
      complete,
      reanalyzeRemainingStops,
    }),
    [
      state,
      activeItinerary,
      getItinerary,
      createManualDraft,
      createGeneratedDraft,
      createFromDraft,
      analyze,
      approve,
      approveOriginal,
      start,
      complete,
      reanalyzeRemainingStops,
    ],
  );

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItineraries(): ItineraryContextValue {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItineraries must be used within ItineraryProvider.');
  }
  return context;
}
