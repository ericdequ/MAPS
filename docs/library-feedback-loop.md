# Library Feedback Loop

When a product app uses `@ric/maps`, treat every integration as a chance to
make the template better.

## Required Note On Use

Add a short note in the consuming repo or handoff when you adopt a MAPS helper:

```txt
MAPS usage note:
- Helper/provider used:
- Product/runtime:
- What worked unchanged:
- What needed app-specific wrapping:
- Template improvement to upstream:
```

## Upstream Candidates

- New provider env names or safer key split patterns.
- Better default zoom, annotation, or viewport thresholds observed in real use.
- Renderer adapter contracts that work across MapLibre, Mapbox, Apple, Google,
  and native shells.
- Storage or attribution policy refinements discovered from provider launches.
- Normalization edge cases for place ids, coordinates, categories, photos, or
  links.

Keep app-only workflows out of MAPS. Upstream the reusable contract, not the
product-specific screen.
