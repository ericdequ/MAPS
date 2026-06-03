# MAPS UI

MAPS feeds provider-neutral data into Ricui map UI contracts.

## Boundary

- MAPS owns provider manifests, startup config, search templates, and normalized
  place records.
- Ricui owns map shell, legends, glyph hierarchy, panels, and action contracts.
- Product apps own workflows, permissions, and domain-specific behavior.

## Expected Flow

```txt
provider result -> normalizeMapsPlace -> optional TST -> Ricui map family -> app UI
```

Use `@ric/map-ui` for shared map family glyphs and actions. Use `@ric/maps` for
provider startup and place normalization.
