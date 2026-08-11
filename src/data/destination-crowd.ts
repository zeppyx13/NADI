import type { DestinationCrowd } from '@/types/map-intelligence';

/**
 * Crowd coverage is intentionally partial. Only destinations with monitoring
 * coverage appear here; the rest of the catalog has no crowd reading at all
 * rather than an invented one.
 */
export const destinationCrowd: readonly DestinationCrowd[] = [
  {
    destinationId: 'pantai-kuta',
    currentLoadRatio: 0.82,
    predictedLoadRatio: 0.94,
    level: 'high',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'ubud',
    currentLoadRatio: 0.61,
    predictedLoadRatio: 0.7,
    level: 'moderate',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'tanah-lot',
    currentLoadRatio: 0.58,
    predictedLoadRatio: 0.79,
    level: 'moderate',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'pantai-lovina',
    currentLoadRatio: 0.24,
    predictedLoadRatio: 0.31,
    level: 'low',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'pura-besakih',
    currentLoadRatio: 0.29,
    predictedLoadRatio: 0.35,
    level: 'low',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'pantai-seminyak',
    currentLoadRatio: 0.74,
    predictedLoadRatio: 0.85,
    level: 'high',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'canggu',
    currentLoadRatio: 0.91,
    predictedLoadRatio: 0.96,
    level: 'critical',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'pura-uluwatu',
    currentLoadRatio: 0.68,
    predictedLoadRatio: 0.88,
    level: 'moderate',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'sacred-monkey-forest-ubud',
    currentLoadRatio: 0.55,
    predictedLoadRatio: 0.6,
    level: 'moderate',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
  {
    destinationId: 'tegallalang-rice-terrace',
    currentLoadRatio: 0.42,
    predictedLoadRatio: 0.52,
    level: 'moderate',
    updatedAt: '2026-08-11T18:40:00+08:00',
    dataSource: 'mock',
  },
];
