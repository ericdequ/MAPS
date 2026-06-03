import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  MAPS_PLACE_SCHEMA_VERSION,
  appleProviderTemplates,
  buildMapsPlaceKey,
  buildMapsStartupConfig,
  createEnabledProviderAdapters,
  createGoogleMapsAdapter,
  createMapsProviderAdapter,
  evaluateProviderEnv,
  getProviderEnvKeys,
  googleProviderTemplates,
  libreProviderTemplates,
  mapsProviderIds,
  mapsProviderRegistry,
  mapboxProviderTemplates,
  normalizeMapsPlace,
} from '../src/index.js';

test('provider registry covers starter map and places providers', () => {
  assert.deepEqual(mapsProviderIds, ['libre', 'mapbox', 'google', 'apple']);
  for (const providerId of mapsProviderIds) {
    const provider = mapsProviderRegistry[providerId];
    assert.equal(provider.id, providerId);
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
  assert.equal(place.sourceId, 'google-place-id');
  assert.equal(place.canonicalKey, 'sports-tap@djn4k5e7u');
  assert.equal(place.placeId, place.canonicalKey);
  assert.ok(place.typeTokens.includes('nightlife'));
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
