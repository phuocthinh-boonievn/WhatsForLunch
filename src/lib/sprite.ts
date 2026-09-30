import { artByImage, atlasTwoX } from './generated-catalog';
import { ASSET_BASE } from './theme';

export type SpriteLayout = {
  uri: string;
  cols: number;
  rows: number;
  col: number;
  /** How many cell-heights to shift up. CSS background-position Y% × (rows - 1). */
  rowShift: number;
  /** Fraction of the frame clipped off the bottom (CSS inset bottom). */
  clipBottom: number;
};

function shift(percent: number, rows: number) {
  return (percent / 100) * (rows - 1);
}

function atlasUri(name: string) {
  const hashed = atlasTwoX[name];
  return hashed ? `${ASSET_BASE}${hashed}` : `${ASSET_BASE}/${name}.webp`;
}

/** Individual optimized art for the original lunch sheets (images 0–183 that exist). */
export function artUri(image: number) {
  const path = artByImage[String(image)];
  return path ? `${ASSET_BASE}${path}` : null;
}

/**
 * Sprite windows ported from the live site's layout function.
 * Main dishes prefer artUri(); drinks, snacks, nhậu and meal sheets use these atlases.
 */
export function spriteFor(image: number): SpriteLayout {
  if (image >= 600 && image <= 623) {
    const index = (image - 600) % 12;
    const row = Math.floor(index / 4);
    return {
      uri: atlasUri(`food-meals-${Math.floor((image - 600) / 12)}`),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift([0, 46, 94][row], 3),
      clipBottom: 0,
    };
  }

  if (image >= 500 && image <= 547) {
    const index = (image - 500) % 12;
    const sheet = Math.floor((image - 500) / 12);
    const row = Math.floor(index / 4);
    const rows = [
      [0, 47, 94],
      [0, 48, 98],
      [0, 50, 96],
      [0, 47, 97],
    ][sheet];
    const clip =
      row === 0 && sheet === 0
        ? 0.02
        : (row === 0 && sheet === 3) || (row === 1 && sheet === 0)
          ? 0.07
          : row === 1 && sheet === 2
            ? 0.06
            : 0;
    return {
      uri: atlasUri(`drink-${2 + sheet}`),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift(rows[row], 3),
      clipBottom: clip,
    };
  }

  if (image >= 400 && image <= 447) {
    const index = (image - 400) % 12;
    const sheet = Math.floor((image - 400) / 12);
    const rows = [
      [0, 50, 100],
      [0, 46, 91],
      [0, 46, 90],
      [1, 46, 91],
    ][sheet];
    return {
      uri: atlasUri(`nhau-${sheet}`),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift(rows[Math.floor(index / 4)], 3),
      clipBottom: 0,
    };
  }

  if (image >= 168 && image <= 183) {
    const index = (image - 168) % 4;
    const sheet = Math.floor((image - 168) / 4);
    return {
      uri: atlasUri(['food-chinese-0', 'food-korean-0', 'food-japanese-0', 'food-indian-0'][sheet]),
      cols: 2,
      rows: 2,
      col: index % 2,
      rowShift: Math.floor(index / 2),
      clipBottom: 0,
    };
  }

  if (image >= 300 && image <= 383) {
    const index = (image - 300) % 12;
    const sheet = Math.floor((image - 300) / 12);
    const row = Math.floor(index / 4);
    const rows = [
      [0, 46, 94],
      [0, 49, 98.5],
      [0, 46, 94],
      [0, 46, 94],
      [0, 50, 100],
      [0, 49, 98.5],
      [0, 46, 94],
    ][sheet];
    const clip =
      sheet === 2 && row === 0
        ? 0.02
        : sheet === 3 && row === 0
          ? 0.06
          : sheet === 3 && row === 1
            ? 0.04
            : sheet === 6 && row === 0
              ? 0.03
              : 0;
    return {
      uri: atlasUri(`snack-vietnam-${sheet}`),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift(rows[row], 3),
      clipBottom: clip,
    };
  }

  if (image >= 156 && image <= 167) {
    const index = image - 156;
    return {
      uri: atlasUri('snack-0'),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift([0, 47, 93][Math.floor(index / 4)], 3),
      clipBottom: 0,
    };
  }

  if (image >= 132 && image <= 155) {
    const index = (image - 132) % 12;
    const rows = image < 144 ? [0, 47, 94] : [0, 50, 100];
    return {
      uri: atlasUri(`drink-${Math.floor((image - 132) / 12)}`),
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: shift(rows[Math.floor(index / 4)], 3),
      clipBottom: 0,
    };
  }

  const common = image >= 120;
  const lunch = image >= 72 && !common;
  const expanded = image >= 36;
  const index = common ? (image - 120) % 12 : lunch ? (image - 72) % 12 : expanded ? (image - 36) % 12 : image % 4;
  const atlas = common
    ? `food-common-${Math.floor((image - 120) / 12)}`
    : lunch
      ? `food-lunch-${Math.floor((image - 72) / 12)}`
      : expanded
        ? `food-expanded-${Math.floor((image - 36) / 12)}`
        : `food-hd-${Math.floor(image / 4)}`;

  if (image === 93) {
    return {
      uri: atlasUri(atlas),
      cols: 4,
      rows: 3,
      col: 1,
      rowShift: shift(89, 3),
      clipBottom: 0,
    };
  }

  if (!expanded) {
    const row = Math.floor(index / 2);
    return {
      uri: atlasUri(atlas),
      cols: 2,
      rows: 2,
      col: index % 2,
      rowShift: shift(row === 0 ? 0 : 94, 2),
      clipBottom: index < 2 ? 0.04 : 0,
    };
  }

  const row = Math.floor(index / 4);
  const clipBottom = image === 89 ? 0.12 : common ? 0.04 : lunch ? 0.07 : 0;
  return {
    uri: atlasUri(atlas),
    cols: 4,
    rows: 3,
    col: index % 4,
    rowShift: shift([0, 46, 92][row], 3),
    clipBottom,
  };
}
