import type { ItemAddonDraft } from '@/components/menu/item-form/item-form-types';
import type {
  CreateModifierGroupPayload,
  ModifierGroup,
} from '@/lib/restaurant/types';

function draftToPayload(
  draft: ItemAddonDraft,
  categoryId: string
): CreateModifierGroupPayload {
  return {
    name: draft.name.trim(),
    categoryId,
    isRequired: draft.isRequired,
    minSelect: draft.isRequired ? 1 : 0,
    maxSelect: Math.max(1, draft.maxSelect),
    options: draft.options
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name.trim(),
        price: Math.max(0, o.price),
        isAvailable: true,
      })),
  };
}

/** Create any pending groups, then attach the ticked library to this dish. */
export async function persistItemAddons(input: {
  kitchenCategoryId: string;
  itemId: string;
  selectedGroupIds: string[];
  drafts: ItemAddonDraft[];
  createGroup: (payload: CreateModifierGroupPayload) => Promise<ModifierGroup>;
  attach: (itemId: string, groupIds: string[]) => Promise<unknown>;
}): Promise<void> {
  const ids = [...new Set(input.selectedGroupIds.filter(Boolean))];
  for (const draft of input.drafts) {
    if (!draft.name.trim() || !draft.options.some((o) => o.name.trim())) continue;
    const created = await input.createGroup(
      draftToPayload(draft, input.kitchenCategoryId)
    );
    if (created.id) ids.push(created.id);
  }
  await input.attach(input.itemId, [...new Set(ids)]);
}
