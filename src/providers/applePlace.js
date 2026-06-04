import { encodeMapsGeohash, toFiniteCoordinate } from '../geohash.js';
import { normalizeMapsPlace } from '../placeSchema.js';

const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

const firstText = (...values) => {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
};

export function normalizeAppleMapsPlaceId(value) {
  const raw = cleanText(value);
  if (!raw) return '';
  return raw.replace(/^apple[_:/-]*/i, '');
}

export function extractAppleMapsCoordinates(place = {}) {
  const coord =
    place.coordinates ||
    place.coordinate ||
    place.location ||
    place.position ||
    {};
  const lat = toFiniteCoordinate(
    coord.lat ?? coord.latitude ?? place.lat ?? place.latitude
  );
  const lng = toFiniteCoordinate(
    coord.lng ??
      coord.lon ??
      coord.longitude ??
      place.lng ??
      place.lon ??
      place.longitude
  );
  return { lat, lng };
}

export function extractAppleMapsCategories(place = {}) {
  if (Array.isArray(place.categories)) return place.categories.filter(Boolean);
  if (Array.isArray(place.poiCategories)) {
    return place.poiCategories.filter(Boolean);
  }
  return place.poiCategory ? [place.poiCategory] : [];
}

export function extractAppleMapsAddress(place = {}) {
  const lines = Array.isArray(place.displayLines)
    ? place.displayLines.filter(Boolean)
    : [];
  return (
    firstText(
      place.address,
      place.formatted_address,
      place.formattedAddress,
      place.fullAddress
    ) || lines.join(', ')
  );
}

export function normalizeAppleMapsPlace(place = {}) {
  if (!place || typeof place !== 'object') return null;

  const sourceId = normalizeAppleMapsPlaceId(
    firstText(
      place.apple_maps_id,
      place.appleMapsId,
      place.appleId,
      place.identifier,
      place.mapItemId,
      place.id
    )
  );
  const coords = extractAppleMapsCoordinates(place);
  if (!sourceId || coords.lat == null || coords.lng == null) return null;

  const name =
    firstText(place.name, place.displayName, place.title) || 'Apple Maps place';
  const geohash9 =
    cleanText(place.geohash9 || place.g9 || place.geohash).toLowerCase() ||
    encodeMapsGeohash(coords.lat, coords.lng, 9);
  const categories = extractAppleMapsCategories(place);

  return normalizeMapsPlace({
    provider: 'apple',
    sourceId,
    name,
    lat: coords.lat,
    lng: coords.lng,
    geohash: geohash9,
    address: extractAppleMapsAddress(place),
    phone: firstText(place.phone, place.telephone),
    website: firstText(place.website, place.url),
    url: firstText(place.url),
    placeType: categories[0] || place.placeType || 'place',
    typeTokens: ['apple', ...categories],
    links: {
      apple: firstText(place.url, place.apple_url, place.appleUrl),
      ...(place.links || {}),
    },
    rawProviderRecord: place.rawProviderRecord || null,
    sourcePolicy:
      'Apple ids stay provider-local. Apple search results are transient unless user intent confirms a normalized app record.',
  });
}
