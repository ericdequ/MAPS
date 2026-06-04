import {
  MAPS_PLACE_SCHEMA_VERSION,
  buildPoiSourceManifest,
  normalizeMapsPlace,
} from './placeSchema.js';
import { getMapsProvider, mapsProviderRegistry } from './providerRegistry.js';

export const MAPS_BLOG_DATASET_SCHEMA_VERSION = 'maps-blog-dataset-v1';
export const MAPS_SPECIALIZED_LAYER_SCHEMA_VERSION = 'maps-specialized-layer-v1';

export const MAPS_BLOG_DATASET_STATUSES = Object.freeze([
  'active',
  'planned',
  'requested',
  'blocked',
]);

export const MAPS_BLOG_DATASET_MODES = Object.freeze([
  'live-with-fixture-fallback',
  'fixture-only',
  'requested-api',
]);

export const MAPS_SPECIALIZED_LAYER_STATUSES = Object.freeze([
  'seeded',
  'planned',
  'requested',
  'blocked',
]);

const freeze = (value) => Object.freeze(value);
const cleanText = (value = '') => String(value ?? '').trim();
const asArray = (value) => (Array.isArray(value) ? value : cleanText(value) ? [value] : []);
const unique = (values = []) => freeze([...new Set(values.map(cleanText).filter(Boolean))]);

function freezeDataset(dataset) {
  return freeze({
    schemaVersion: MAPS_BLOG_DATASET_SCHEMA_VERSION,
    status: 'planned',
    mode: 'fixture-only',
    defaultProviderId: 'libre',
    providerIds: freeze(['libre']),
    sourceManifests: freeze([]),
    placeTypes: freeze([]),
    groups: freeze([]),
    features: freeze([]),
    attribution: freeze([]),
    sourcePolicy:
      'Provider ids stay adapter-local. Durable blog map records use normalized name@geohash9 MAPS places.',
    safety: freeze([]),
    ...dataset,
    providerIds: unique(dataset.providerIds || [dataset.defaultProviderId || 'libre']),
    sourceManifests: freeze(dataset.sourceManifests || []),
    placeTypes: unique(dataset.placeTypes),
    groups: unique(dataset.groups),
    features: unique(dataset.features),
    attribution: unique(dataset.attribution),
    safety: unique(dataset.safety),
  });
}

function freezeLayer(layer) {
  return freeze({
    schemaVersion: MAPS_SPECIALIZED_LAYER_SCHEMA_VERSION,
    status: 'planned',
    placeContract: MAPS_PLACE_SCHEMA_VERSION,
    recordContract: 'route,title,summary,placeName,lat,lng,date,tstKey',
    sourceManifests: freeze([]),
    keywords: freeze([]),
    requiredKeywords: freeze([]),
    features: freeze([]),
    ...layer,
    sourceManifests: freeze(layer.sourceManifests || []),
    keywords: unique(layer.keywords),
    requiredKeywords: unique(layer.requiredKeywords),
    features: unique(layer.features),
  });
}

