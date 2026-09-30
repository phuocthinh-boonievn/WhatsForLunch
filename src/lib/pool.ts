import type { MealKind } from './case-mechanics';
import type { Food } from './foods';
import { mealWindows } from './generated-catalog';

export type MealSegment = 'breakfast' | 'lunch' | 'dinner' | 'night';

export const MEAL_SEGMENTS: { id: MealSegment; label: string }[] = [
  { id: 'breakfast', label: 'Ăn sáng' },
  { id: 'lunch', label: 'Ăn trưa' },
  { id: 'dinner', label: 'Ăn tối' },
  { id: 'night', label: 'Ăn đêm' },
];

export const KINDS: { id: MealKind; label: string }[] = [
  { id: 'food', label: 'Món chính' },
  { id: 'drink', label: 'Đồ uống' },
  { id: 'snack', label: 'Ăn vặt' },
  { id: 'nhau', label: 'Món nhậu' },
];

const breakfast = new Set<number>(mealWindows.breakfast);
const night = new Set<number>(mealWindows.night);
const additionalDinner = new Set<number>(mealWindows.additionalDinner);

/** Hour bands from the live site: night < 4, breakfast < 10, lunch < 16, else dinner. */
export function mealSegmentForHour(hour: number): MealSegment {
  if (hour < 4) return 'night';
  if (hour < 10) return 'breakfast';
  if (hour < 16) return 'lunch';
  return 'dinner';
}

function inLunchSheet(image: number) {
  return image < 600 || image > 623;
}

export function visibleInSegment(food: Food, segment: MealSegment | null): boolean {
  if (food.kind !== 'food') return true;
  if (segment === 'breakfast') return breakfast.has(food.image);
  if (segment === 'night') return night.has(food.image);
  if (segment === 'dinner') return inLunchSheet(food.image) || additionalDinner.has(food.image);
  // lunch, and the no-segment fallback, drop the breakfast/night-only sheets (images 600–623).
  return inLunchSheet(food.image);
}

export function poolFor(catalog: readonly Food[], kind: MealKind, segment: MealSegment | null) {
  return catalog.filter((food) => food.kind === kind && visibleInSegment(food, kind === 'food' ? segment : null));
}

export function priceBounds(catalog: readonly { price: number }[]) {
  if (!catalog.length) return { min: 0, max: 0 };
  let min = catalog[0].price;
  let max = catalog[0].price;
  for (const food of catalog) {
    if (food.price < min) min = food.price;
    if (food.price > max) max = food.price;
  }
  return { min, max };
}
