// =============================================================================
// MAPS — geohash precision metadata
// =============================================================================
// Reusable reference data: what each geohash precision (1–12) means in terms of
// cell radius + typical usage, plus the standard min-precision tiers. Pure
// constants — no dependencies — lifted from BEV's domain/geo so any geo product
// shares one precision vocabulary (caching tiers, seed coarseness, indoor vs
// metro). Pairs with TST's space level-ladder (same scale, Go side).
// =============================================================================

const freeze = Object.freeze;

/** Default working precision + the hard maximum geohashes go to. */
export const GEOHASH_PRECISION = 10;
export const GEOHASH_MAX_PRECISION = 12;

/** Standard coarseness tiers. SEED = broadest backfill; LOCATION = device area. */
export const GEOHASH_MIN_PRECISION = freeze({
  DEFAULT: 6,
  LOCATION: 4,
  SEED: 2,
});

/** Approximate cell radius (meters) + intended usage per precision. */
export const GEOHASH_PRECISION_INFO = freeze({
  1: { radiusMeters: 5000000, usage: 'server' },
  2: { radiusMeters: 1250000, usage: 'regional grouping' },
  3: { radiusMeters: 156000, usage: 'state or region grouping' },
  4: { radiusMeters: 22000, usage: 'city-level caching and discovery' },
  5: { radiusMeters: 3600, usage: 'neighborhood-level fetches' },
  6: { radiusMeters: 1500, usage: 'block-level buckets' },
  7: { radiusMeters: 160, usage: 'street-level proximity' },
  8: { radiusMeters: 50, usage: 'venue-level proximity' },
  9: { radiusMeters: 4.7, usage: 'indoor precision' },
  10: { radiusMeters: 1.22, usage: 'device-level precision' },
});

/** Metadata for a precision (clamped to the known 1–10 table), or null. */
export function geohashPrecisionInfo(precision) {
  return GEOHASH_PRECISION_INFO[precision] ?? null;
}

/**
 * The finest precision whose cell radius still covers `meters` — i.e. pick a
 * geohash precision for a desired search/cluster radius. Larger radius → coarser
 * (smaller) precision. Clamps to the table's bounds.
 * @param {number} meters
 * @returns {number} precision 1–10
 */
export function precisionForRadiusMeters(meters) {
  const target = Number(meters);
  if (!Number.isFinite(target) || target <= 0) return GEOHASH_PRECISION;
  let best = 1;
  for (const [p, info] of Object.entries(GEOHASH_PRECISION_INFO)) {
    if (info.radiusMeters >= target) best = Number(p);
  }
  return best;
}
