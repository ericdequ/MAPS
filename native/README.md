# MAPS Native

Native provider code belongs at the platform edge.

## Boundary

- Swift/Kotlin own Apple, Google, platform permissions, camera/location
  permission prompts, and native map surfaces.
- MAPS owns provider manifest shape and normalized data contracts.
- React/Next owns user intent, consent copy, and product workflow.

## Template Responsibilities

- Expose provider availability before requesting permissions.
- Return provider-local ids and raw metadata only through adapter fields.
- Normalize selected places into `name@geohash9`.
- Keep exact durable GPS, provider tokens, and private media ids out of logs.
- Do not request location permissions during app bootstrap.
