import { ASSET_BASE } from './theme';

export type SpriteLayout = {
  uri: string;
  cols: number;
  rows: number;
  col: number;
  rowShift: number;
  lunch: boolean;
};

export function spriteFor(image: number): SpriteLayout {
  const lunch = image >= 72;
  const expanded = image >= 36;
  const index = lunch
    ? (image - 72) % 12
    : expanded
      ? (image - 36) % 12
      : image % 4;
  const atlas = lunch
    ? `food-lunch-${Math.floor((image - 72) / 12)}`
    : expanded
      ? `food-expanded-${Math.floor((image - 36) / 12)}`
      : `food-hd-${Math.floor(image / 4)}`;

  if (expanded) {
    const row = Math.floor(index / 4);
    const yPercent = [0, 46, 92][row] / 100;
    return {
      uri: `${ASSET_BASE}/${atlas}.webp`,
      cols: 4,
      rows: 3,
      col: index % 4,
      rowShift: yPercent * (3 - 1),
      lunch,
    };
  }

  return {
    uri: `${ASSET_BASE}/${atlas}.webp`,
    cols: 2,
    rows: 2,
    col: index % 2,
    rowShift: Math.floor(index / 2),
    lunch,
  };
}
