// this file creates the /wardrobe page (wardrobe/ folder + page.tsx makes it visitable)
// .tsx = typescript + jsx: builds the page's ui with html-looking tags written inside the code
// next.js calls the function below when someone visits /wardrobe; it returns the grid of garment cards

"use client"   // this page reacts to clicks, so it must run in the browser

import { useState } from "react"
import { FilterBar } from "@/components/FilterBar"
import { GarmentCard } from "@/components/GarmentCard"
import { mockItems } from "@/lib/mock-items"
import type { ItemType } from "@/lib/item-types"

export default function WardrobePage() {
  // selected = the current filter. setSelected changes it and redraws the page
  const [selected, setSelected] = useState<ItemType | null>(null)

  // only the types you actually own, no duplicates
  const types = [...new Set(mockItems.map((item) => item.type))]

  // recalculated on every render, so it always matches the current filter
  const shown = selected ? mockItems.filter((item) => item.type === selected) : mockItems

  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Wardrobe</h1>

      <FilterBar types={types} selected={selected} onSelect={setSelected} />

      {/* calls GarmentCard function once per item — 2 cols on phone, 3 on tablet, 4 on laptop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {shown.map((item) => (
          <GarmentCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  )
}
