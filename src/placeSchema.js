import {
  buildProviderRef,
  buildTstBaseKey,
  buildTstGeohash,
  expandUnicodeTypes,
  normalizeTstGeohash,
  normalizeTstSlug,
  resolveEmojiType,
  TST_PLACE_KEY_CONTRACT,
} from './tstBridge.js';

export const MAPS_PLACE_SCHEMA_VERSION = 'maps-place-v1';
export const MAPS_POI_SOURCE_SCHEMA_VERSION = 'maps-poi-source-v1';
export const MAPS_TST_CONTRACT = TST_PLACE_KEY_CONTRACT;

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeMapsSlug = (value, fallback = 'place') =>
  normalizeTstSlug(value, fallback);

export function normalizeMapsGeohash(value = '', precision = 9) {
  return normalizeTstGeohash(value, precision);
}

export function buildMapsPlaceKey({
  name,
  slug,
  geohash,
  fallbackSlug = 'place',
  missingGeohash = 'unmapped',
} = {}) {
  return buildTstBaseKey({
    name,
    slug,
    geohash,
    precision: 9,
    fallbackSlug,
    missingGeohash,
  });
}

export const mapsPlaceRequiredFields = freeze([
  'schemaVersion',
  'placeId',
  'canonicalKey',
  'name',
  'provider',
  'sourceId',
  'location',
  'placeType',
  'typeTokens',
  'sourcePolicy',
]);

export function normalizeMapsPlace(input = {}) {
  const provider = cleanText(input.provider, 'unknown');
  const sourceId = cleanText(
    input.sourceId || input.providerLocalId || input.id,
    `${provider}:unmapped`
  );
  const name = cleanText(input.name || input.title || input.label, 'Unnamed place');
  const geohash = normalizeMapsGeohash(
    input.geohash || input.geohash9 || input.g9 || input.publicGeohash,
    9
  ) || buildTstGeohash({
    lat: input.lat ?? input.latitude,
    lng: input.lng ?? input.lon ?? input.longitude,
    precision: 9,
  });
  const canonicalKey = buildMapsPlaceKey({
    name,
    slug: input.slug,
    geohash,
    fallbackSlug: input.fallbackSlug,
  });
  const placeType = normalizeMapsSlug(
    input.placeType || input.type || input.category || 'place',
    'place'
  );
  const typeTokens = [
    placeType,
    ...new Set(
      [
        input.type,
        input.category,
        input.kind,
        ...(input.typeTokens || []),
        ...(input.tags || []),
      ]
        .map((value) => normalizeMapsSlug(value, ''))
        .filter(Boolean)
    ),
  ];
  const unicodeTypes = expandUnicodeTypes([
    placeType,
    ...typeTokens,
    ...(input.unicodeTypes || []),
    input.unicodeType,
    input.unicodeGlyph,
    input.emoji,
    input.glyph,
  ]);
  const resolvedEmojiType =
    resolveEmojiType(input.unicodeType) ||
    resolveEmojiType(input.emoji) ||
    resolveEmojiType(placeType) ||
    typeTokens.map((token) => resolveEmojiType(token)).find(Boolean);
  const providerRef = buildProviderRef({
    providerId: provider,
    providerKind: input.providerKind || input.kind || 'maps-place-provider',
    sourceId,
    sourcePolicy:
      input.sourcePolicy ||
      'Provider ids stay adapter-local; canonical app ids use name@geohash9.',
    attribution: input.attribution || [],
    durable: input.durableProviderRecord || false,
  });

  return freeze({
    schemaVersion: MAPS_PLACE_SCHEMA_VERSION,
    placeId: canonicalKey,
    canonicalKey,
    bevName: canonicalKey,
    tstContract: MAPS_TST_CONTRACT,
    name,
    provider,
    providerRef,
    unicodeType: resolvedEmojiType?.glyph || unicodeTypes[0] || '',
    unicodeTypes: freeze(unicodeTypes),
    sourceId,
    sourceIds: freeze({
      [provider]: sourceId,
      ...(input.sourceIds || {}),
    }),
    location: freeze({
      lat: Number.isFinite(Number(input.lat)) ? Number(input.lat) : null,
      lng: Number.isFinite(Number(input.lng)) ? Number(input.lng) : null,
      geohash9: geohash,
    }),
    placeType,
    typeTokens: freeze([...new Set(typeTokens)]),
    address: cleanText(input.address || input.formattedAddress),
    website: cleanText(input.website || input.url),
    phone: cleanText(input.phone || input.telephone),
    links: freeze(input.links || {}),
    rawProviderRecord: input.rawProviderRecord || null,
    sourcePolicy:
      input.sourcePolicy ||
      'Provider ids stay adapter-local; canonical app ids use name@geohash9.',
  });
}

export function buildPoiSourceManifest({
  id,
  label,
  provider,
  license,
  attribution = [],
  url = '',
  durable = false,
  recordTypes = [],
  notes = [],
} = {}) {
  return freeze({
    schemaVersion: MAPS_POI_SOURCE_SCHEMA_VERSION,
    id,
    label,
    provider,
    license,
    attribution: freeze(attribution),
    url,
    durable: Boolean(durable),
    recordTypes: freeze(recordTypes),
    notes: freeze(notes),
  });
}
