# Libre Provider

Default free provider template for MapLibre, OSM, Overture, and PMTiles.

## Env

```txt
NEXT_PUBLIC_MAPLIBRE_STYLE_URL=
OSM_OVERPASS_ENDPOINT=https://overpass-api.de/api/interpreter
OVERTURE_PLACES_PATH=
OVERTURE_BUILDINGS_PATH=
PMTILES_BASE_URL=
```

## Use

- Public map rendering with MapLibre-compatible styles.
- OSM Overpass for early POI search.
- Overture Places/Buildings for durable corpus and building layers.
- PMTiles for local-first or offline map surfaces.

## Policy

Libre is the preferred default for free durable data. Always render required
attribution and keep source ids adapter-local while normalizing app ids to
`name@geohash9`.
