import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { colors, radii } from '@/constants/theme';
import type { ItineraryPlace } from '@/types/itinerary';

export type CustomPlaceLayerProps = {
  places: readonly ItineraryPlace[];
  selectedPlaceId?: string;
  visible?: boolean;
  onPress?: (placeId: string) => void;
};

export const CustomPlaceLayer = memo(function CustomPlaceLayer({
  places,
  selectedPlaceId,
  visible = true,
  onPress,
}: CustomPlaceLayerProps) {
  if (!visible) return null;

  return (
    <>
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        return (
          <Marker
            key={place.id}
            identifier={place.id}
            coordinate={place}
            tracksViewChanges={false}
            zIndex={isSelected ? 3 : 2}
            accessibilityLabel={place.name}
            onPress={() => onPress?.(place.id)}
          >
            <View style={[styles.marker, isSelected && styles.markerSelected]} />
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  marker: {
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.teal[600],
  },
  markerSelected: {
    width: 22,
    height: 22,
    borderColor: colors.neutral.navy,
  },
});
