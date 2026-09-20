// this file stores the mock items for stage 1

export const ITEM_TYPES = [
  "t-shirt", "pants", "hoodie", "sweatshirt", "long-sleeve", "shorts",
  "shoes", "dress", "skirt", "crop-top", "outerwear", "accessory"
] as const

export type ItemType = (typeof ITEM_TYPES)[number]

export type Item = {
  id: string
  user_id: string
  image_path: string
  type: ItemType
  colour: string
  tags: string[]
}

const USER = "mock-user"

export const mockItems: Item[] = [
  { id: "1", user_id: USER, image_path: "", type: "hoodie",     colour: "black", tags: ["cropped", "oversized"] },
  { id: "2", user_id: USER, image_path: "", type: "pants",      colour: "blue",  tags: ["baggy"] },
  { id: "3", user_id: USER, image_path: "", type: "shoes",      colour: "white", tags: ["chunky"] },
  { id: "4", user_id: USER, image_path: "", type: "t-shirt",    colour: "grey",  tags: ["boxy"] },
  { id: "5", user_id: USER, image_path: "", type: "sweatshirt", colour: "green", tags: ["oversized"] },
  { id: "6", user_id: USER, image_path: "", type: "pants",      colour: "black", tags: ["baggy", "cargo"] },
]
