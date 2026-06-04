import { getMapsProvider } from './providerRegistry.js';

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

export const MAPS_PROVIDER_ROUTE_SCHEMA_VERSION = 'maps-provider-route-v1';

export function normalizeMapsProviderRoute(providerId = 'libre') {
  return getMapsProvider(cleanText(providerId, 'libre')).id;
}

export function buildMapsProviderRoute({
  provider = 'libre',
  basePath = '/Maps',
  params = {},
} = {}) {
  const resolvedProvider = normalizeMapsProviderRoute(provider);
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (key === 'provider') continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry != null) searchParams.append(key, String(entry));
      }
      continue;
    }
    if (value != null) searchParams.set(key, String(value));
  }
  searchParams.set('provider', resolvedProvider);
  return `${basePath}?${searchParams.toString()}`;
}

export function buildMapsProviderRouteManifest({ basePath = '/Maps' } = {}) {
  return freeze({
    schemaVersion: MAPS_PROVIDER_ROUTE_SCHEMA_VERSION,
    basePath,
    comparisonPath: `${basePath}/[provider]`,
    providersRedirectTo: `${basePath}?provider={provider}`,
    defaultProvider: normalizeMapsProviderRoute('libre'),
    preservedQueryPolicy:
      'Provider comparison routes preserve non-provider query params and rewrite provider to the normalized id.',
  });
}
