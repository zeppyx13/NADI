import type { MapLatLng } from '@/types/map';

/**
 * Decodes Google's encoded polyline format into coordinates.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): MapLatLng[] {
  const points: MapLatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return points;
}

/**
 * Fixture published with Google's polyline algorithm documentation. It is the
 * only encoded string in this repository whose expected output is known, so it
 * is used as the reference for the decoder rather than any invented geometry.
 */
const referenceEncodedPolyline = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const referenceDecodedPoints: readonly MapLatLng[] = [
  { latitude: 38.5, longitude: -120.2 },
  { latitude: 40.7, longitude: -120.95 },
  { latitude: 43.252, longitude: -126.453 },
];

export type PolylineDecoderCheck = {
  passed: boolean;
  expected: readonly MapLatLng[];
  actual: readonly MapLatLng[];
};

/**
 * Deterministic verification of the decoder. Pure and dependency free, so it
 * can be exercised from anywhere without a test runner.
 */
export function verifyPolylineDecoder(): PolylineDecoderCheck {
  const actual = decodePolyline(referenceEncodedPolyline);
  const passed =
    actual.length === referenceDecodedPoints.length &&
    actual.every((point, index) => {
      const expected = referenceDecodedPoints[index];
      return (
        Math.abs(point.latitude - expected.latitude) < 1e-9 &&
        Math.abs(point.longitude - expected.longitude) < 1e-9
      );
    });

  return { passed, expected: referenceDecodedPoints, actual };
}

if (__DEV__) {
  const check = verifyPolylineDecoder();
  if (!check.passed) {
    console.error('[NADI Routes] polyline decoder failed reference check', {
      expected: check.expected,
      actual: check.actual,
    });
  }
}
