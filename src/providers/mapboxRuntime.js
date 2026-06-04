export const MAPBOX_RUNTIME_TEMPLATE_VERSION = 'maps-mapbox-runtime-v1';

export const MAPBOX_BRAND_COLORS = Object.freeze({
  background: '#0b0c14',
  water: '#121523',
  land: '#0e0f18',
  roadsMajor: '#262a3d',
  roadsMinor: '#1a1c29',
  roadsHighlight: '#a855f7',
  labelsPrimary: '#e9d5ff',
  labelsSecondary: '#a5a8c0',
  buildings: '#15172a',
  buildings3D: '#22253d',
  parks: '#0f1f15',
  indigoAura: '#795CED',
  accentPink: '#ec4899',
  accentPurple: '#a855f7',
});

export const MAPBOX_PIN_COLORS = Object.freeze({
  friend: '#22c55e',
  meetup: '#3b82f6',
  both: '#14b8a6',
  live: '#ec4899',
  visited: '#f97316',
  liked: '#ef4444',
  likedVisited: '#f43f5e',
  memory: '#06b6d4',
  base: '#a855f7',
  selected: '#ffffff',
  halo: 'rgba(255,255,255,0.92)',
});

export const MAPBOX_LAYER_IDS = Object.freeze({
  source: 'maps-places-source',
  heatmap: 'maps-places-heatmap',
  glow: 'maps-places-glow',
  dots: 'maps-places-dots',
  labels: 'maps-places-labels',
  beerIcon: 'maps-beer',
  routeSource: 'maps-route-source',
  routeLine: 'maps-route-line',
  routeStops: 'maps-route-stops',
});

export const MAPBOX_HEATMAP_RAMP = Object.freeze([
  0,
  'rgba(121, 92, 237, 0)',
  0.16,
  'rgba(121, 92, 237, 0.24)',
  0.34,
  'rgba(121, 92, 237, 0.44)',
  0.56,
  'rgba(121, 92, 237, 0.66)',
  0.78,
  'rgba(153, 129, 244, 0.84)',
  0.92,
  'rgba(191, 177, 249, 0.95)',
  1,
  'rgba(227, 220, 255, 1)',
]);

export function resolveMapsPinColor(pin = {}, { isSelected = false } = {}) {
  if (isSelected) return MAPBOX_PIN_COLORS.selected;
  const personal = pin.personal || {};
  const social = pin.social || {};
  const hasFriends = Number(social.friendsCount || 0) > 0;
  const hasMeetups = Number(social.meetupsCount || 0) > 0;
  const isLive = Number(social.presenceCount || pin.liveCheckins || 0) > 0;

  if (hasFriends && hasMeetups) return MAPBOX_PIN_COLORS.both;
  if (hasFriends) return MAPBOX_PIN_COLORS.friend;
  if (hasMeetups) return MAPBOX_PIN_COLORS.meetup;
  if (isLive) return MAPBOX_PIN_COLORS.live;
  if (personal.liked && personal.visited) return MAPBOX_PIN_COLORS.likedVisited;
  if (personal.liked) return MAPBOX_PIN_COLORS.liked;
  if (personal.visited) return MAPBOX_PIN_COLORS.visited;
  if (personal.memoryCount > 0) return MAPBOX_PIN_COLORS.memory;
  return MAPBOX_PIN_COLORS.base;
}

export function resolveMapsPinRadius(pin = {}, { isSelected = false } = {}) {
  if (isSelected) return 14;
  const personal = pin.personal || {};
  const social = pin.social || {};
  const hasFriends = Number(social.friendsCount || 0) > 0;
  const hasMeetups = Number(social.meetupsCount || 0) > 0;
  if (hasFriends && hasMeetups) return 12;
  if (hasFriends || hasMeetups) return 11;
  if (personal.liked || personal.visited || personal.memoryCount > 0) return 10;
  return 8;
}

export function buildMapboxRuntimeConfig(env = {}) {
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN || env.NEXT_PUBLIC_MAP_BOX_API_KEY || '';
  return Object.freeze({
    schemaVersion: MAPBOX_RUNTIME_TEMPLATE_VERSION,
    token,
    styleUrl:
      env.NEXT_PUBLIC_MAPBOX_STYLE_URL ||
      env.MAPBOX_STYLE_URL ||
      'mapbox://styles/mapbox/dark-v11',
    tilesetId:
      env.NEXT_PUBLIC_MAPBOX_TILESET_ID || env.MAPBOX_TILESET_ID || '',
    sourceLayer:
      env.NEXT_PUBLIC_MAPBOX_SOURCE_LAYER || env.MAPBOX_SOURCE_LAYER || '',
    defaultView: Object.freeze({
      longitude: -82.3248,
      latitude: 29.6516,
      zoom: 18,
    }),
    configured: Boolean(token),
    tilesetConfigured: Boolean(
      (env.NEXT_PUBLIC_MAPBOX_TILESET_ID || env.MAPBOX_TILESET_ID) &&
        (env.NEXT_PUBLIC_MAPBOX_SOURCE_LAYER || env.MAPBOX_SOURCE_LAYER)
    ),
  });
}

export function buildMapboxLayerTemplate({
  ids = MAPBOX_LAYER_IDS,
  sourceLayer = '{sourceLayer}',
} = {}) {
  return Object.freeze({
    schemaVersion: MAPBOX_RUNTIME_TEMPLATE_VERSION,
    ids,
    source: Object.freeze({
      id: ids.source,
      type: 'vector',
      promoteId: 'place_id',
    }),
    layers: Object.freeze({
      heatmap: Object.freeze({
        id: ids.heatmap,
        type: 'heatmap',
        source: ids.source,
        sourceLayer,
        maxzoom: 13,
        heatmapRamp: MAPBOX_HEATMAP_RAMP,
      }),
      glow: Object.freeze({
        id: ids.glow,
        type: 'circle',
        source: ids.source,
        sourceLayer,
        minzoom: 12,
        stateColors: MAPBOX_PIN_COLORS,
      }),
      dots: Object.freeze({
        id: ids.dots,
        type: 'symbol',
        source: ids.source,
        sourceLayer,
        minzoom: 10,
        iconImage: ids.beerIcon,
      }),
      labels: Object.freeze({
        id: ids.labels,
        type: 'symbol',
        source: ids.source,
        sourceLayer,
        minzoom: 15,
        textField: ['get', 'name'],
      }),
    }),
  });
}
