import { api } from '@/lib/api';
import { PartnerApiError, getApiErrorCode, getApiErrorMessage } from '@/lib/errors';
import type { FoodCategory } from '@/lib/restaurant/types';

const FOOD_CATEGORIES_PATH = '/api/v1/restaurant-service/food-categories';

type Envelope<T> = { success?: boolean; message?: string; data?: T };

function mapFoodCategory(row: Record<string, unknown>): FoodCategory | null {
  const id = String(row.id ?? row._id ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    slug: String(row.slug ?? ''),
    iconKey: typeof row.iconKey === 'string' ? row.iconKey : null,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
    sortOrder: Number(row.sortOrder ?? 0) || 0,
    source: row.source === 'restaurant' ? 'restaurant' : 'platform',
  };
}

export const foodCategoriesApi = {
  /** GET /food-categories — same list as the customer home category row. */
  list: async (): Promise<FoodCategory[]> => {
    try {
      const res = await api.get<Envelope<Record<string, unknown>[]>>(FOOD_CATEGORIES_PATH);
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      return rows
        .map(mapFoodCategory)
        .filter((row): row is FoodCategory => row !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    } catch (error) {
      throw new PartnerApiError(
        getApiErrorMessage(error, 'Could not load food types'),
        getApiErrorCode(error)
      );
    }
  },
};
