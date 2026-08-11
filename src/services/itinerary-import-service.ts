import { destinations } from '@/data/destinations';
import type {
  ImportedFile,
  ImportedItineraryResult,
  ItineraryChatResponse,
  ItineraryDay,
  ItineraryItem,
  ItineraryItemType,
  StructuredItineraryDraft,
} from '@/types/itinerary';
import { createItineraryId } from '@/utils/itinerary';

// ---------------------------------------------------------------------------
// Service interfaces — future API implementations swap these.
// ---------------------------------------------------------------------------

export interface ItineraryImportService {
  importPdf(file: ImportedFile): Promise<ImportedItineraryResult>;
}

export interface ItineraryChatService {
  sendMessage(
    sessionId: string,
    message: string,
  ): Promise<ItineraryChatResponse>;

  buildDraft(
    sessionId: string,
  ): Promise<StructuredItineraryDraft>;
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function matchDestinationId(name: string): string | null {
  const lower = name.toLowerCase();
  const match = destinations.find(
    (d) => d.name.toLowerCase().includes(lower) ||
      lower.includes(d.name.toLowerCase()),
  );
  return match?.id ?? null;
}

function inferItemType(title: string): ItineraryItemType {
  const lower = title.toLowerCase();
  if (/hotel|villa|resort|penginapan|akomodasi/.test(lower)) return 'accommodation';
  if (/makan|lunch|dinner|breakfast|warung|restaurant|kuliner|sarapan/.test(lower)) return 'food';
  if (/airport|bandara|transfer|transport|ojek|taxi|grab/.test(lower)) return 'transport';
  if (/note|catatan/.test(lower)) return 'note';
  if (/snorkel|rafting|spa|yoga|kelas|workshop|surfing|diving/.test(lower)) return 'activity';
  return 'destination';
}

function createMockItem(
  rawText: string,
  index: number,
): ItineraryItem {
  const timeMatch = /^(\d{1,2}[.:](\d{2}))\s*(.+)/.exec(rawText.trim());
  const time = timeMatch
    ? timeMatch[1].replace('.', ':')
    : undefined;
  const title = timeMatch ? timeMatch[3].trim() : rawText.trim();
  const destinationId = matchDestinationId(title);
  const type = destinationId ? 'destination' : inferItemType(title);

  return {
    id: createItineraryId('item'),
    type,
    title,
    rawText,
    plannedTime: time
      ? `${time.padStart(5, '0')}`
      : undefined,
    durationMinutes: 90,
    destinationId: destinationId ?? null,
    customLocation: destinationId
      ? undefined
      : { name: title },
  };
}

function createMockDay(
  label: string,
  lines: string[],
  dayIndex: number,
): ItineraryDay {
  return {
    id: createItineraryId('day'),
    label: label || `Hari ${dayIndex + 1}`,
    items: lines.map((line, i) => createMockItem(line, i)),
  };
}

// ---------------------------------------------------------------------------
// Mock: PDF import returns a deterministic sample itinerary.
// ---------------------------------------------------------------------------

const MOCK_PDF_LINES = [
  '08.00 Check-out Hotel Kuta',
  '09.30 Ubud Palace',
  '11.30 Monkey Forest',
  '13.00 Makan siang di Ubud',
  '15.00 Tegallalang Rice Terrace',
  '18.00 Kembali ke hotel',
];

export class LocalItineraryImportService implements ItineraryImportService {
  async importPdf(file: ImportedFile): Promise<ImportedItineraryResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, errorKey: 'errors.pdfInvalid' };
    }

    const day = createMockDay('Hari 1', MOCK_PDF_LINES, 0);

    const draft: StructuredItineraryDraft = {
      title: file.name.replace(/\.pdf$/i, ''),
      startDate: new Date().toISOString().slice(0, 10),
      days: [day],
      sourceSnapshot: {
        type: 'pdf',
        fileName: file.name,
        originalText: MOCK_PDF_LINES.join('\n'),
        createdAt: new Date().toISOString(),
      },
    };

    return { success: true, draft };
  }
}

// ---------------------------------------------------------------------------
// Mock: Chat service returns scripted responses.
// ---------------------------------------------------------------------------

const CHAT_SCRIPT: { reply: string; isDraftReady: boolean }[] = [
  {
    reply:
      'Terima kasih! Saya catat rencana Anda. Apakah ada waktu spesifik untuk setiap kunjungan, atau saya susun berdasarkan urutan saja?',
    isDraftReady: false,
  },
  {
    reply:
      'Baik, saya sudah menyusun draft itinerary berdasarkan informasi Anda. Silakan periksa hasilnya.',
    isDraftReady: true,
  },
];

const MOCK_CHAT_DRAFT_LINES = [
  '08.00 Berangkat dari hotel di Kuta',
  '09.30 Ubud Palace',
  '11.00 Monkey Forest',
  '13.00 Makan siang di Ubud',
  '15.00 Tegallalang',
  '18.00 Kembali ke hotel',
];

export class LocalItineraryChatService implements ItineraryChatService {
  private turnIndex = 0;

  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<ItineraryChatResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const script = CHAT_SCRIPT[Math.min(this.turnIndex, CHAT_SCRIPT.length - 1)];
    this.turnIndex += 1;

    return {
      message: {
        id: createItineraryId('msg'),
        role: 'assistant',
        content: script.reply,
        timestamp: new Date().toISOString(),
      },
      isDraftReady: script.isDraftReady,
    };
  }

  async buildDraft(
    sessionId: string,
  ): Promise<StructuredItineraryDraft> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const day = createMockDay('Hari 1', MOCK_CHAT_DRAFT_LINES, 0);

    return {
      title: 'Perjalanan dari Chat',
      startDate: new Date().toISOString().slice(0, 10),
      days: [day],
      sourceSnapshot: {
        type: 'chat',
        conversationId: sessionId,
        originalText: MOCK_CHAT_DRAFT_LINES.join('\n'),
        createdAt: new Date().toISOString(),
      },
    };
  }
}
