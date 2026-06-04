import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  MAPS_PLACE_SCHEMA_VERSION,
  MAPS_PROVIDER_SCHEMA_VERSION,
  appleSpanToZoom,
  appleZoomToSpan,
  appleProviderTemplates,
  buildAppleMapKitRuntimeTemplate,
  buildMapsProviderRoute,
  buildMapsPlaceKey,
  buildMapsRouteGeoJson,
  buildMapsRouteSegments,
  buildMapsRuntimePolicy,
  buildMapsStartupConfig,
  buildMapsClusterParams,
  buildMapsVisitedCandidates,
  buildMapsVisitedSettings,
  buildMapboxLayerTemplate,
  buildMapboxRuntimeConfig,
  estimateMapsViewportBounds,
  expandMapsBounds,
  formatMapsClusterCount,
  createEnabledProviderAdapters,
  createGoogleMapsAdapter,
  createMapsProviderAdapter,
  encodeMapsGeohash,
  evaluateProviderEnv,
  getMapsClusterLabel,
  getMapsClusterPrecisionForZoom,
  getMapsClusterRadius,
  getMapsPrecisionForZoom,
  getAppleMapKitTokenStatus,
  getAppleClusterGlyph,
  getJwtExpiry,
  getProviderEnvKeys,
  isMapsGeohashVisited,
  isMapsLatLngInBounds,
  googleProviderTemplates,
  libreProviderTemplates,
  mergeMapsVisitedGeohashes,
  mapsProviderIds,
  mapsProviderRegistry,
  mapboxProviderTemplates,
  normalizeMapsCameraCenter,
  normalizeAppleMapKitSearchPlace,
  normalizeAppleMapsPlace,
  normalizeAppleMapsTokenOrigin,
  normalizeMapsPin,
  normalizeMapsPlace,
  resolveMapsPinColor,
  resolveMapsPinRadius,
  shouldShowRichOverlayPins,
  shouldTrackMapsVisitedGeohash,
  sortMapsPinsForDisplay,
} from '../src/index.js';

test('provider registry covers starter map and places providers', () => {
  assert.equal(MAPS_PROVIDER_SCHEMA_VERSION, 'tst-provider-type-v1');
  assert.deepEqual(mapsProviderIds, ['libre', 'mapbox', 'google', 'apple']);
  for (const providerId of mapsProviderIds) {
    const provider = mapsProviderRegistry[providerId];
    assert.equal(provider.schemaVersion, MAPS_PROVIDER_SCHEMA_VERSION);
    assert.equal(provider.id, providerId);
    assert.equal(provider.providerId, providerId);
    assert.ok(provider.providerGlyph);
    assert.ok(provider.unicodeTypes.includes(provider.providerGlyph));
    assert.ok(provider.capabilities.length > 0);
    assert.ok(provider.sourcePolicy.includes('local') || provider.sourcePolicy.includes('name@geohash9'));
    assert.ok(Array.isArray(provider.requiredEnv));
    assert.ok(Array.isArray(provider.optionalEnv));
  }
});

test('startup config evaluates provider env readiness', () => {
  const config = buildMapsStartupConfig({
    MAPS_DEFAULT_PROVIDER: 'libre',
    MAPS_ENABLED_PROVIDERS: 'libre,mapbox,google,apple',
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test',
    GOOGLE_MAPS_API_KEY: 'google-test',
    APPLE_MAPKIT_TEAM_ID: 'team',
    APPLE_MAPKIT_KEY_ID: 'key',
  });

  assert.equal(config.defaultProviderId, 'libre');
  assert.deepEqual(config.readyProviders, ['libre', 'mapbox', 'google', 'apple']);
  assert.ok(config.startupChecks.some((check) => check.includes('provider keys')));
  assert.deepEqual(getProviderEnvKeys('google').required, ['GOOGLE_MAPS_API_KEY']);
  assert.equal(evaluateProviderEnv('mapbox', {}).ready, false);
});

