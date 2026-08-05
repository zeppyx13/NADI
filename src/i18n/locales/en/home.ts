export const homeEn = {
  greeting: 'Hello, {{name}}',
  notifications: 'Open alerts',
  notificationsWithCount: 'Open alerts, {{count}} unread',
  searchPlaceholder: 'Search destinations, areas, or places in Bali',
  searchAccessibility: 'Open destination search in Explore',
  simulationLabel: 'Simulated Data',
  partialNotice: 'Part of this summary is unavailable. Other information is still usable.',

  travelConditions: {
    title: 'Travel conditions',
    subtitle: 'Summary of the area around you',
    openMap: 'Open map',
    smoothTitle: 'Conditions are mostly smooth',
    moderateTitle: 'Several areas are getting busier',
    attentionTitle: 'Several areas need attention',
    summary:
      '{{crowdedCount}} areas are crowded and {{incidentCount}} travel disruptions have been detected.',
    crowdedAreas: 'Crowded areas',
    incidents: 'Disruptions',
    nearbyDestinations: 'Destinations',
    updatedAt: 'Updated at {{time}}',
    mapAccessibility:
      'Preview of nearby travel conditions. Press to open the Map tab.',
    userMarker: 'Your position',
    destinationMarker: 'Recommended destination',
    crowdedMarker: 'Crowded area',
    incidentMarker: 'Disruption location',
  },

  importantAlert: {
    title: 'Needs attention',
    alternativeRoute: 'View an alternative route',
    viewOnMap: 'View on map',
    distanceAway: '{{distance}} km away',
  },

  activeJourney: {
    title: 'Active journey',
    headingTo: 'Heading to {{destination}}',
    metadata: '{{minutes}} min · {{distance}} km',
    continue: 'Continue journey',
    smooth: 'Travel conditions are smooth',
    moderate: 'The journey has moderate congestion',
    disrupted: 'The journey is affected by a disruption',
  },

  planJourney: {
    title: 'Plan your journey',
    description:
      'Choose a destination and find a route that matches current travel conditions.',
    action: 'Start planning',
  },

  recommendations: {
    title: 'Recommended for you',
    subtitle: 'Destinations with more balanced access and visitor levels.',
    seeAll: 'See all',
    predictedAtArrival: 'Predicted on arrival',
    reasons: {
      lowerArrivalOccupancy: 'Expected to be quieter when you arrive.',
      smootherAccess: 'Smoother access from your current location.',
      culturalPreference: 'Matches your cultural travel preferences.',
      lowerRouteRisk: 'The access route has a lower risk level.',
      parkingAvailable: 'Parking is expected to be available when you arrive.',
    },
  },

  nearby: {
    title: 'Near you',
    subtitle: 'Destinations that are easy to reach from your location.',
    distanceAway: '{{distance}} km',
    travelTime: '{{minutes}} min',
    openDestination: 'Open {{name}} on the map',
  },

  localContext: {
    title: 'Local events and conditions',
    viewAll: 'See all',
    viewAlerts: 'View alerts',
    schedule: 'Runs from {{start}}–{{end}}',
  },

  image: {
    destinationAccessibility: 'Photo of {{name}}',
    photoCredit: 'Photo by {{name}} on Unsplash',
    photoCreditAccessibility: 'Open {{name}}’s photographer page on Unsplash',
  },

  states: {
    loadingTitle: 'Preparing your travel briefing',
    loadingDescription: 'Local conditions and recommendations are being summarized.',
    emptyTitle: 'No briefing is available yet',
    emptyDescription: 'Explore destinations or open the map to start planning.',
    emptyAction: 'Open Explore',
    errorTitle: 'The briefing could not be loaded',
    errorDescription: 'NADI local data could not be opened. Please try again.',
    retry: 'Try again',
  },
} as const;
