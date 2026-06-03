# Google Provider

Optional Google Maps, Places, Street View, and Directions provider template.

## Env

```txt
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=
```

## Use

- Google map rendering when a product explicitly needs it.
- Places text/nearby search.
- Place details and photos.
- Street View experiments.
- Directions.

## Policy

Prefer server-side Places keys. Google place ids are source-local metadata, not
universal ids. Durable records should come from user-confirmed normalization or
separately licensed sources, then use `name@geohash9`.
