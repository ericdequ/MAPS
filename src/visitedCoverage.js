import { encodeMapsGeohash } from './geohash.js';
import { clampMapsPrecision, normalizeMapsGeohashText } from './geoViewport.js';

export const MAPS_VISITED_COVERAGE_VERSION = 'maps-visited-coverage-v1';

export const MAPS_VISITED_DEFAULTS = Object.freeze({
  enabled: false,
  restrict: false,
  allowNeighbors: true,
  precision: 4,
  maxEntries: 160,
  trackingMode: 'center',
  tree: false,
});

const TREE_MIN_PRECISION = 4;

const readBoolean = (value, fallback = false) => {
  if (value == null) return fallback;
  return value === true || value === '1' || value === 'true';
};

const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeTrackingMode = (value) => {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (text === 'location' || text === 'center' || text === 'both') return text;
  return 'center';
};

export function buildMapsVisitedSettings(config = {}) {
  return Object.freeze({
    schemaVersion: MAPS_VISITED_COVERAGE_VERSION,
    enabled: readBoolean(config.enabled, MAPS_VISITED_DEFAULTS.enabled),
    restrict: readBoolean(config.restrict, MAPS_VISITED_DEFAULTS.restrict),
    allowNeighbors: readBoolean(
      config.allowNeighbors,
      MAPS_VISITED_DEFAULTS.allowNeighbors
    ),
    precision: clampMapsPrecision(config.precision, { min: 2, max: 6 }),
    maxEntries: readPositiveInt(config.maxEntries, MAPS_VISITED_DEFAULTS.maxEntries),
    trackingMode: normalizeTrackingMode(config.trackingMode),
    tree: readBoolean(config.tree, MAPS_VISITED_DEFAULTS.tree),
  });
}

export function shouldTrackMapsVisitedGeohash(trackingMode, source) {
  if (!trackingMode || !source) return false;
  if (trackingMode === 'both') return true;
  return trackingMode === source;
}

export function buildMapsVisitedCandidates(coords, precision = 4, tree = false) {
  if (!coords) return [];
  const targetPrecision = clampMapsPrecision(precision, { min: 2, max: 6 });
  const encoded = encodeMapsGeohash(coords.lat, coords.lng, targetPrecision);
  const trimmed = normalizeMapsGeohashText(encoded).slice(0, targetPrecision);
  if (!trimmed) return [];
  if (!tree) return [trimmed];

  const start = Math.min(TREE_MIN_PRECISION, trimmed.length);
  const candidates = [];
  for (let len = start; len <= trimmed.length; len += 1) {
    candidates.push(trimmed.slice(0, len));
  }
  return candidates;
}

export function mergeMapsVisitedGeohashes(prev, candidates, {
  maxEntries = MAPS_VISITED_DEFAULTS.maxEntries,
  nowMs = Date.now(),
} = {}) {
  const previous = prev instanceof Map ? prev : new Map();
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { next: previous, changed: false };
  }

  const next = new Map(previous);
  let changed = false;
  for (const candidate of candidates) {
    const normalized = normalizeMapsGeohashText(candidate);
    if (!normalized || next.has(normalized)) continue;
    next.set(normalized, nowMs);
    changed = true;
  }
  if (!changed) return { next: previous, changed: false };

  if (Number.isFinite(maxEntries) && maxEntries > 0 && next.size > maxEntries) {
    const sorted = Array.from(next.entries()).sort((a, b) => a[1] - b[1]);
    for (const [key] of sorted.slice(0, next.size - maxEntries)) {
      next.delete(key);
    }
  }

  return { next, changed: true };
}

export function isMapsGeohashVisited(geohash, visited, precision = 4, tree = false) {
  const normalized = normalizeMapsGeohashText(geohash);
  if (!normalized || !(visited instanceof Map) || visited.size === 0) {
    return false;
  }
  if (visited.has(normalized)) return true;
  if (!tree) return false;

  const maxLength = Math.min(
    normalized.length,
    clampMapsPrecision(precision, { min: 2, max: 6 })
  );
  for (let len = maxLength - 1; len >= TREE_MIN_PRECISION; len -= 1) {
    if (visited.has(normalized.slice(0, len))) return true;
  }
  return false;
}
