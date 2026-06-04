import { createMapsProviderAdapter } from '../providerAdapter.js';
import { getMapsProvider } from '../providerRegistry.js';
export {
  buildMapboxLayerTemplate,
  buildMapboxRuntimeConfig,
  MAPBOX_BRAND_COLORS,
  MAPBOX_HEATMAP_RAMP,
  MAPBOX_LAYER_IDS,
  MAPBOX_PIN_COLORS,
  resolveMapsPinColor,
  resolveMapsPinRadius,
} from './mapboxRuntime.js';

export const mapboxProviderManifest = getMapsProvider('mapbox');

export const mapboxProviderTemplates = Object.freeze({
  style: Object.freeze({
    publicTokenEnv: 'NEXT_PUBLIC_MAPBOX_TOKEN',
    serverTokenEnv: 'MAPBOX_ACCESS_TOKEN',
    styleUrlEnv: 'MAPBOX_STYLE_URL',
    publicStyleUrlEnv: 'NEXT_PUBLIC_MAPBOX_STYLE_URL',
    tilesetIdEnv: 'NEXT_PUBLIC_MAPBOX_TILESET_ID',
    sourceLayerEnv: 'NEXT_PUBLIC_MAPBOX_SOURCE_LAYER',
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
