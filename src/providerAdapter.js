import { normalizeMapsPlace } from './placeSchema.js';
import {
  evaluateProviderEnv,
  getMapsProvider,
  mapsProviderIds,
} from './providerRegistry.js';

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

export function buildProviderSearchTemplate({
  providerId = 'libre',
  query = '',
  center = {},
  bbox = null,
  category = '',
  limit = 20,
} = {}) {
  const provider = getMapsProvider(providerId);
  return freeze({
    providerId: provider.id,
    templateVersion: 'maps-provider-search-template-v1',
    query: cleanText(query),
    category: cleanText(category),
    center: freeze({
      lat: Number.isFinite(Number(center.lat)) ? Number(center.lat) : null,
      lng: Number.isFinite(Number(center.lng)) ? Number(center.lng) : null,
      geohash: cleanText(center.geohash),
    }),
    bbox: bbox ? freeze(bbox) : null,
    limit: Math.max(1, Math.min(Number(limit || 20), 100)),
    templates: provider.searchTemplates,
    resultPolicy: provider.sourcePolicy,
  });
}

export function createMapsProviderAdapter(providerId = 'libre', env = {}) {
  const provider = getMapsProvider(providerId);
  const envStatus = evaluateProviderEnv(provider.id, env);
  return freeze({
    id: provider.id,
    label: provider.label,
    provider,
    envStatus,
    canStart: envStatus.ready,
    buildSearchRequest: (request = {}) =>
      buildProviderSearchTemplate({ ...request, providerId: provider.id }),
    normalizePlace: (place = {}) =>
      normalizeMapsPlace({
        ...place,
        provider: provider.id,
        providerKind: provider.providerKind,
        attribution: provider.attribution,
        unicodeType: place.unicodeType || place.emoji || place.glyph,
        unicodeTypes: place.unicodeTypes,
        sourcePolicy: provider.sourcePolicy,
      }),
    buildRuntimeConfig: () =>
      freeze({
        providerId: provider.id,
        mode: provider.defaultMode,
        providerGlyph: provider.providerGlyph,
        modeGlyph: provider.modeGlyph,
        unicodeType: provider.unicodeType,
        unicodeTypes: provider.unicodeTypes,
        capabilities: provider.capabilities,
        attribution: provider.attribution,
        publicEnv: Object.fromEntries(
          provider.publicEnv.map((key) => [key, env[key] || ''])
        ),
      }),
  });
}

export function createEnabledProviderAdapters({
  env = {},
  enabledProviders = env.MAPS_ENABLED_PROVIDERS,
} = {}) {
  const requested = cleanText(enabledProviders)
    ? cleanText(enabledProviders)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : ['libre'];
  return freeze(
    requested
      .filter((id) => mapsProviderIds.includes(id))
      .map((id) => createMapsProviderAdapter(id, env))
  );
}
