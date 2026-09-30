import type { MealKind } from './case-mechanics';

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; kind: MealKind }> = {
  rice: { label: 'Cơm & xôi', icon: '🍚', kind: 'food' },
  noodles: { label: 'Bún, phở & mì', icon: '🍜', kind: 'food' },
  bread: { label: 'Bánh mì & cuốn', icon: '🥖', kind: 'food' },
  grill: { label: 'Nướng & chiên', icon: '🍗', kind: 'food' },
  light: { label: 'Salad & món nhẹ', icon: '🥗', kind: 'food' },
  hotpot: { label: 'Lẩu & cháo', icon: '🍲', kind: 'food' },
  pizza: { label: 'Pizza & pasta', icon: '🍕', kind: 'food' },
  other: { label: 'Món khác', icon: '🍽️', kind: 'food' },
  coffee: { label: 'Cà phê', icon: '☕', kind: 'drink' },
  'milk-tea': { label: 'Trà sữa', icon: '🧋', kind: 'drink' },
  tea: { label: 'Trà & trà trái cây', icon: '🍵', kind: 'drink' },
  juice: { label: 'Nước ép', icon: '🍊', kind: 'drink' },
  smoothie: { label: 'Sinh tố', icon: '🥤', kind: 'drink' },
  refreshments: { label: 'Giải khát', icon: '🧊', kind: 'drink' },
  'matcha-cocoa': { label: 'Matcha & cacao', icon: '🍵', kind: 'drink' },
  milk: { label: 'Sữa & sữa hạt', icon: '🥛', kind: 'drink' },
  yogurt: { label: 'Sữa chua uống', icon: '🥛', kind: 'drink' },
  blended: { label: 'Đá xay', icon: '🥤', kind: 'drink' },
  soda: { label: 'Soda & nước đóng chai', icon: '🫧', kind: 'drink' },
  'snack-savoury': { label: 'Món mặn', icon: '🍟', kind: 'snack' },
  'snack-sweet': { label: 'Món ngọt', icon: '🍮', kind: 'snack' },
  'snack-light': { label: 'Ăn nhẹ', icon: '🥜', kind: 'snack' },
  'snack-fruit': { label: 'Trái cây', icon: '🍉', kind: 'snack' },
  'nhau-vegetables': { label: 'Rau, đậu & lạc', icon: '🥜', kind: 'nhau' },
  'nhau-fried': { label: 'Món chiên', icon: '🍟', kind: 'nhau' },
  'nhau-meat': { label: 'Thịt & hải sản', icon: '🍗', kind: 'nhau' },
};

export function categoryLabel(id: string) {
  return CATEGORY_LABELS[id]?.label ?? id;
}
