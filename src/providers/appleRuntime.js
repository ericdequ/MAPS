import { encodeMapsGeohash } from '../geohash.js';
import { normalizeMapsPlace } from '../placeSchema.js';
import { MAPS_RUNTIME_THRESHOLDS } from '../runtimePolicy.js';

const MIN_LATITUDE_DELTA = 0.0012;
const MAX_LATITUDE_DELTA = 160;

const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const APPLE_MAPKIT_RUNTIME_TEMPLATE = Object.freeze({
  searchFallbackQueries: Object.freeze(['bar', 'pub', 'brewery', 'nightclub']),
  barCategoryKeys: Object.freeze(['Nightlife', 'Brewery', 'Winery']),
  clusterId: 'maps-apple-places',
  userLocationAnnotationId: 'maps-user-location',
  annotationTones: Object.freeze({
    selected: Object.freeze({ color: '#ffffff', glyphText: 'B' }),
    custom: Object.freeze({ color: '#d946ef', glyphText: 'S' }),
    friend: Object.freeze({ color: '#22c55e', glyphText: 'F' }),
    meetup: Object.freeze({ color: '#3b82f6', glyphText: 'M' }),
    memory: Object.freeze({ color: '#06b6d4', glyphText: 'N' }),
    liked: Object.freeze({ color: '#ef4444', glyphText: 'L' }),
    visited: Object.freeze({ color: '#f59e0b', glyphText: 'V' }),
    base: Object.freeze({ color: '#8b5cf6', glyphText: 'B' }),
  }),
});

export function appleZoomToSpan(zoom) {
  const safeZoom = Math.max(1, Math.min(20, Number(zoom) || 13));
  const latitudeDelta = Math.max(
    MIN_LATITUDE_DELTA,
    Math.min(MAX_LATITUDE_DELTA, 360 / 2 ** safeZoom)
  );
  return Object.freeze({
    latitudeDelta,
    longitudeDelta: Math.min(360, latitudeDelta * 1.65),
  });
}

export function appleSpanToZoom(span) {
  const delta = Number(span?.latitudeDelta || span?.longitudeDelta);
  if (!Number.isFinite(delta) || delta <= 0) return 4;
  return Math.max(1, Math.min(20, Math.log2(360 / delta)));
}

export function getAppleClusterGlyph(count) {
  if (count >= 1000) return '999+';
  if (count >= 100) return '99+';
  return String(Math.max(2, Number(count) || 2));
}

export function normalizeAppleMapKitSearchPlace(place = {}) {
  const lat = toFiniteNumber(
    place?.coordinate?.latitude ?? place?.lat ?? place?.latitude
  );
  const lng = toFiniteNumber(
    place?.coordinate?.longitude ??
      place?.lng ??
      place?.lon ??
      place?.longitude
  );
  const name = cleanText(place?.name || place?.title);
  if (!name || lat == null || lng == null) return null;

  const geohash9 = encodeMapsGeohash(lat, lng, 9);
  const category = cleanText(
    place?.pointOfInterestCategory || place?.category || place?.poiCategory
  );
  const address =
    cleanText(place?.formattedAddress) ||
    cleanText(place?.displayLines?.join?.(', ')) ||
    cleanText(
      [
        place?.fullThoroughfare,
        place?.locality,
        place?.administrativeAreaCode || place?.administrativeArea,
      ]
        .filter(Boolean)
        .join(', ')
    );

  return normalizeMapsPlace({
    provider: 'apple',
    sourceId:
      cleanText(place?.id || place?.identifier || place?.mapItemId) ||
      `apple-mapkit:${name}@${geohash9}`,
    name,
    lat,
    lng,
    geohash: geohash9,
    address,
    placeType: category || 'bar',
    typeTokens: ['bar', 'apple-mapkit-search', category].filter(Boolean),
    sourcePolicy:
      'Apple MapKit search is a transient renderer/search input. Persist only user-confirmed normalized records.',
  });
}

export function buildAppleMapKitRuntimeTemplate(options = {}) {
  const thresholds = {
    ...MAPS_RUNTIME_THRESHOLDS,
    ...(options.thresholds || {}),
  };
  return Object.freeze({
    provider: 'apple',
    renderer: 'mapkit-js-or-native',
    minSearchZoom: thresholds.appleSearchMinZoom,
    searchDebounceMs: thresholds.appleSearchDebounceMs,
    searchResultLimit: thresholds.appleSearchResultLimit,
    generalRenderMinZoom: thresholds.generalAppleRenderMinZoom,
    maxAnnotations: options.isMobile
      ? thresholds.maxMobileAnnotations
      : thresholds.maxDesktopAnnotations,
    viewportPaddingRatio: thresholds.viewportPaddingRatio,
    ...APPLE_MAPKIT_RUNTIME_TEMPLATE,
  });
}
