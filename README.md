# MAPS

Reusable maps and places provider templates for RIC map products.

MAPS owns provider startup shape, environment-key manifests, normalized place
schema, and adapter templates. Product apps own UI workflows, consent prompts,
and domain behavior.

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

- `src/providerRegistry.js` - provider manifests for Libre, Mapbox, Google, and
  Apple.
- `src/placeSchema.js` - normalized provider-neutral place skeleton using
  `name@geohash9`.
- `src/providerAdapter.js` - shared adapter template for search requests,
  runtime config, and place normalization.
- `src/startup.js` - environment-driven startup checks and provider readiness.
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

## Provider Policy

- Free/open data is the default durable corpus path.
- Provider search ids stay source-local.
- Commercial provider search results should be transient unless the user
  confirms and normalizes a durable app record.
- Attribution must render anywhere maps or provider-sourced records are visible.
- Server-only provider keys must not be exposed through public env variables.