export const mapsBlogDatasets = freeze({
  'contech:construction-sites': freezeDataset({
    id: 'contech:construction-sites',
    blog: 'contechnews',
    title: 'Construction Site POIs',
    siteUrl: 'https://www.contechnews.com',
    mapPath: '/map',
    endpoint: '/api/map/sites',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox', 'google'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'osm:construction-sites',
        label: 'OpenStreetMap construction and infrastructure POIs',
        provider: 'libre',
        license: 'ODbL-1.0',
        attribution: ['OpenStreetMap contributors'],
        url: 'https://www.openstreetmap.org/copyright',
        durable: true,
        recordTypes: ['construction', 'infrastructure', 'worksite'],
        notes: ['Fetched through a bbox API with local seed fixtures as fallback.'],
      }),
    ],
    placeTypes: ['construction', 'infrastructure', 'worksite'],
    groups: ['construction', 'infrastructure', 'digital-twin'],
    features: ['live-bbox-api', 'seed-fixtures', 'category-filters', 'project-map-card'],
    attribution: ['OpenStreetMap contributors'],
  }),
  'govcon:civic-regions': freezeDataset({
    id: 'govcon:civic-regions',
    blog: 'govcon',
    title: 'Civic Region Ladder',
    siteUrl: 'https://www.govcon.me',
    mapPath: '/map',
    endpoint: '/api/map/regions',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox', 'google'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'us-census:tigerweb',
        label: 'US Census TIGERweb public boundary data',
        provider: 'us-census',
        license: 'public-domain-us-government',
        attribution: ['US Census Bureau'],
        url: 'https://tigerweb.geo.census.gov/',
        durable: true,
        recordTypes: ['state', 'county', 'jurisdiction', 'region'],
        notes: ['Normalize fetched regions into MAPS places or region records before reuse.'],
      }),
    ],
    placeTypes: ['jurisdiction', 'region', 'civic-anchor'],
    groups: ['civic-tech', 'boundaries', 'public-data'],
    features: ['live-bbox-api', 'jurisdiction-ladder', 'region-clustering', 'tst-place-grounding'],
    attribution: ['US Census Bureau'],
  }),
  'magick:sacred-geography': freezeDataset({
    id: 'magick:sacred-geography',
    blog: 'magick',
    title: 'Sacred Geography',
    siteUrl: 'https://www.magickedu.org',
    mapPath: '/map',
    endpoint: '/api/map/sacred',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox', 'google'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'osm:sacred-geography',
        label: 'OpenStreetMap worship, lodging, and pilgrimage POIs',
        provider: 'libre',
        license: 'ODbL-1.0',
        attribution: ['OpenStreetMap contributors'],
        url: 'https://www.openstreetmap.org/copyright',
        durable: true,
        recordTypes: ['worship', 'pilgrimage', 'lodging', 'sacred-site'],
        notes: ['Seed overlays can carry interpretive notes, but provider facts stay attributed.'],
      }),
      buildPoiSourceManifest({
        id: 'magick:markdown-sacred-stories',
        label: 'Magick markdown sacred geography stories',
        provider: 'blogs-markdown',
        license: 'site-owned-content',
        durable: true,
        recordTypes: ['miracle-story', 'pilgrimage-story', 'ashram-story'],
        notes: ['Use explicit coordinates or curated place anchors before publishing map records.'],
      }),
    ],
    placeTypes: ['worship', 'pilgrimage', 'ashram', 'miracle-story'],
    groups: ['sacred-places', 'pilgrimage', 'story-geography'],
    features: ['live-bbox-api', 'line-overlays', 'hypothesis-layers', 'place-clusters'],
    attribution: ['OpenStreetMap contributors'],
    safety: ['clearly-separate-public-poi-facts-from-interpretive-story-layers'],
  }),
  'my-blog:wildlife-dex': freezeDataset({
    id: 'my-blog:wildlife-dex',
    blog: 'my-blog',
    title: 'Wildlife Dex',
    siteUrl: 'https://www.rics-notebook.com',
    mapPath: '/map',
    endpoint: '/api/map/animals',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'inaturalist:animal-observations',
        label: 'iNaturalist animal observations',
        provider: 'inaturalist',
        license: 'mixed-user-content-review-required',
        attribution: ['iNaturalist contributors'],
        url: 'https://www.inaturalist.org/',
        durable: false,
        recordTypes: ['animal-observation', 'species'],
        notes: ['Cache API responses carefully and keep observation licensing visible.'],
      }),
    ],
    placeTypes: ['animal-observation', 'wildlife-area', 'species'],
    groups: ['ecology', 'education', 'regional-dex'],
    features: ['live-bbox-api', 'observation-feed', 'species-clusters', 'education-only'],
    attribution: ['iNaturalist contributors'],
  }),
  'planthealth:plant-dex': freezeDataset({
    id: 'planthealth:plant-dex',
    blog: 'planthealth',
    title: 'Local Plant Dex',
    siteUrl: 'https://www.plantheath.com',
    mapPath: '/map',
    endpoint: '/api/map/plants',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'inaturalist:plant-observations',
        label: 'iNaturalist plant observations',
        provider: 'inaturalist',
        license: 'mixed-user-content-review-required',
        attribution: ['iNaturalist contributors'],
        url: 'https://www.inaturalist.org/',
        durable: false,
        recordTypes: ['plant-observation', 'species'],
        notes: ['Use education-only framing and visible attribution for observations.'],
      }),
    ],
    placeTypes: ['plant-observation', 'species', 'garden'],
    groups: ['plant-health', 'ecology', 'local-medicine'],
    features: ['live-bbox-api', 'observation-feed', 'species-clusters', 'education-only'],
    attribution: ['iNaturalist contributors'],
  }),
  'sports:fields-courts': freezeDataset({
    id: 'sports:fields-courts',
    blog: 'sports',
    title: 'Pickup Fields And Courts',
    siteUrl: 'https://www.sportstips.org',
    mapPath: '/map',
    endpoint: '/api/map/fields',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox', 'google', 'apple'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'osm:sports-venues',
        label: 'OpenStreetMap sports fields and courts',
        provider: 'libre',
        license: 'ODbL-1.0',
        attribution: ['OpenStreetMap contributors'],
        url: 'https://www.openstreetmap.org/copyright',
        durable: true,
        recordTypes: ['field', 'court', 'sports-venue'],
        notes: ['Good default corpus for BEV venue and local activity discovery experiments.'],
      }),
    ],
    placeTypes: ['field', 'court', 'sports-venue'],
    groups: ['sports', 'local-discovery', 'community-events'],
    features: ['live-bbox-api', 'venue-search', 'surface-filtering', 'pickup-readiness'],
    attribution: ['OpenStreetMap contributors'],
  }),
  'elonstusks:soundscape': freezeDataset({
    id: 'elonstusks:soundscape',
    blog: 'elonstusks',
    title: 'Sound And Media Map',
    siteUrl: 'https://www.elontusk.org',
    mapPath: '/map',
    endpoint: '',
    status: 'planned',
    mode: 'fixture-only',
    defaultProviderId: 'libre',
    providerIds: ['libre'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'elonstusks:creator-geotag-fixtures',
        label: 'Curated creator geotag seed fixtures',
        provider: 'blogs-markdown',
        license: 'site-owned-content',
        durable: true,
        recordTypes: ['creator-place', 'media-place'],
        notes: ['Unpublished blog. Keep as low-priority fixture-only until an API source exists.'],
      }),
    ],
    placeTypes: ['creator-place', 'media-place'],
    groups: ['media', 'creator-geography', 'local-discovery'],
    features: ['seed-fixtures', 'creator-geotags', 'api-request-needed'],
  }),
  'psychedelicbible:spiritual-ecology': freezeDataset({
    id: 'psychedelicbible:spiritual-ecology',
    blog: 'psychedelicbible',
    title: 'Spiritual Ecology',
    siteUrl: 'https://www.psychedelicbible.org',
    mapPath: '/map',
    endpoint: '/api/map/spiritual',
    status: 'active',
    mode: 'live-with-fixture-fallback',
    defaultProviderId: 'libre',
    providerIds: ['libre', 'mapbox'],
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'osm:sacred-sites',
        label: 'OpenStreetMap sacred and spiritual ecology POIs',
        provider: 'libre',
        license: 'ODbL-1.0',
        attribution: ['OpenStreetMap contributors'],
        url: 'https://www.openstreetmap.org/copyright',
        durable: true,
        recordTypes: ['sacred-site', 'retreat-place'],
      }),
      buildPoiSourceManifest({
        id: 'inaturalist:fungi-observations',
        label: 'iNaturalist fungi observations',
        provider: 'inaturalist',
        license: 'mixed-user-content-review-required',
        attribution: ['iNaturalist contributors'],
        url: 'https://www.inaturalist.org/',
        durable: false,
        recordTypes: ['fungi-observation', 'species'],
      }),
    ],
    placeTypes: ['sacred-site', 'fungi-observation', 'retreat-place'],
    groups: ['spiritual-ecology', 'sacred-places', 'education'],
    features: ['live-bbox-api', 'correlation-view', 'education-only', 'safety-gated'],
    attribution: ['OpenStreetMap contributors', 'iNaturalist contributors'],
    safety: ['education-only', 'no-harvesting-or-medical-claims'],
  }),
});

