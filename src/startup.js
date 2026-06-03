import {
  evaluateProviderEnv,
  getMapsProvider,
  listMapsProviders,
} from './providerRegistry.js';

const freeze = (value) => Object.freeze(value);
const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim();

export const MAPS_STARTUP_SCHEMA_VERSION = 'maps-startup-v1';

export function buildMapsStartupConfig(env = {}) {
  const enabled = cleanText(env.MAPS_ENABLED_PROVIDERS, 'libre')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  const defaultProviderId = cleanText(env.MAPS_DEFAULT_PROVIDER, 'libre');
  const defaultProvider = getMapsProvider(defaultProviderId);
  const providerStatuses = enabled.map((id) => evaluateProviderEnv(id, env));

  return freeze({
    schemaVersion: MAPS_STARTUP_SCHEMA_VERSION,
    defaultProviderId: defaultProvider.id,
    enabledProviders: freeze(enabled),
    cacheTtlSeconds: Math.max(0, Number(env.MAPS_CACHE_TTL_SECONDS || 86400)),
    proxyUrl: cleanText(env.MAPS_PROVIDER_PROXY_URL),
    attributionUrl: cleanText(env.MAPS_ATTRIBUTION_URL),
    privacyUrl: cleanText(env.MAPS_PRIVACY_URL),
    providerStatuses: freeze(providerStatuses),
    readyProviders: freeze(
      providerStatuses
        .filter((status) => status.ready)
        .map((status) => status.providerId)
    ),
    allProviders: listMapsProviders(),
    startupChecks: freeze([
      'Do not expose server-only provider keys to browser bundles.',
      'Provider ids are adapter-local metadata, not canonical app ids.',
      'Normalize durable app records to name@geohash9 and optional TST fields.',
      'Render required attribution for every visible map surface.',
    ]),
  });
}
