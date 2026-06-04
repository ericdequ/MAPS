# MAPS

Reusable maps and places provider templates for RIC map products.

MAPS owns map-specific provider startup shape, environment-key manifests,
normalized place schema, and adapter templates. Product apps own UI workflows,
consent prompts, and domain behavior.

**Standalone, enhanced by TST.** MAPS works on its own with a self-contained
copy of the provider-type / provider-ref contract. When TST is available — the
installed `@ric/tst` package, or a sibling `../../TST` repo in the eco layout —
`src/tstBridge.js` transparently uses TST's canonical contracts + emoji-type
resolver instead, so shapes stay consistent across the ecosystem. Without TST,
the optional emoji-type enrichment simply degrades to none. No hard dependency
on a sibling's source path.

## Package

```bash
npm test
```

```js
import {
  buildMapsStartupConfig,
  createMapsProviderAdapter,
  normalizeMapsPlace,
} from '@ric/maps';
```

## Layout

- `src/providerRegistry.js` - TST-backed provider manifests for Libre, Mapbox,
  Google, and Apple.
- `src/blogDatasets.js` - Blogs dataset/provider/source catalog, including
  specialized layers such as Magick's Map of Miracles.
- `src/placeSchema.js` - normalized provider-neutral place skeleton using
  `name@geohash9`.
- `src/mapPin.js` - provider-neutral `maps-pin-v1` records for map renderers.
- `src/geoViewport.js` - dependency-free viewport, cluster, precision, and
  camera-bound helpers.
- `src/runtimePolicy.js` - shared renderer budgets and mobile/low-end policy.
- `src/visitedCoverage.js` - pure visited-geohash tracking helpers; apps own
  persistence.
- `src/routeLine.js` - provider-neutral route/crawl line segment and GeoJSON
  helpers.
- `src/providerRoutes.js` - provider comparison route normalization templates.
- `src/providerAdapter.js` - shared adapter template for search requests,
  runtime config, and place normalization.
- `src/startup.js` - environment-driven startup checks and provider readiness.
- `docs/places-maps-template.md` - notes on the valuable map code lifted from
  `stuff/` and what intentionally stayed app-specific.
- `docs/library-feedback-loop.md` - required adoption note so consuming apps
  upstream reusable improvements into MAPS.
- `providers/` - provider-specific notes and env requirements.
- `poi/` - POI pipeline and source schema notes.
- `native/` - Swift/Kotlin/native provider boundary notes.
- `ui/` - connection point to Ricui map UI contracts.
- `TST/` - pointer to the standalone `../TST` repo.

## Startup

Copy `.env.example` into the consuming app and fill only the providers you
intend to enable.

```txt
MAPS_DEFAULT_PROVIDER=libre
MAPS_ENABLED_PROVIDERS=libre,mapbox,google,apple
```

Libre is the free default. Mapbox, Google, and Apple are optional provider
adapters with stricter token, attribution, and storage policies.

## Canonical Place Rule

Provider ids are adapter-local metadata. Canonical app identity is:

```txt
name@geohash9
```

Temporal and typed records should use the sibling TST contract:

```txt
name@geohash9[@time][#type]
```

Examples:

```txt
sports-tap@djn4k5e7u
city-diamond@djn4k5e7u#baseball-field
album-release@djn4k5e7u@2026-06-03#music-post
```

MAPS provider manifests, provider refs, and normalized places expose the TST
unicode type fields too. Provider kind glyphs come from TST provider contracts;
place/activity glyphs come from the TST emoji type map.

## Provider Policy

- Free/open data is the default durable corpus path.
- Provider search ids stay source-local.
- Commercial provider search results should be transient unless the user
  confirms and normalizes a durable app record.
- Attribution must render anywhere maps or provider-sourced records are visible.
- Server-only provider keys must not be exposed through public env variables.

## Blogs Catalog

`src/blogDatasets.js` is the shared contract between the Blogs manager repo and
MAPS. It lists the eight blog map datasets, their default render provider,
optional provider chain, upstream POI source manifests, cache mode, attribution,
and safety notes.

The catalog intentionally separates:

- Render/search providers: `libre`, `mapbox`, `google`, `apple`.
- Upstream data sources: OpenStreetMap, US Census, iNaturalist, and site-owned
  markdown fixtures.
- Portable identity: normalized MAPS places using `name@geohash9`.

Magick's `magick:map-of-miracles` layer is modeled as a specialized layer on top
of `magick:sacred-geography`. It can use current sacred geography seeds now, but
markdown stories should only become map records after explicit coordinates or a
curated place anchor are present.
