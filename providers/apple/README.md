# Apple MapKit Provider

Optional Apple-native and MapKit JS provider template.

## Env

```txt
APPLE_MAPKIT_TEAM_ID=
APPLE_MAPKIT_KEY_ID=
APPLE_MAPKIT_PRIVATE_KEY=
NEXT_PUBLIC_APPLE_MAPKIT_TOKEN_ENDPOINT=/api/maps/apple-token
```

## Use

- iOS-native maps and local search.
- MapKit JS rendering when needed.
- Look Around experiments.
- Directions.

## Policy

Private MapKit key material stays server-side. Swift/Kotlin own native provider
APIs and permissions. Apple search ids stay provider-local; durable app records
normalize to `name@geohash9`.
