import { createMapsProviderAdapter } from '../providerAdapter.js';
import { getMapsProvider } from '../providerRegistry.js';

export const libreProviderManifest = getMapsProvider('libre');

export const libreProviderTemplates = Object.freeze({
  style: Object.freeze({
    maplibreStyleUrlEnv: 'NEXT_PUBLIC_MAPLIBRE_STYLE_URL',
    maplibreDarkStyleUrlEnv: 'NEXT_PUBLIC_MAPLIBRE_STYLE_DARK_URL',
    pmtilesBaseUrlEnv: 'PMTILES_BASE_URL',
  }),
  places: Object.freeze({
    overpassEndpointEnv: 'OSM_OVERPASS_ENDPOINT',
    overturePlacesPathEnv: 'OVERTURE_PLACES_PATH',
    overtureBuildingsPathEnv: 'OVERTURE_BUILDINGS_PATH',
    normalizedIdentity: 'name@geohash9',
  }),
});

export function createLibreMapsAdapter(env = {}) {
  return createMapsProviderAdapter('libre', env);
}
