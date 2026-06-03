export const MAPS_PROVIDER_SCHEMA_VERSION = 'maps-provider-v1';

const freeze = (value) => Object.freeze(value);
const list = (values = []) => freeze(values);

const makeProvider = ({
  id,
  label,
  kind,
  defaultMode,
  requiredEnv = [],
  optionalEnv = [],
  publicEnv = [],
  capabilities = [],
  durableStorage = 'adapter-local',
  sourcePolicy,
  attribution = [],
  styleTemplates = [],
  searchTemplates = [],
  startupNotes = [],
}) =>
  freeze({
    schemaVersion: MAPS_PROVIDER_SCHEMA_VERSION,
    id,
    label,
    kind,
    defaultMode,
    requiredEnv: list(requiredEnv),
    optionalEnv: list(optionalEnv),
    publicEnv: list(publicEnv),
    capabilities: list(capabilities),
    durableStorage,
    sourcePolicy,
    attribution: list(attribution),
    styleTemplates: list(styleTemplates),
    searchTemplates: list(searchTemplates),
    startupNotes: list(startupNotes),
  });

export const mapsProviderRegistry = freeze({
  libre: makeProvider({
    id: 'libre',
    label: 'Libre maps',
    kind: 'open-data',
    defaultMode: 'default-free',
    optionalEnv: [
      'NEXT_PUBLIC_MAPLIBRE_STYLE_URL',
      'OSM_OVERPASS_ENDPOINT',
      'OVERTURE_PLACES_PATH',
      'OVERTURE_BUILDINGS_PATH',
      'PMTILES_BASE_URL',
    ],
    publicEnv: ['NEXT_PUBLIC_MAPLIBRE_STYLE_URL'],
    capabilities: [
      'render-raster-or-vector-style',
      'query-osm-overpass',
      'load-overture-bulk-places',
      'load-overture-buildings',
      'serve-pmtiles',
      'durable-open-corpus',
    ],
    durableStorage: 'allowed-with-attribution-and-source-license-review',
    sourcePolicy:
      'Provider ids stay adapter-local. Normalize allowed durable records into name@geohash9 place skeletons.',
    attribution: ['OpenStreetMap contributors', 'Overture Maps Foundation'],
    styleTemplates: ['maplibre-style-url', 'pmtiles-style-url'],
    searchTemplates: ['osm-overpass-amenity', 'overture-places-bbox'],
    startupNotes: [
      'Use as the free default provider.',
      'Prefer Overture/OSM for durable place corpus generation.',
      'Render attribution in every product surface.',
    ],
  }),
  mapbox: makeProvider({
    id: 'mapbox',
    label: 'Mapbox',
    kind: 'commercial-render-search',
    defaultMode: 'optional-render-provider',
    requiredEnv: ['NEXT_PUBLIC_MAPBOX_TOKEN'],
    optionalEnv: ['MAPBOX_ACCESS_TOKEN', 'MAPBOX_STYLE_URL'],
    publicEnv: ['NEXT_PUBLIC_MAPBOX_TOKEN'],
    capabilities: [
      'render-vector-style',
      'geocode',
      'search',
      'directions',
      'terrain',
      'satellite',
    ],
    durableStorage: 'review-mapbox-terms-before-storing-search-results',
    sourcePolicy:
      'Mapbox feature ids are provider-local. Store only user-created or separately licensed normalized place data.',
    attribution: ['Mapbox', 'OpenStreetMap contributors'],
    styleTemplates: ['mapbox-style-url', 'mapbox-satellite'],
    searchTemplates: ['mapbox-forward-geocode', 'mapbox-category-search'],
    startupNotes: [
      'Use public scoped token for browser rendering.',
      'Keep server token separate for backend search or proxy calls.',
    ],
  }),
  google: makeProvider({
    id: 'google',
    label: 'Google Maps and Places',
    kind: 'commercial-render-search',
    defaultMode: 'optional-search-provider',
    requiredEnv: ['GOOGLE_MAPS_API_KEY'],
    optionalEnv: ['GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
    publicEnv: ['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'],
    capabilities: [
      'render-map',
      'places-search',
      'place-details',
      'street-view',
      'directions',
      'photoreference',
    ],
    durableStorage: 'transient-render-and-user-confirmed-normalization-only',
    sourcePolicy:
      'Google place ids are source-local metadata. Do not use them as universal ids.',
    attribution: ['Google'],
    styleTemplates: ['google-map-id', 'google-street-view'],
    searchTemplates: ['google-text-search', 'google-nearby-search'],
    startupNotes: [
      'Server-side Places keys are preferred.',
      'Convert user-confirmed navigation into name@geohash9 records instead of durable Google result storage.',
    ],
  }),
  apple: makeProvider({
    id: 'apple',
    label: 'Apple MapKit',
    kind: 'native-and-browser-render-search',
    defaultMode: 'ios-native-first',
    requiredEnv: ['APPLE_MAPKIT_TEAM_ID', 'APPLE_MAPKIT_KEY_ID'],
    optionalEnv: [
      'APPLE_MAPKIT_PRIVATE_KEY',
      'NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT',
    ],
    publicEnv: ['NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT'],
    capabilities: [
      'ios-native-map',
      'mapkit-js-render',
      'local-search',
      'look-around',
      'directions',
    ],
    durableStorage: 'transient-render-and-user-confirmed-normalization-only',
    sourcePolicy:
      'Apple search ids stay native/provider-local. Persist only normalized user intent or separately licensed data.',
    attribution: ['Apple MapKit'],
    styleTemplates: ['mapkit-standard', 'mapkit-muted', 'mapkit-hybrid'],
    searchTemplates: ['apple-local-search', 'apple-look-around'],
    startupNotes: [
      'Swift/Kotlin own platform permissions and native API calls.',
      'Private MapKit key material stays server-side.',
    ],
  }),
});

export const mapsProviderIds = freeze(Object.keys(mapsProviderRegistry));

export function getMapsProvider(providerId = 'libre') {
  return mapsProviderRegistry[providerId] || mapsProviderRegistry.libre;
}

export function listMapsProviders({ includeOptional = true } = {}) {
  const providers = Object.values(mapsProviderRegistry);
  return freeze(
    includeOptional
      ? providers
      : providers.filter((provider) => provider.defaultMode === 'default-free')
  );
}

export function getProviderEnvKeys(providerId = 'libre') {
  const provider = getMapsProvider(providerId);
  return freeze({
    providerId: provider.id,
    required: provider.requiredEnv,
    optional: provider.optionalEnv,
    public: provider.publicEnv,
    all: freeze([
      ...new Set([
        ...provider.requiredEnv,
        ...provider.optionalEnv,
        ...provider.publicEnv,
      ]),
    ]),
  });
}

export function evaluateProviderEnv(providerId = 'libre', env = {}) {
  const provider = getMapsProvider(providerId);
  const missingRequired = provider.requiredEnv.filter((key) => !env[key]);
  const configuredOptional = provider.optionalEnv.filter((key) => Boolean(env[key]));
  return freeze({
    providerId: provider.id,
    ready: missingRequired.length === 0,
    missingRequired: freeze(missingRequired),
    configuredOptional: freeze(configuredOptional),
    publicEnv: provider.publicEnv,
  });
}
