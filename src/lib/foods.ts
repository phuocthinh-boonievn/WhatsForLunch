import { priceRarity, type MealKind } from './case-mechanics';
import { rawFoods } from './generated-catalog';

export type { MealKind };

export type Food = {
  name: string;
  sub: string;
  price: number;
  rarity: number;
  image: number;
  veg?: boolean;
  quip: string;
  kind: MealKind;
  category: string;
  nameEn?: string;
  meals?: readonly string[];
  serving?: string;
  groupMeal?: boolean;
};

type RawFood = {
  name: string;
  sub: string;
  price: number;
  image: number;
  quip: string;
  kind: MealKind;
  category: string;
  veg?: boolean;
  nameEn?: string;
  meals?: readonly string[];
  serving?: string;
  groupMeal?: boolean;
};

export const foods: Food[] = (rawFoods as readonly RawFood[]).map((food) => ({
  ...food,
  rarity: priceRarity(food.price, food.kind),
}));

export function foodKey(food: Food) {
  return `${food.kind}-${food.image}`;
}
