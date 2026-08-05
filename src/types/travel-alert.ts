export type AlertSeverity = 'info' | 'warning' | 'danger';

export type TravelAlertType =
  | 'traffic'
  | 'incident'
  | 'road-closure'
  | 'destination-crowd'
  | 'local-event';

export type TravelAlertScope = 'nearby' | 'route' | 'destination';

export type TravelAlert = {
  id: string;
  type: TravelAlertType;
  scope: TravelAlertScope;
  titleKey: string;
  descriptionKey: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: AlertSeverity;
  createdAt: string;
  activeWindow?: {
    startsAt: string;
    endsAt: string;
  };
  isRead: boolean;
};
