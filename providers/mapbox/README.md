# Mapbox Provider

Optional commercial render/search provider template.

## Env

```txt
NEXT_PUBLIC_MAPBOX_TOKEN=
MAPBOX_ACCESS_TOKEN=
MAPBOX_STYLE_URL=
```

## Use

- Vector map rendering.
- Satellite and terrain tests.
- Geocoding and category search.
- Optional routing or directions experiments.

## Policy

Use a scoped public token for browser rendering and a separate server token for
backend calls. Review Mapbox terms before storing provider search results.
Provider ids remain adapter-local; app identity stays `name@geohash9`.
