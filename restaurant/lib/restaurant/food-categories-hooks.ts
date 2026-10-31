import { useQuery } from '@tanstack/react-query';

import { foodCategoriesApi } from '@/lib/restaurant/food-categories-api';

export const foodCategoryKeys = {
  all: ['food-categories'] as const,
};

/** Platform food types for the dish form. Refetched after an "Other" type is saved. */
export function useFoodCategories(enabled = true) {
  return useQuery({
    queryKey: foodCategoryKeys.all,
    queryFn: foodCategoriesApi.list,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
