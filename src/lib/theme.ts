export const ASSET_BASE = 'https://nagisanzenin.github.io/truanayangi';
export const COUNTER_API =
  'https://truanayangi-counter.nagisanzenin.workers.dev/spins';

export const colors = {
  warehouse: '#27323b',
  warehouseDeep: '#17212a',
  panel: '#17232c',
  card: '#34414d',
  cardInner: '#202126',
  text: '#e4e8eb',
  muted: '#c0c5c9',
  dim: '#abb4ba',
  gold: '#dfc681',
  goldText: '#dec989',
  goldMystery: '#ffe49a',
  buttonTop: '#739b4d',
  buttonBottom: '#5b8139',
  buttonBorder: '#9fb984',
  find: '#5f853e',
  invalid: '#eb8f84',
  overlay: '#1f2d38f5',
} as const;

export const rarityColors = [
  '#4b69ff',
  '#8847ff',
  '#d32ce6',
  '#eb4b4b',
  '#e4ae39',
] as const;

export const tiers = [
  'QUỐC DÂN',
  'HIẾM',
  'CỰC PHẨM',
  'TỐI MẬT',
  '★ ĐẶC BIỆT',
] as const;

export const BUDGET_PRESETS = ['35', '50', '75', '100', '150'] as const;
export const DEFAULT_BUDGET = '50';
export const MIN_BUDGET = 30;
export const MAX_BUDGET = 180;

export const TILE_WIDTH = 240;
export const TILE_HEIGHT = 180;
export const TILE_STEP = 254;
export const INITIAL_REEL_X = -400;
export const REEL_VISIBLE = 12;

export const REVEAL_SOUNDS = [
  'item_reveal3_rare',
  'item_reveal4_mythical',
  'item_reveal5_legendary',
  'item_reveal6_ancient',
  'item_reveal6_ancient',
] as const;