test('provider adapter normalizes provider records into MAPS place schema', () => {
  const adapter = createMapsProviderAdapter('google', {
    GOOGLE_MAPS_API_KEY: 'server-key',
  });
  const place = adapter.normalizePlace({
    id: 'google-place-id',
    name: 'Sports Tap',
    lat: 29.6518,
    lng: -82.3252,
    geohash: 'djn4k5e7u',
    placeType: 'bar',
    tags: ['nightlife', 'sports'],
  });

  assert.equal(adapter.canStart, true);
  assert.equal(place.schemaVersion, MAPS_PLACE_SCHEMA_VERSION);
  assert.equal(place.provider, 'google');
  assert.equal(place.providerRef.schemaVersion, 'tst-provider-ref-v1');
  assert.equal(place.providerRef.providerId, 'google');
  assert.equal(place.providerRef.providerKind, 'commercial-render-search');
  assert.equal(place.providerRef.providerGlyph, '\u{1F50E}');
  assert.equal(place.providerRef.sourceId, 'google-place-id');
  assert.equal(place.sourceId, 'google-place-id');
  assert.equal(place.canonicalKey, 'sports-tap@djn4k5e7u');
  assert.equal(place.placeId, place.canonicalKey);
  assert.ok(place.typeTokens.includes('nightlife'));
  assert.equal(place.unicodeType, '\u{1F378}');
  assert.ok(place.unicodeTypes.includes('\u{1F378}'));
  assert.ok(place.sourcePolicy.includes('Google place ids'));
});

test('place schema builds stable name@geohash9 keys with fallbacks', () => {
  assert.equal(
    buildMapsPlaceKey({ name: 'Cafe Court!', geohash: 'djn4k5e7u999' }),
    'cafe-court@djn4k5e7u'
  );
  assert.equal(
    normalizeMapsPlace({ name: 'Unknown Place' }).canonicalKey,
    'unknown-place@unmapped'
  );
  assert.equal(encodeMapsGeohash(29.6518, -82.3252, 9), 'djm2wtuw7');
  assert.equal(
    normalizeMapsPlace({ name: 'Sports Tap', lat: 29.6518, lng: -82.3252 })
      .canonicalKey,
    'sports-tap@djm2wtuw7'
  );
});

test('enabled provider adapters expose shared search and runtime template shape', () => {
  const adapters = createEnabledProviderAdapters({
    env: {
      MAPS_ENABLED_PROVIDERS: 'libre,mapbox',
      NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test',
    },
  });

  assert.deepEqual(
    adapters.map((adapter) => adapter.id),
    ['libre', 'mapbox']
  );
  const request = adapters[0].buildSearchRequest({
    query: 'bars',
    center: { geohash: 'djn4k5e7u' },
  });
  assert.equal(request.providerId, 'libre');
  assert.equal(request.query, 'bars');
  assert.ok(request.templates.includes('osm-overpass-amenity'));
  assert.ok(adapters[1].buildRuntimeConfig().publicEnv.NEXT_PUBLIC_MAPBOX_TOKEN);
  assert.equal(adapters[1].buildRuntimeConfig().providerGlyph, '\u{1F50E}');
});

test('per-provider template modules expose startup env and place identity hints', () => {
  assert.equal(libreProviderTemplates.places.normalizedIdentity, 'name@geohash9');
  assert.equal(mapboxProviderTemplates.style.publicTokenEnv, 'NEXT_PUBLIC_MAPBOX_TOKEN');
  assert.equal(googleProviderTemplates.places.placesKeyEnv, 'GOOGLE_PLACES_API_KEY');
  assert.equal(
    appleProviderTemplates.style.tokenEndpointEnv,
    'NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT'
  );

  const google = createGoogleMapsAdapter({ GOOGLE_MAPS_API_KEY: 'server-key' });
  assert.equal(google.id, 'google');
  assert.equal(google.canStart, true);
});