export const mapsSpecializedLayers = freeze({
  'magick:map-of-miracles': freezeLayer({
    id: 'magick:map-of-miracles',
    blog: 'magick',
    datasetId: 'magick:sacred-geography',
    mapIdeaId: 'map-of-miracles',
    title: 'Map of Miracles',
    label: 'Map of Miracles',
    route: '/MapMB/energia',
    layerId: 'miracles',
    status: 'seeded',
    sourceManifests: [
      buildPoiSourceManifest({
        id: 'magick:miracle-markdown-layer',
        label: 'Magick miracle, pilgrimage, ashram, and sacred story markdown',
        provider: 'blogs-markdown',
        license: 'site-owned-content',
        durable: true,
        recordTypes: ['miracle-story', 'pilgrimage-story', 'ashram-story', 'temple-story'],
        notes: [
          'Derive records from markdown only after a post has explicit coordinates or a curated place anchor.',
          'Render as an interpretive layer above the public sacred geography dataset.',
        ],
      }),
    ],
    keywords: [
      'miracle',
      'miracles',
      'mystical experience',
      'healing',
      'apparition',
      'baba',
      'neem karoli',
      'kainchi',
      'ashram',
      'pilgrimage',
      'temple',
      'sacred site',
    ],
    requiredKeywords: [
      'miracle',
      'miracles',
      'mystical experience',
      'apparition',
      'baba',
      'neem karoli',
      'kainchi',
      'ashram',
      'pilgrimage',
    ],
    requiredKeywordScope: 'metadata',
    features: [
      'markdown-derived-place-anchors',
      'curated-seed-points',
      'story-place-tst-records',
      'interpretive-layer-disclosure',
    ],
    loading:
      'Use sacred geography seeds immediately; promote markdown stories only when place anchors are explicit.',
  }),
});

