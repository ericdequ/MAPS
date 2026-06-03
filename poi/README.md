# MAPS POI

POI code should normalize provider records into `maps-place-v1` before product
apps store, rank, render, or merge them.

## Schema

Import from `@ric/maps`:

```js
import { normalizeMapsPlace, buildPoiSourceManifest } from '@ric/maps';
```

Minimum place skeleton:

```txt
placeId: name@geohash9
canonicalKey: name@geohash9
provider: libre | mapbox | google | apple | custom
sourceId: provider-local id
placeType: normalized type slug
typeTokens: search/filter tokens
location.geohash9: spatial key
```

## Pipeline

1. Pull provider data through an adapter.
2. Keep provider ids as source-local metadata.
3. Normalize the durable app record with `normalizeMapsPlace`.
4. Append TST data in the consuming app or by using the sibling `../TST`
   package.
5. Render attribution and source policy with every provider-backed result.

## Starter Sources

- OSM Overpass for quick free POI experiments.
- Overture Places for durable bulk corpus generation.
- Overture Buildings for building shell/context experiments.
- PMTiles for offline or local-first map tiles.
- Commercial search providers for transient search or user-confirmed records.
