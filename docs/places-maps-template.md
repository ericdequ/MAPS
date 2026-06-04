# Places Maps Template

This template is distilled from the BEV map archives in `stuff/`. Keep product
workflow code in the consuming app and keep MAPS focused on portable contracts.

## Lifted Contracts

- Provider comparison routes preserve query params and normalize the provider
  into `/Maps?provider=<id>`.
- Map pins render from a provider-neutral `maps-pin-v1` shape, with personal and
  social overlays attached as optional metadata.
- Canonical durable identity is always `name@geohash9`; provider ids remain
  source-local aliases.
- Apple and Mapbox search payloads are transient unless the user confirms a
  normalized app record or a separately licensed source backs the data.
- Open data providers are the durable corpus path: OSM, Overture, PMTiles, and
  app-owned public shards.

## Source Material Checked

- `stuff/pages/Map/**` for route and orchestration contracts.
- `stuff/docs/maps/**` for provider roles, data policy, testing, and roadmap.
- `stuff/suspected-deletes/lib/apple/**` for Apple token and place shaping.
- `stuff/suspected-deletes/src/lib/server/places/adapters/**` for storage
  policy and transient provider adapter behavior.
- `stuff/suspected-deletes/src/lib/map/**` for zoom bands and map thresholds.
- `stuff/suspected-deletes/src/pages/MapMB/**` for provider comparison routes.
- `stuff/suspected-deletes/src/components/MapMB/**` for Apple MapKit runtime,
  annotation, search, and provider debug contracts.
- `stuff/suspected-deletes/src/lib/mapbox/**` for Mapbox env, palette, layer,
  marker-state, and route-line templates.
- `stuff/suspected-deletes/src/lib/geo/**`, `src/lib/utils/geohash.js`, and
  `src/lib/utils/visited-geohashes.js` for dependency-free viewport, zoom
  precision, cluster, and visited-coverage contracts.

## What Stayed Out

- React page shells, BEV contexts, TanStack cache wiring, Firebase hydration,
  and Capacitor permission prompts.
- Provider-specific UI widgets such as Apple bar preview cards.
- Active app routes and runtime flags.

Those pieces belong in product apps. MAPS should feed them manifests, startup
status, normalized places, map pins, token helper contracts, and route templates.
