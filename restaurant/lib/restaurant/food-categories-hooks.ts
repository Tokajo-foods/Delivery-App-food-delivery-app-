import { useQuery } from '@tanstack/react-query';

import { foodCategoriesApi } from '@/lib/restaurant/food-categories-api';

export const foodCategoryKeys = {
  all: ['food-categories'] as const,
};

/** Customer home categories for the menu chips and dish form. */
export function useFoodCategories(enabled = true) {
  return useQuery({
    queryKey: foodCategoryKeys.all,
    queryFn: foodCategoriesApi.list,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}
