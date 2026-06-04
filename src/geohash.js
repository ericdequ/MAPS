const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function toFiniteCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function encodeMapsGeohash(lat, lng, precision = 9) {
  const latitude = toFiniteCoordinate(lat);
  const longitude = toFiniteCoordinate(lng);
  if (latitude == null || longitude == null) return '';
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return '';
  }

  const length = Math.max(1, Math.min(Number(precision) || 9, 12));
  let evenBit = true;
  let bit = 0;
  let ch = 0;
  let geohash = '';
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < length) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (longitude >= mid) {
        ch = (ch << 1) + 1;
        lngMin = mid;
      } else {
        ch <<= 1;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch = (ch << 1) + 1;
        latMin = mid;
      } else {
        ch <<= 1;
        latMax = mid;
      }
    }

    evenBit = !evenBit;
    if (bit < 4) {
      bit += 1;
      continue;
    }
    geohash += BASE32[ch];
    bit = 0;
    ch = 0;
  }

  return geohash;
}
