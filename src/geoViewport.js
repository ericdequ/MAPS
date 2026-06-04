import { encodeMapsGeohash, toFiniteCoordinate } from './geohash.js';

const GEOHASH_RE = /^[0-9bcdefghjkmnpqrstuvwxyz]{1,12}$/i;
const ZOOM_TO_PRECISION = Object.freeze([
  2, 2, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 8, 8,
]);
const ZOOM_TO_CLUSTER_PRECISION = Object.freeze([
  2, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 8, 8, 8, 8,
]);

const toFiniteNumber = (...values) => {
  for (const value of values) {
    const resolved = typeof value === 'function' ? value() : value;
    const number = Number(resolved);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

export const normalizeMapsGeohashText = (value) => {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return GEOHASH_RE.test(text) ? text : '';
};

export function clampMapsPrecision(value, { min = 2, max = 8 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
}

export function getMapsPrecisionForZoom(zoomLevel, options = {}) {
  const zoom = Number.isFinite(Number(zoomLevel))
    ? Math.max(0, Math.floor(Number(zoomLevel)))
    : 0;
  const raw =
    ZOOM_TO_PRECISION[Math.min(zoom, ZOOM_TO_PRECISION.length - 1)] || 2;
  return clampMapsPrecision(raw, options);
}

export function getMapsClusterPrecisionForZoom(zoomLevel, options = {}) {
  const zoom = Number.isFinite(Number(zoomLevel))
    ? Math.max(0, Math.floor(Number(zoomLevel)))
    : 0;
  const raw =
    ZOOM_TO_CLUSTER_PRECISION[
      Math.min(zoom, ZOOM_TO_CLUSTER_PRECISION.length - 1)
    ] || 2;
  return clampMapsPrecision(raw, options);
}

export function buildMapsClusterParams(mapView = {}) {
  const zoomLevel = Number(mapView.zoom || 0);
  const precision = getMapsPrecisionForZoom(zoomLevel);
  const clusterPrecision = getMapsClusterPrecisionForZoom(zoomLevel);
  const center = mapView.center || mapView;
  const prefix = encodeMapsGeohash(center?.lat, center?.lng, precision);
  return Object.freeze({ zoomLevel, precision, clusterPrecision, prefix });
}

export function getMapsClusterLabel(entry = {}, zoomLevel = 0, geohash = '') {
  if (zoomLevel <= 4 && entry.country) return String(entry.country).toUpperCase();
  if (zoomLevel <= 6 && entry.state) return String(entry.state).toUpperCase();
  if (zoomLevel <= 8 && entry.city) {
    return entry.state ? `${entry.city}, ${entry.state}` : String(entry.city);
  }
  if (entry.state) return String(entry.state).toUpperCase();
  return normalizeMapsGeohashText(geohash).toUpperCase() || 'LOC';
}

export function getMapsClusterRadius(zoomLevel = 0) {
  const zoom = Math.max(0, Math.floor(Number(zoomLevel) || 0));
  const radiusByZoom = {
    0: 100000,
    1: 80000,
    2: 60000,
    3: 50000,
    4: 25000,
    5: 12000,
    6: 6000,
    7: 3000,
    8: 1500,
    9: 800,
    10: 400,
  };
  return radiusByZoom[zoom] || 200;
}

export function formatMapsClusterCount(count = 0) {
  const number = Math.max(0, Number(count) || 0);
  if (number >= 1000) return '1k+';
  if (number >= 500) return '500+';
  if (number >= 100) return '100+';
  if (number >= 50) return '50+';
  if (number >= 10) return '10+';
  return String(number);
}

export function parseMapsViewportBBox(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    const north = toFiniteNumber(value.north, value.maxLat, value.top);
    const south = toFiniteNumber(value.south, value.minLat, value.bottom);
    const east = toFiniteNumber(value.east, value.maxLng, value.right);
    const west = toFiniteNumber(value.west, value.minLng, value.left);
    if (
      [north, south, east, west].every((entry) => Number.isFinite(entry)) &&
      north >= south
    ) {
      return Object.freeze({ north, south, east, west });
    }
    return null;
  }

  const parts = String(value)
    .split(',')
    .map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => !Number.isFinite(item))) {
    return null;
  }
  const [west, south, east, north] = parts;
  if (north < south) return null;
  return Object.freeze({ north, south, east, west });
}

