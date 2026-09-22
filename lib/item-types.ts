// exports the clothing categories:
// - ITEM_TYPES (the list itself)
// - ItemType (a type that only allows values from it)

export const ITEM_TYPES = [
  "t-shirt", "pants", "hoodie", "sweatshirt", "long-sleeve", "shorts",
  "shoes", "dress", "skirt", "crop-top", "outerwear", "accessory"
] as const

export type ItemType = (typeof ITEM_TYPES)[number]
