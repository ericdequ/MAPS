import { encodeMapsGeohash, toFiniteCoordinate } from './geohash.js';
import { normalizeMapsPlace } from './placeSchema.js';

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

export const MAPS_PIN_SCHEMA_VERSION = 'maps-pin-v1';

export const MAPS_ZOOM_BANDS = freeze({
  DETAIL_MIN: 12,
  RICH_OVERLAY_MIN: 15,
  SINGLE_PLACE_MIN: 16,
});

export const MAPS_PIN_SOURCE_PRIORITY = freeze([
  'custom',
  'social',
  'app-rich',
  'verified-corpus',
  'public-corpus',
  'provider-transient',
]);

export function shouldShowRichOverlayPins(zoom) {
  return (
    Number.isFinite(Number(zoom)) &&
    Number(zoom) >= MAPS_ZOOM_BANDS.RICH_OVERLAY_MIN
  );
}

export function normalizeMapsPin(input = {}) {
  const lat = toFiniteCoordinate(
    input.lat ?? input.latitude ?? input.location?.lat
  );
  const lng = toFiniteCoordinate(
    input.lng ?? input.lon ?? input.longitude ?? input.location?.lng
  );
  const geohash9 =
    cleanText(
      input.g9 || input.geohash9 || input.location?.geohash9
    ).toLowerCase() ||
    encodeMapsGeohash(lat, lng, 9);
  const place = normalizeMapsPlace({
    ...input,
    lat,
    lng,
    geohash: geohash9,
  });
  const source = cleanText(input.source || input.provider || 'public-corpus');
  const sourcePriority = MAPS_PIN_SOURCE_PRIORITY.includes(source)
    ? source
    : 'provider-transient';

  return freeze({
    schemaVersion: MAPS_PIN_SCHEMA_VERSION,
    id: place.placeId,
    canonicalId: place.canonicalKey,
    name: place.name,
    lat,
    lng,
    g3: geohash9.slice(0, 3),
    g6: geohash9.slice(0, 6),
    g9: geohash9,
    source,
    sourcePriority,
    provider: place.provider,
    sourceId: place.sourceId,
    hasRichData: Boolean(input.hasRichData || input.rich || input.fullRecord),
    personal: freeze({
      liked: Boolean(input.personal?.liked || input.liked || input.isLiked),
      visited: Boolean(
        input.personal?.visited || input.visited || input.isVisited
      ),
      saved: Boolean(input.personal?.saved || input.saved || input.isSaved),
      memoryCount: Math.max(
        0,
        Number(input.personal?.memoryCount || input.memoryCount || 0)
      ),
    }),
    social: freeze({
      friendsCount: Math.max(
        0,
        Number(input.social?.friendsCount || input.friendsCount || 0)
      ),
      meetupsCount: Math.max(
        0,
        Number(input.social?.meetupsCount || input.meetupsCount || 0)
      ),
      presenceCount: Math.max(
        0,
        Number(input.social?.presenceCount || input.presenceCount || 0)
      ),
    }),
    custom: Boolean(input.custom || input.isCustomSpot),
    displayTone: cleanText(input.displayTone, 'default'),
    place,
  });
}

export function rankMapsPin(pin = {}) {
  const personal = pin.personal || {};
  const social = pin.social || {};
  const priorityIndex = MAPS_PIN_SOURCE_PRIORITY.indexOf(pin.sourcePriority);
  const sourceScore =
    priorityIndex >= 0 ? MAPS_PIN_SOURCE_PRIORITY.length - priorityIndex : 0;
  return (
    sourceScore * 1000 +
    (pin.hasRichData ? 200 : 0) +
    (pin.custom ? 180 : 0) +
    (personal.liked ? 120 : 0) +
    (personal.saved ? 80 : 0) +
    (personal.visited ? 60 : 0) +
    Math.min(Number(social.friendsCount || 0), 20) * 20 +
    Math.min(Number(social.meetupsCount || 0), 20) * 18 +
    Math.min(Number(social.presenceCount || 0), 50)
  );
}

export function sortMapsPinsForDisplay(pins = []) {
  return [...pins].sort((left, right) => {
    const scoreDelta = rankMapsPin(right) - rankMapsPin(left);
    if (scoreDelta) return scoreDelta;
    return cleanText(left.name).localeCompare(cleanText(right.name));
  });
}