export function wrapMapsLongitude(value) {
  const longitude = toFiniteCoordinate(value);
  if (longitude == null) return 0;
  let next = longitude;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
}

export function normalizeMapsCameraCenter(center = {}) {
  const lat = toFiniteCoordinate(center.lat ?? center.latitude);
  const lng = toFiniteCoordinate(center.lng ?? center.lon ?? center.longitude);
  if (lat == null || lng == null) return null;
  return Object.freeze({
    lat: Math.max(-90, Math.min(90, lat)),
    lng: wrapMapsLongitude(lng),
  });
}

function getFallbackViewportSpan(zoom) {
  const safeZoom = Number(zoom);
  if (!Number.isFinite(safeZoom)) return { latSpan: 0.24, lngSpan: 0.24 };
  if (safeZoom >= 16) return { latSpan: 0.018, lngSpan: 0.024 };
  if (safeZoom >= 15) return { latSpan: 0.034, lngSpan: 0.05 };
  if (safeZoom >= 14) return { latSpan: 0.065, lngSpan: 0.095 };
  if (safeZoom >= 13) return { latSpan: 0.125, lngSpan: 0.18 };
  if (safeZoom >= 12) return { latSpan: 0.24, lngSpan: 0.34 };
  return { latSpan: 0.48, lngSpan: 0.66 };
}

export function estimateMapsViewportBounds({
  center,
  targetZoom,
  currentBounds,
  currentZoom,
} = {}) {
  const safeCenter = normalizeMapsCameraCenter(center);
  if (!safeCenter) return null;

  const bounds = parseMapsViewportBBox(currentBounds);
  const safeCurrentZoom = Number(currentZoom);
  const safeTargetZoom = Number(targetZoom);
  let latSpan = null;
  let lngSpan = null;

  if (
    bounds &&
    Number.isFinite(safeCurrentZoom) &&
    Number.isFinite(safeTargetZoom)
  ) {
    const zoomScale = 2 ** (safeCurrentZoom - safeTargetZoom);
    latSpan = Math.max(0.01, Math.abs(bounds.north - bounds.south) * zoomScale);
    lngSpan = Math.max(0.01, Math.abs(bounds.east - bounds.west) * zoomScale);
  } else {
    const fallback = getFallbackViewportSpan(safeTargetZoom);
    latSpan = fallback.latSpan;
    lngSpan = fallback.lngSpan;
  }

  return Object.freeze({
    north: Math.min(90, safeCenter.lat + latSpan / 2),
    south: Math.max(-90, safeCenter.lat - latSpan / 2),
    east: wrapMapsLongitude(safeCenter.lng + lngSpan / 2),
    west: wrapMapsLongitude(safeCenter.lng - lngSpan / 2),
  });
}

export function expandMapsBounds(bounds, ratio = 0.32) {
  const parsed = parseMapsViewportBBox(bounds);
  if (!parsed) return null;
  const padRatio = Math.max(0, Number(ratio) || 0);
  const latPad = Math.abs(parsed.north - parsed.south) * padRatio;
  const lngPad = Math.abs(parsed.east - parsed.west) * padRatio;
  return Object.freeze({
    north: Math.min(90, parsed.north + latPad),
    south: Math.max(-90, parsed.south - latPad),
    east: wrapMapsLongitude(parsed.east + lngPad),
    west: wrapMapsLongitude(parsed.west - lngPad),
  });
}

export function isMapsLatLngInBounds(lat, lng, bounds) {
  const latitude = toFiniteCoordinate(lat);
  const longitude = toFiniteCoordinate(lng);
  const parsed = parseMapsViewportBBox(bounds);
  if (latitude == null || longitude == null || !parsed) return false;
  const withinLat = latitude >= parsed.south && latitude <= parsed.north;
  const withinLng =
    parsed.west <= parsed.east
      ? longitude >= parsed.west && longitude <= parsed.east
      : longitude >= parsed.west || longitude <= parsed.east;
  return withinLat && withinLng;
}
