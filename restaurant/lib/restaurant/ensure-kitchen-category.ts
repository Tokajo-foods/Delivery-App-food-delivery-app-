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

function foodMatchKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 || /(ss|us|is)$/.test(word)) return word;
      if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
      return word.endsWith('s') ? word.slice(0, -1) : word;
    })
    .join(' ');
}

export function itemMatchesFoodCategory(
  item: {
    foodCategoryId?: string | null;
    categoryId?: string | null;
    categoryName?: string;
  },
  foodCategory: { id: string; name: string; slug?: string }
): boolean {
  if (item.foodCategoryId && item.foodCategoryId === foodCategory.id) return true;
  if (item.categoryId && item.categoryId === foodCategory.id) return true;
  const itemKey = foodMatchKey(item.categoryName ?? '');
  if (!itemKey) return false;
  return (
    itemKey === foodMatchKey(foodCategory.name) ||
    itemKey === foodMatchKey(foodCategory.slug ?? '')
  );
}