test('route and pin helpers preserve provider-neutral map contracts from stuff', () => {
  assert.equal(
    buildMapsProviderRoute({
      provider: 'mapbox',
      params: { q: 'bars', provider: 'google', tag: ['beer', 'music'] },
    }),
    '/Maps?q=bars&tag=beer&tag=music&provider=mapbox'
  );

  const pins = [
    normalizeMapsPin({
      name: 'Plain Corpus',
      lat: 29.65,
      lng: -82.32,
      source: 'public-corpus',
    }),
    normalizeMapsPin({
      name: 'Friend Spot',
      lat: 29.6518,
      lng: -82.3252,
      source: 'social',
      social: { friendsCount: 2 },
      personal: { liked: true },
    }),
  ];

  assert.equal(pins[0].schemaVersion, 'maps-pin-v1');
  assert.equal(pins[0].canonicalId, 'plain-corpus@djm2wv87u');
  assert.equal(sortMapsPinsForDisplay(pins)[0].name, 'Friend Spot');
  assert.equal(shouldShowRichOverlayPins(14), false);
  assert.equal(shouldShowRichOverlayPins(15), true);
});

test('Apple helpers normalize archived Apple place and token contracts', () => {
  const place = normalizeAppleMapsPlace({
    identifier: 'apple_123',
    displayName: 'Apple Bar',
    coordinate: { latitude: 29.6518, longitude: -82.3252 },
    displayLines: ['1 Main St', 'Gainesville, FL'],
    poiCategories: ['Nightlife'],
    url: 'https://maps.apple.com/?q=Apple%20Bar',
  });

  assert.equal(place.provider, 'apple');
  assert.equal(place.sourceId, '123');
  assert.equal(place.canonicalKey, 'apple-bar@djm2wtuw7');
  assert.ok(place.typeTokens.includes('nightlife'));

  assert.equal(
    normalizeAppleMapsTokenOrigin('localhost:3000'),
    'http://localhost:3000'
  );
  assert.equal(getAppleMapKitTokenStatus({}).mode, 'missing');
  assert.equal(
    getAppleMapKitTokenStatus({
      APPLE_MAPKIT_TEAM_ID: 'team',
      APPLE_MAPKIT_KEY_ID: 'key',
      APPLE_MAPKIT_PRIVATE_KEY: 'private',
    }).mode,
    'signing-keys'
  );
  assert.equal(getJwtExpiry('not-a-token'), null);
});

test('MapMB runtime templates are available without React or Mapbox globals', () => {
  const runtime = buildMapsRuntimePolicy({
    provider: 'apple',
    isMobile: true,
    lowEnd: true,
  });
  assert.equal(runtime.rendererMode, 'flat-low-end');
  assert.equal(runtime.limits.maxAnnotations, 180);
  assert.ok(runtime.updateNote.includes('upstream'));

  const appleRuntime = buildAppleMapKitRuntimeTemplate({ isMobile: false });
  assert.equal(appleRuntime.provider, 'apple');
  assert.equal(appleRuntime.searchFallbackQueries[0], 'bar');
  assert.deepEqual(appleZoomToSpan(4), {
    latitudeDelta: 22.5,
    longitudeDelta: 37.125,
  });
  assert.equal(Math.round(appleSpanToZoom({ latitudeDelta: 22.5 })), 4);
  assert.equal(getAppleClusterGlyph(1000), '999+');

  const place = normalizeAppleMapKitSearchPlace({
    name: 'MapKit Pub',
    coordinate: { latitude: 29.6518, longitude: -82.3252 },
    pointOfInterestCategory: 'Nightlife',
  });
  assert.equal(place.canonicalKey, 'mapkit-pub@djm2wtuw7');

  const mapboxRuntime = buildMapboxRuntimeConfig({
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.test',
    NEXT_PUBLIC_MAPBOX_TILESET_ID: 'ric.bars',
    NEXT_PUBLIC_MAPBOX_SOURCE_LAYER: 'bars',
  });
  assert.equal(mapboxRuntime.configured, true);
  assert.equal(mapboxRuntime.tilesetConfigured, true);
  assert.equal(
    buildMapboxLayerTemplate({ sourceLayer: 'bars' }).layers.labels.textField[1],
    'name'
  );

  const pin = normalizeMapsPin({
    name: 'Social Pin',
    lat: 29.6518,
    lng: -82.3252,
    personal: { liked: true },
    social: { friendsCount: 1 },
  });
  assert.equal(resolveMapsPinColor(pin), '#22c55e');
  assert.equal(resolveMapsPinRadius(pin), 11);
});

