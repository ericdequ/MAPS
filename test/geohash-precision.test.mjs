import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GEOHASH_PRECISION,
  GEOHASH_MAX_PRECISION,
  GEOHASH_MIN_PRECISION,
  GEOHASH_PRECISION_INFO,
  geohashPrecisionInfo,
  precisionForRadiusMeters,
} from '../src/index.js';

test('precision constants + tiers', () => {
  assert.equal(GEOHASH_PRECISION, 10);
  assert.equal(GEOHASH_MAX_PRECISION, 12);
  assert.equal(GEOHASH_MIN_PRECISION.SEED, 2);
  assert.equal(GEOHASH_MIN_PRECISION.LOCATION, 4);
  assert.equal(GEOHASH_MIN_PRECISION.DEFAULT, 6);
});

test('geohashPrecisionInfo returns metadata or null', () => {
  assert.equal(geohashPrecisionInfo(6).radiusMeters, 1500);
  assert.equal(geohashPrecisionInfo(6).usage, 'block-level buckets');
  assert.equal(geohashPrecisionInfo(99), null);
});

test('precisionForRadiusMeters picks the finest precision whose cell still covers the radius', () => {
  // cell radius shrinks as precision rises; result = max p with radiusMeters[p] >= target
  assert.equal(precisionForRadiusMeters(1500), 6); // p6 cell = 1500m
  assert.equal(precisionForRadiusMeters(50), 8); // p8 cell = 50m
  assert.equal(precisionForRadiusMeters(5), 8); // p9 (4.7m) too small → p8 (50m) covers
  assert.equal(precisionForRadiusMeters(2_000_000), 1); // only p1 (5,000,000m) covers
  assert.equal(precisionForRadiusMeters(1000), 6); // p7 (160m) too small → p6 (1500m) covers
  assert.equal(precisionForRadiusMeters(0), GEOHASH_PRECISION); // invalid → default
});
