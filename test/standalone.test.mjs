// MAPS must function standalone — without the TST sibling/package. These assert
// the local fallback (used when TST is absent) emits the canonical provider
// shapes, and that the resolved bridge exports work either way (TST present:
// enhanced; absent: fallback).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  __local,
  defineProviderType,
  buildProviderRef,
  normalizeProviderId,
  resolveEmojiType,
  PROVIDER_TYPE_SCHEMA_VERSION,
} from '../src/tstBridge.js';

test('standalone fallback: defineProviderType emits the canonical type shape', () => {
  const p = __local.localDefineProviderType({ id: 'My Provider!', kind: 'open-data', defaultMode: 'default-free', capabilities: ['render'] });
  assert.equal(p.schemaVersion, 'tst-provider-type-v1');
  assert.equal(p.id, 'my-provider');
  assert.equal(p.kind, 'open-data');
  assert.ok(p.providerGlyph, 'has a kind glyph');
  assert.ok(Object.isFrozen(p) && Array.isArray(p.capabilities));
});

test('standalone fallback: buildProviderRef emits the canonical ref shape', () => {
  const ref = __local.localBuildProviderRef({ providerId: 'Apple', sourceId: 'apple:123', durable: true });
  assert.equal(ref.schemaVersion, 'tst-provider-ref-v1');
  assert.equal(ref.providerId, 'apple');
  assert.equal(ref.durable, true);
  assert.ok(ref.sourceId);
});

test('standalone fallback: normalizeProviderId slugifies + defaults', () => {
  assert.equal(__local.localNormalizeProviderId('Apple Maps'), 'apple-maps');
  assert.equal(__local.localNormalizeProviderId(''), 'unknown');
});

test('resolved bridge exports work whether TST is present or not', () => {
  assert.equal(typeof defineProviderType, 'function');
  assert.equal(typeof buildProviderRef, 'function');
  assert.equal(typeof normalizeProviderId, 'function');
  assert.equal(typeof resolveEmojiType, 'function'); // TST-backed or () => null
  assert.equal(defineProviderType({ id: 'x', kind: 'adapter' }).schemaVersion, PROVIDER_TYPE_SCHEMA_VERSION);
});
