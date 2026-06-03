import { createMapsProviderAdapter } from '../providerAdapter.js';
import { getMapsProvider } from '../providerRegistry.js';

export const mapboxProviderManifest = getMapsProvider('mapbox');

export const mapboxProviderTemplates = Object.freeze({
  style: Object.freeze({
    publicTokenEnv: 'NEXT_PUBLIC_MAPBOX_TOKEN',
    serverTokenEnv: 'MAPBOX_ACCESS_TOKEN',
    styleUrlEnv: 'MAPBOX_STYLE_URL',
  }),
  places: Object.freeze({
    searchTemplates: Object.freeze([
      'mapbox-forward-geocode',
      'mapbox-category-search',
    ]),
    normalizedIdentity: 'name@geohash9',
  }),
});

export function createMapboxMapsAdapter(env = {}) {
  return createMapsProviderAdapter('mapbox', env);
}
