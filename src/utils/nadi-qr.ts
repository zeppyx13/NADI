import type { IncentiveTargetType } from '@/types/incentive';

/**
 * Typed payload for a NADI check-in code.
 *
 * Only this exact shape is accepted. An arbitrary string is never treated as a
 * reward, and no secret is ever carried in the code: the payload names what was
 * visited, and the app decides whether that earns anything.
 */
export type NadiCheckInPayload = {
  type: 'nadi-checkin';
  targetType: Extract<IncentiveTargetType, 'destination' | 'partner'>;
  targetId: string;
  codeId: string;
  campaignId?: string;
};

export type QrParseResult =
  | { status: 'valid'; payload: NadiCheckInPayload }
  | { status: 'invalid' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Parses a scanned string. Anything unrecognised is rejected outright. */
export function parseNadiCheckInCode(raw: string): QrParseResult {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }

  if (!isRecord(decoded)) return { status: 'invalid' };
  if (decoded.type !== 'nadi-checkin') return { status: 'invalid' };
  if (decoded.targetType !== 'destination' && decoded.targetType !== 'partner') {
    return { status: 'invalid' };
  }
  if (!isNonEmptyString(decoded.targetId)) return { status: 'invalid' };
  if (!isNonEmptyString(decoded.codeId)) return { status: 'invalid' };
  if (
    decoded.campaignId !== undefined &&
    !isNonEmptyString(decoded.campaignId)
  ) {
    return { status: 'invalid' };
  }

  return {
    status: 'valid',
    payload: {
      type: 'nadi-checkin',
      targetType: decoded.targetType,
      targetId: decoded.targetId,
      codeId: decoded.codeId,
      campaignId: decoded.campaignId,
    },
  };
}

/**
 * Builds the code string a destination or partner would print. Used by the
 * development-only demo codes so a scan can be exercised without printed media.
 */
export function buildNadiCheckInCode(payload: NadiCheckInPayload): string {
  return JSON.stringify(payload);
}
