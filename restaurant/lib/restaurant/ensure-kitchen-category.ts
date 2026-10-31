import type { MenuCategory } from '@/lib/restaurant/types';

export function kitchenCategoryNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function findKitchenCategoryByName(
  categories: MenuCategory[],
  name: string
): MenuCategory | undefined {
  const key = kitchenCategoryNameKey(name);
  if (!key) return undefined;
  return categories.find((category) => kitchenCategoryNameKey(category.name) === key);
}

export function itemMatchesFoodCategory(
  item: {
    foodCategoryId?: string | null;
    categoryName?: string;
  },
  foodCategory: { id: string; name: string }
): boolean {
  if (item.foodCategoryId && item.foodCategoryId === foodCategory.id) return true;
  const kitchenName = kitchenCategoryNameKey(item.categoryName ?? '');
  return Boolean(kitchenName) && kitchenName === kitchenCategoryNameKey(foodCategory.name);
}