export const mapsBlogDatasetIds = freeze(Object.keys(mapsBlogDatasets));
export const mapsSpecializedLayerIds = freeze(Object.keys(mapsSpecializedLayers));

export function listMapsBlogDatasets() {
  return freeze(Object.values(mapsBlogDatasets));
}

export function getMapsBlogDataset(datasetId) {
  return mapsBlogDatasets[cleanText(datasetId)] || null;
}

export function getMapsBlogDatasetsForBlog(blog) {
  const blogId = cleanText(typeof blog === 'string' ? blog : blog?.name || blog?.dir).toLowerCase();
  return freeze(listMapsBlogDatasets().filter((dataset) => dataset.blog === blogId));
}

export function listMapsSpecializedLayers() {
  return freeze(Object.values(mapsSpecializedLayers));
}

export function getMapsSpecializedLayer(layerId) {
  return mapsSpecializedLayers[cleanText(layerId)] || null;
}

export function getMapsSpecializedLayersForBlog(blog) {
  const blogId = cleanText(typeof blog === 'string' ? blog : blog?.name || blog?.dir).toLowerCase();
  return freeze(listMapsSpecializedLayers().filter((layer) => layer.blog === blogId));
}

export function getMapsSpecializedLayersForDataset(datasetId) {
  const id = cleanText(datasetId);
  return freeze(listMapsSpecializedLayers().filter((layer) => layer.datasetId === id));
}

