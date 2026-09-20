// this file defines the GarmentCard component
// creates function to build one clothing item tile when a page calls it

import type { Item } from "@/lib/mock-items"

// in: one item
// out: colour block (for stage 1) or photo (for stage 3) on top, colour + type + tags below
export function GarmentCard({ item }: { item: Item }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div
        className="aspect-square border-b"
        style={{ backgroundColor: item.colour }}
      />
      <div className="p-2 text-sm">
        <p className="font-medium capitalize">{item.colour} {item.type}</p>
        <p className="text-muted-foreground">{item.tags.join(", ")}</p>
      </div>
    </div>
  )
}
