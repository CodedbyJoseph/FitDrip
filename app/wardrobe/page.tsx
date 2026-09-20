// this file creates the /wardrobe page (wardrobe/ folder + page.tsx initiates this)
// .tsx = typescript + jsx: builds the page's ui with html-looking tags written inside the code
// next.js calls the function below when someone visits /wardrobe; it returns the grid of garment cards


import { GarmentCard } from "@/components/GarmentCard"
import { mockItems } from "@/lib/mock-items"

export default function WardrobePage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Wardrobe</h1>

      {/* calls GarmentCard function once per item — 2 cols on phone, 3 on tablet, 4 on laptop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {mockItems.map((item) => (
          <GarmentCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  )
}
