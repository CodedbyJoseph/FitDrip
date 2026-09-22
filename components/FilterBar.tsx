// this file contains a function that creates a filter bar in wardrobe
// imported by wardrobe/ page
// it holds no state itself — the page owns the selection and passes it down

import type { ItemType } from "@/lib/item-types"

type Props = {
  types: ItemType[]                        // the chips to show, each must be a value from ItemType (not a count/duplicate check)
  selected: ItemType | null                // which one is active, null = All
  onSelect: (type: ItemType | null) => void  // called when a chip is clicked
}

export function FilterBar({ types, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* null = no filter, so "All" is just a chip that clears the selection */}
      {[null, ...types].map((type) => (
        <button
          key={type ?? "all"}
          onClick={() => onSelect(type)}
          className={`rounded-full border px-3 py-1 text-sm capitalize ${
            selected === type ? "bg-foreground text-background" : "hover:bg-accent"
          }`}
        >
          {type ?? "All"}
        </button>
      ))}
    </div>
  )
}