test('MapMB route-line template builds segmented GeoJSON', () => {
  const nowMs = Date.parse('2026-06-04T01:00:00Z');
  const segments = buildMapsRouteSegments(
    [
      {
        lat: 29.65,
        lng: -82.32,
        time: '2026-06-04T02:00:00Z',
      },
      {
        lat: 29.66,
        lng: -82.33,
        time: '2026-06-04T03:00:00Z',
      },
      {
        lat: 29.67,
        lng: -82.34,
        time: '2026-06-05T22:00:00Z',
      },
    ],
    { nowMs }
  );
  assert.equal(segments.length, 1);
  assert.equal(segments[0].coords.length, 2);

  const geoJson = buildMapsRouteGeoJson(segments);
  assert.equal(geoJson.type, 'FeatureCollection');
  assert.equal(geoJson.features.length, 3);
  assert.equal(geoJson.features[0].geometry.type, 'LineString');
});

test('archived lib geo helpers are available as pure MAPS viewport utilities', () => {
  assert.equal(getMapsPrecisionForZoom(4), 2);
  assert.equal(getMapsPrecisionForZoom(15), 7);
  assert.equal(getMapsClusterPrecisionForZoom(9), 5);

  const params = buildMapsClusterParams({
    zoom: 14,
    center: { lat: 29.6518, lng: -82.3252 },
  });
  assert.equal(params.precision, 6);
  assert.equal(params.clusterPrecision, 6);
  assert.equal(params.prefix, 'djm2wt');

  assert.equal(
    getMapsClusterLabel({ city: 'Gainesville', state: 'FL' }, 8, 'djm2'),
    'Gainesville, FL'
  );
  assert.equal(getMapsClusterRadius(4), 25000);
  assert.equal(formatMapsClusterCount(142), '100+');

  const center = normalizeMapsCameraCenter({ lat: 91, lng: 190 });
  assert.deepEqual(center, { lat: 90, lng: -170 });

  const bounds = estimateMapsViewportBounds({
    center: { lat: 29.65, lng: -82.32 },
    targetZoom: 16,
  });
  assert.ok(bounds.north > bounds.south);
  assert.equal(isMapsLatLngInBounds(29.65, -82.32, bounds), true);
  assert.equal(expandMapsBounds(bounds, 0.1).north > bounds.north, true);
});

test('archived visited-geohash coverage works without app storage', () => {
  const settings = buildMapsVisitedSettings({
    enabled: 'true',
    restrict: '1',
    precision: 5,
    trackingMode: 'both',
    tree: true,
  });
  assert.equal(settings.enabled, true);
  assert.equal(settings.trackingMode, 'both');
  assert.equal(shouldTrackMapsVisitedGeohash(settings.trackingMode, 'center'), true);

  const candidates = buildMapsVisitedCandidates(
    { lat: 29.6518, lng: -82.3252 },
    settings.precision,
    settings.tree
  );
  assert.deepEqual(candidates, ['djm2', 'djm2w']);

  const merged = mergeMapsVisitedGeohashes(new Map(), candidates, {
    nowMs: 1000,
    maxEntries: 10,
  });
  assert.equal(merged.changed, true);
  assert.equal(isMapsGeohashVisited('djm2wtuw7', merged.next, 5, true), true);
  assert.equal(isMapsGeohashVisited('zzzz', merged.next, 5, true), false);
});

test('env example documents startup and provider keys', async () => {
  const envExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  for (const key of [
    'MAPS_DEFAULT_PROVIDER',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
    'GOOGLE_MAPS_API_KEY',
    'APPLE_MAPKIT_TEAM_ID',
    'OSM_OVERPASS_ENDPOINT',
  ]) {
    assert.ok(envExample.includes(key), `${key} missing from .env.example`);
  }
});
