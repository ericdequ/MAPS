import { createMapsProviderAdapter } from '../providerAdapter.js';
import { getMapsProvider } from '../providerRegistry.js';

export const googleProviderManifest = getMapsProvider('google');

export const googleProviderTemplates = Object.freeze({
  style: Object.freeze({
    publicMapsKeyEnv: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    serverMapsKeyEnv: 'GOOGLE_MAPS_API_KEY',
  }),
  places: Object.freeze({
    placesKeyEnv: 'GOOGLE_PLACES_API_KEY',
    searchTemplates: Object.freeze([
      'google-text-search',
      'google-nearby-search',
    ]),
    normalizedIdentity: 'name@geohash9',
  }),
});

export function createGoogleMapsAdapter(env = {}) {
  return createMapsProviderAdapter('google', env);
}
