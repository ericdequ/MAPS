const MAX_GAP_MS = 12 * 60 * 60 * 1000;
const MAX_STOPS = 20;

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export function mapsRouteTimeToMs(time) {
  if (!time) return null;
  if (typeof time === 'object' && time.seconds != null) {
    return Number(time.seconds) * 1000;
  }
  if (time instanceof Date) return time.getTime();
  if (typeof time === 'string') {
    const ms = Date.parse(time);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

export function buildMapsRouteSegments(items = [], {
  nowMs = Date.now(),
  maxGapMs = MAX_GAP_MS,
  maxStops = MAX_STOPS,
} = {}) {
  const stops = [];
  for (const item of Array.isArray(items) ? items : []) {
    const lat = toFiniteNumber(
      item?.lat ?? item?.location?.lat ?? item?.place?.lat ?? item?.bar?.lat
    );
    const lng = toFiniteNumber(
      item?.lng ??
        item?.lon ??
        item?.location?.lng ??
        item?.place?.lng ??
        item?.bar?.lng
    );
    const ms = mapsRouteTimeToMs(item?.time ?? item?.startsAt ?? item?.at);
    if (lat == null || lng == null || !Number.isFinite(ms) || ms < nowMs) {
      continue;
    }
    stops.push({ lat, lng, ms, item });
  }

  if (stops.length < 2) return [];
  stops.sort((left, right) => left.ms - right.ms);

  const segments = [];
  let current = { coords: [], times: [], items: [] };
  const limit = Math.max(2, Number(maxStops) || MAX_STOPS);

  for (const stop of stops.slice(0, limit * 4)) {
    if (current.coords.length === 0) {
      current.coords.push([stop.lng, stop.lat]);
      current.times.push(stop.ms);
      current.items.push(stop.item);
      continue;
    }

    const previousMs = current.times[current.times.length - 1];
    if (stop.ms - previousMs > maxGapMs) {
      if (current.coords.length >= 2) segments.push(current);
      current = {
        coords: [[stop.lng, stop.lat]],
        times: [stop.ms],
        items: [stop.item],
      };
      continue;
    }

    current.coords.push([stop.lng, stop.lat]);
    current.times.push(stop.ms);
    current.items.push(stop.item);
  }

  if (current.coords.length >= 2) segments.push(current);
  return segments;
}

export function buildMapsRouteGeoJson(segments = []) {
  return Object.freeze({
    type: 'FeatureCollection',
    features: [
      ...segments.map((segment, segmentIndex) => ({
        type: 'Feature',
        properties: {
          segmentIndex,
          stopCount: segment.coords.length,
        },
        geometry: { type: 'LineString', coordinates: segment.coords },
      })),
      ...segments.flatMap((segment, segmentIndex) =>
        segment.coords.map((coordinates, stopIndex) => ({
          type: 'Feature',
          properties: {
            segmentIndex,
            stopIndex,
            time: segment.times[stopIndex],
          },
          geometry: { type: 'Point', coordinates },
        }))
      ),
    ],
  });
}
