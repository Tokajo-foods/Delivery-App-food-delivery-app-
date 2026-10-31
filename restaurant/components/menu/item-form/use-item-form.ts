import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  EMPTY_FOOD_TYPE,
  SPICE_OPTIONS,
  type FoodTypeValue,
  type ItemFormPayload,
  type ItemModalState,
  type ItemPhotoFile,
} from '@/components/menu/item-form/item-form-types';
import type { MenuItem, SpiceLevel } from '@/lib/restaurant/types';

function toSpice(value: MenuItem['spiceLevel']): SpiceLevel {
  return SPICE_OPTIONS.includes(value as SpiceLevel) ? (value as SpiceLevel) : 'mild';
}

export function useItemForm({
  state,
  fetchedItem,
  fetched,
}: {
  state: ItemModalState;
  fetchedItem: MenuItem | undefined;
  fetched: boolean;
}) {
  const isCreate = state?.mode === 'create';
  const editId = state?.mode === 'edit' ? state.item.id : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>('mild');
  const [tags, setTags] = useState('');
  const [foodType, setFoodType] = useState<FoodTypeValue>(EMPTY_FOOD_TYPE);
  const [savedFoodTypeId, setSavedFoodTypeId] = useState('');
  const [pendingImage, setPendingImage] = useState<ItemPhotoFile | null>(null);

  const applyItem = (item: MenuItem) => {
    setName(item.name);
    setDescription(item.description ?? '');
    setPrice(String(item.price ?? ''));
    setDiscountPrice(item.discountPrice != null ? String(item.discountPrice) : '');
    setIsVeg(item.isVeg !== false);
    setIsAvailable(item.isAvailable !== false);
    setSpiceLevel(toSpice(item.spiceLevel));
    setTags((item.tags ?? []).join(', '));
    setFoodType({ ...EMPTY_FOOD_TYPE, id: item.foodCategoryId ?? '' });
    setSavedFoodTypeId(item.foodCategoryId ?? '');
  };

  useEffect(() => {
    if (!state) return;
    setPendingImage(null);
    if (state.mode === 'edit') {
      applyItem(state.item);
      return;
    }
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setIsVeg(true);
    setIsAvailable(true);
    setSpiceLevel('mild');
    setTags('');
    setFoodType(
      state.foodCategoryId
        ? { id: state.foodCategoryId, other: false, otherName: '' }
        : EMPTY_FOOD_TYPE
    );
    setSavedFoodTypeId('');
  }, [state]);

  useEffect(() => {
    if (editId && fetchedItem?.id === editId) applyItem(fetchedItem);
  }, [editId, fetched]);

  const canSubmit = Boolean(name.trim() && price.trim());

  const buildPayload = (): ItemFormPayload | null => {
    const parsedPrice = Number(price);
    const parsedDiscount = discountPrice.trim() === '' ? undefined : Number(discountPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Invalid price', 'Enter a price greater than 0.');
      return null;
    }
    if (parsedDiscount != null && Number.isFinite(parsedDiscount) && parsedDiscount >= parsedPrice) {
      Alert.alert('Offer price', 'Offer price must be less than the original price.');
      return null;
    }
    const otherName = foodType.other ? foodType.otherName.trim() : '';
    if (foodType.other && !otherName) {
      Alert.alert('Category', 'Type the category name, for example Momos.');
      return null;
    }
    if (!foodType.id && !otherName) {
      Alert.alert(
        'Select category',
        'Choose a category from the list, or Other if it is not there yet.'
      );
      return null;
    }
    const foodRef = otherName
      ? { foodCategoryName: otherName }
      : foodType.id && (isCreate || foodType.id !== savedFoodTypeId)
        ? { foodCategoryId: foodType.id }
        : {};

    return {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parsedPrice,
      discountPrice: Number.isFinite(parsedDiscount) ? parsedDiscount : undefined,
      isVeg,
      isAvailable,
      spiceLevel,
      tags: tags.trim() || undefined,
      image: pendingImage ?? undefined,
      ...foodRef,
    };
  };

  return {
    isCreate,
    name, setName,
    description, setDescription,
    price, setPrice,
    discountPrice, setDiscountPrice,
    isVeg, setIsVeg,
    isAvailable, setIsAvailable,
    spiceLevel, setSpiceLevel,
    tags, setTags,
    foodType, setFoodType,
    pendingImage, setPendingImage,
    canSubmit,
    buildPayload,
  };
}
