import type { PartnerBusiness } from '@/types/incentive';

/**
 * Local partner businesses. This is not a marketplace: NADI only supports
 * discovery and a check-in. There is no point of sale, so nothing here implies
 * a purchase. Names are local placeholders, not real registered businesses.
 */
export const partnerBusinesses: readonly PartnerBusiness[] = [
  {
    id: 'partner-warung-lovina',
    name: 'Warung Bahari Lovina',
    category: 'culinary',
    area: 'Buleleng',
    nearDestinationId: 'pantai-lovina',
    latitude: -8.1631,
    longitude: 115.0295,
    perkKey: 'incentive.partners.warungLovina.perk',
  },
  {
    id: 'partner-tenun-besakih',
    name: 'Tenun Rendang Karangasem',
    category: 'craft',
    area: 'Karangasem',
    nearDestinationId: 'pura-besakih',
    latitude: -8.3761,
    longitude: 115.4488,
    perkKey: 'incentive.partners.tenunBesakih.perk',
  },
  {
    id: 'partner-pemandu-tanah-lot',
    name: 'Pemandu Lokal Tanah Lot',
    category: 'guide',
    area: 'Tabanan',
    nearDestinationId: 'tanah-lot',
    latitude: -8.6208,
    longitude: 115.0877,
    perkKey: 'incentive.partners.pemanduTanahLot.perk',
  },
  {
    id: 'partner-pasar-ubud',
    name: 'Kriya Pasar Ubud',
    category: 'retail',
    area: 'Gianyar',
    nearDestinationId: 'ubud',
    latitude: -8.5074,
    longitude: 115.2618,
    perkKey: 'incentive.partners.pasarUbud.perk',
  },
];
