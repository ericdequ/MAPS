// =============================================================================
// MAPS ⇄ TST bridge — standalone, enhanced by TST when present
// =============================================================================
// MAPS functions on its own. TST owns the canonical provider-type / provider-ref
// contracts and the emoji-type resolver; when TST is available — as the
// installed `@ric/tst` package OR as a sibling `../../TST` repo in the eco
// layout — MAPS uses TST's versions so provider shapes + emoji types stay
// consistent across the ecosystem. When neither is present, MAPS falls back to
// a self-contained local copy of the provider contract (and skips the optional
// emoji-type enrichment). No hard dependency on a sibling's source path.
//
// Pattern: every eco repo should work alone, but get richer when a sibling
// exists. This is that seam for MAPS→TST.
// =============================================================================

// --- optional TST load: package first, then dev sibling, then local ---------
let tst = null;
for (const spec of ['@ric/tst', '../../TST/src/index.js']) {
  try {
    // eslint-disable-next-line no-await-in-loop
    tst = await import(spec);
    break;
  } catch {
    /* not available via this spec — try the next, then fall back */
  }
}

/** True when MAPS is running with TST's shared contracts available. */
export const TST_PRESENT = Boolean(tst?.defineTstProviderType);

// --- local fallback (self-contained copy of TST's provider contract) --------
// Mirrors TST/src/providerTypes.js so standalone MAPS emits the same shapes.
export const PROVIDER_TYPE_SCHEMA_VERSION = 'tst-provider-type-v1';
const PROVIDER_REF_SCHEMA_VERSION = 'tst-provider-ref-v1';
const KIND_EMOJI = Object.freeze({
  adapter: '\u{1F50C}',
  'open-data': '\u{1F310}',
  'commercial-render-search': '\u{1F50E}',
  'commercial-search': '\u{1F50E}',
  'optional-render-provider': '\u{1F5FA}️',
  'optional-search-provider': '\u{1F50E}',
  'native-and-browser-render-search': '\u{1F4F1}',
  'ios-native-first': '\u{1F4F1}',
  'default-free': '\u{1F193}',
});

const freeze = (v) => Object.freeze(v);
const clean = (v, f = '') => String(v ?? f).replace(/\s+/g, ' ').trim();
const list = (v = []) =>
  freeze([...new Set((Array.isArray(v) ? v : [v]).map((x) => clean(x)).filter(Boolean))]);

function localNormalizeProviderId(value = '', fallback = 'unknown') {
  return clean(value, fallback).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}
const normKind = (v = '', f = 'adapter') =>
  clean(v, f).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || f;
const kindEmoji = (v = '', f = 'adapter') => KIND_EMOJI[normKind(v, f)] || KIND_EMOJI[f] || KIND_EMOJI.adapter;

function localDefineProviderType(opts = {}) {
  const { id, label, kind = 'adapter', mode = 'optional', defaultMode = mode, requiredEnv = [], optionalEnv = [], publicEnv = [], capabilities = [], durableStorage = 'adapter-local', sourcePolicy = '', attribution = [], styleTemplates = [], searchTemplates = [], startupNotes = [] } = opts;
  const providerId = localNormalizeProviderId(id);
  const providerKind = normKind(kind);
  const providerMode = normKind(defaultMode || mode, 'optional');
  const providerGlyph = kindEmoji(providerKind);
  const modeGlyph = kindEmoji(providerMode);
  return freeze({
    schemaVersion: PROVIDER_TYPE_SCHEMA_VERSION,
    id: providerId, providerId,
    label: clean(label, providerId),
    kind: providerKind, providerKind, providerGlyph,
    unicodeType: providerGlyph, unicodeTypes: list([providerGlyph, modeGlyph]),
    defaultMode: providerMode, mode: providerMode, modeGlyph,
    requiredEnv: list(requiredEnv), optionalEnv: list(optionalEnv), publicEnv: list(publicEnv),
    capabilities: list(capabilities),
    durableStorage: clean(durableStorage, 'adapter-local'),
    sourcePolicy: clean(sourcePolicy, 'Provider ids stay adapter-local; canonical records use TST identity.'),
    attribution: list(attribution), styleTemplates: list(styleTemplates),
    searchTemplates: list(searchTemplates), startupNotes: list(startupNotes),
  });
}

function localBuildProviderRef(opts = {}) {
  const { providerId, sourceId, providerKind = 'adapter', sourcePolicy = '', durable = false, attribution = [] } = opts;
  const id = localNormalizeProviderId(providerId);
  const kind = normKind(providerKind);
  const providerGlyph = kindEmoji(kind);
  return freeze({
    schemaVersion: PROVIDER_REF_SCHEMA_VERSION,
    providerId: id, providerKind: kind, providerGlyph,
    unicodeType: providerGlyph, unicodeTypes: list([providerGlyph]),
    sourceId: clean(sourceId, `${id}:unmapped`),
    durable: Boolean(durable),
    sourcePolicy: clean(sourcePolicy, 'Provider ids stay adapter-local; canonical records use TST identity.'),
    attribution: list(attribution),
  });
}

// --- resolved exports: TST when present, local fallback otherwise -----------
export const defineProviderType = tst?.defineTstProviderType ?? localDefineProviderType;
export const buildProviderRef = tst?.buildTstProviderRef ?? localBuildProviderRef;
export const normalizeProviderId = tst?.normalizeTstProviderId ?? localNormalizeProviderId;

// Emoji-type enrichment is TST-owned; standalone MAPS degrades gracefully
// (no emoji type) rather than carrying TST's full emoji catalog.
export const resolveEmojiType = tst?.resolveTstEmojiType ?? (() => null);
export const expandUnicodeTypes = tst?.expandTstUnicodeTypes ?? ((values = []) => list(values));

// Exposed for tests: prove the local fallback emits valid shapes without TST.
export const __local = { localDefineProviderType, localBuildProviderRef, localNormalizeProviderId };
