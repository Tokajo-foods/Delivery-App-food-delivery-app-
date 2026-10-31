import type { MenuItem, SpiceLevel } from '@/lib/restaurant/types';

export type ItemModalState =
  | { mode: 'create'; foodCategoryId?: string }
  | { mode: 'edit'; item: MenuItem }
  | null;

export type ItemPhotoFile = { uri: string; name: string; type: string };

/** Home-page category id, or a typed name when the owner chose Other. */
export type FoodTypeValue = { id: string; other: boolean; otherName: string };

export const EMPTY_FOOD_TYPE: FoodTypeValue = { id: '', other: false, otherName: '' };

export type ItemFormPayload = {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  isVeg?: boolean;
  isAvailable?: boolean;
  spiceLevel?: string;
  tags?: string;
  foodCategoryId?: string;
  foodCategoryName?: string;
  image?: ItemPhotoFile;
  /** Category add-on groups ticked for this dish. */
  addonGroupIds?: string[];
  /** New groups created on the form before a kitchen section exists. */
  newAddons?: ItemAddonDraft[];
};

export type ItemAddonDraft = {
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: Array<{ name: string; price: number }>;
};

export const SPICE_OPTIONS: SpiceLevel[] = ['none', 'mild', 'medium', 'hot'];
