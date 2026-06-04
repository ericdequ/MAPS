export const MAPS_RUNTIME_POLICY_VERSION = 'maps-runtime-policy-v1';

export const MAPS_RUNTIME_THRESHOLDS = Object.freeze({
  minSinglePlaceZoom: 16,
  richOverlayMinZoom: 15,
  socialOverlayMinZoom: 0,
  allContextPinsMinZoom: 13,
  generalAppleRenderMinZoom: 10,
  appleSearchMinZoom: 11,
  appleSearchDebounceMs: 450,
  appleSearchResultLimit: 80,
  maxDesktopAnnotations: 320,
  maxMobileAnnotations: 180,
  viewportPaddingRatio: 0.65,
  idleViewportUpdateMs: 300,
  fetchBoundsOverscanRatio: 0.4,
  motionMarkerRenderLimit: 48,
  visitedGeohashSyncIntervalMs: 15000,
});

export const MAPS_DEFAULT_CAMERA = Object.freeze({
  latitude: 39.5,
  longitude: -98.35,
  zoom: 4,
  pitch: 55,
  bearing: -17,
});

export function buildMapsRuntimePolicy({
  provider = 'libre',
  isMobile = false,
  lowEnd = false,
  overrides = {},
} = {}) {
  const thresholds = Object.freeze({
    ...MAPS_RUNTIME_THRESHOLDS,
    ...overrides,
  });
  return Object.freeze({
    schemaVersion: MAPS_RUNTIME_POLICY_VERSION,
    provider,
    rendererMode: lowEnd ? 'flat-low-end' : 'full',
    isMobile: Boolean(isMobile),
    camera: MAPS_DEFAULT_CAMERA,
    thresholds,
    limits: Object.freeze({
      maxAnnotations: isMobile
        ? thresholds.maxMobileAnnotations
        : thresholds.maxDesktopAnnotations,
      appleSearchResultLimit: thresholds.appleSearchResultLimit,
      motionMarkerRenderLimit: thresholds.motionMarkerRenderLimit,
    }),
    updateNote:
      'When a consuming app tunes these values in production, upstream the learned defaults into @ric/maps.',
  });
}
