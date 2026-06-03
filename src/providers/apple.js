import { createMapsProviderAdapter } from '../providerAdapter.js';
import { getMapsProvider } from '../providerRegistry.js';

export const appleProviderManifest = getMapsProvider('apple');

export const appleProviderTemplates = Object.freeze({
  style: Object.freeze({
    teamIdEnv: 'APPLE_MAPKIT_TEAM_ID',
    keyIdEnv: 'APPLE_MAPKIT_KEY_ID',
    privateKeyEnv: 'APPLE_MAPKIT_PRIVATE_KEY',
    tokenEndpointEnv: 'NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT',
  }),
  places: Object.freeze({
    searchTemplates: Object.freeze([
      'apple-local-search',
      'apple-look-around',
    ]),
    normalizedIdentity: 'name@geohash9',
  }),
});

export function createAppleMapsAdapter(env = {}) {
  return createMapsProviderAdapter('apple', env);
}