export function validateMapsBlogDataset(dataset = {}) {
  const issues = [];
  const providerIds = dataset.providerIds || [];

  if (dataset.schemaVersion !== MAPS_BLOG_DATASET_SCHEMA_VERSION) issues.push('invalid:schemaVersion');
  if (!dataset.id) issues.push('missing:id');
  if (!dataset.blog) issues.push('missing:blog');
  if (!dataset.title) issues.push('missing:title');
  if (!dataset.mapPath) issues.push('missing:mapPath');
  if (!MAPS_BLOG_DATASET_STATUSES.includes(dataset.status)) issues.push(`invalid:status:${dataset.status}`);
  if (!MAPS_BLOG_DATASET_MODES.includes(dataset.mode)) issues.push(`invalid:mode:${dataset.mode}`);
  if (!dataset.defaultProviderId) issues.push('missing:defaultProviderId');
  if (dataset.defaultProviderId && !mapsProviderRegistry[dataset.defaultProviderId]) {
    issues.push(`unknown:defaultProvider:${dataset.defaultProviderId}`);
  }
  if (!providerIds.length) issues.push('missing:providerIds');
  providerIds
    .filter((providerId) => !mapsProviderRegistry[providerId])
    .forEach((providerId) => issues.push(`unknown:provider:${providerId}`));
  if (dataset.mode === 'live-with-fixture-fallback' && !dataset.endpoint) issues.push('missing:endpoint');
  if (!dataset.sourceManifests?.length) issues.push('missing:sourceManifests');
  if (!dataset.placeTypes?.length) issues.push('missing:placeTypes');
  if (!dataset.features?.length) issues.push('missing:features');

  return freeze(issues);
}

export function validateMapsSpecializedLayer(layer = {}) {
  const issues = [];

  if (layer.schemaVersion !== MAPS_SPECIALIZED_LAYER_SCHEMA_VERSION) issues.push('invalid:schemaVersion');
  if (!layer.id) issues.push('missing:id');
  if (!layer.blog) issues.push('missing:blog');
  if (!layer.datasetId) issues.push('missing:datasetId');
  if (layer.datasetId && !getMapsBlogDataset(layer.datasetId)) issues.push(`unknown:dataset:${layer.datasetId}`);
  if (!layer.mapIdeaId) issues.push('missing:mapIdeaId');
  if (!layer.layerId) issues.push('missing:layerId');
  if (!MAPS_SPECIALIZED_LAYER_STATUSES.includes(layer.status)) issues.push(`invalid:status:${layer.status}`);
  if (!layer.sourceManifests?.length) issues.push('missing:sourceManifests');
  if (!layer.keywords?.length) issues.push('missing:keywords');
  if (!layer.requiredKeywords?.length) issues.push('missing:requiredKeywords');

  return freeze(issues);
}

export function normalizeBlogMapPointAsMapsPlace(point = {}, options = {}) {
  const dataset = options.dataset || getMapsBlogDataset(options.datasetId) || {};
  const providerId = options.providerId || dataset.defaultProviderId || 'libre';
  const provider = getMapsProvider(providerId);
  const sourcePrefix = cleanText(options.sourceIdPrefix || dataset.id || providerId);
  const pointId = cleanText(point.sourceId || point.id || point.tstKey || point.title || point.name);
  const tags = unique([
    ...(dataset.groups || []),
    ...(dataset.placeTypes || []),
    point.category,
    point.type,
    ...asArray(point.tags),
  ]);

  return normalizeMapsPlace({
    id: pointId,
    sourceId: sourcePrefix && pointId ? `${sourcePrefix}:${pointId}` : pointId,
    provider: provider.id,
    providerKind: provider.kind,
    name: point.name || point.title,
    title: point.title,
    lat: point.lat,
    lng: point.lng,
    geohash: point.geohash || point.geohash9,
    placeType: point.placeType || point.category || dataset.placeTypes?.[0] || 'place',
    tags,
    links: {
      ...(point.links || {}),
      url: point.url || point.href || '',
      mapPath: dataset.mapPath || '',
      endpoint: dataset.endpoint || '',
    },
    sourcePolicy: dataset.sourcePolicy || provider.sourcePolicy,
    attribution: dataset.attribution || provider.attribution,
    rawProviderRecord: options.includeRaw ? point : null,
  });
}
