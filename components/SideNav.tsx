// this file is the left nav rail: icons only, expands to show labels while the mouse is over it

import Link from "next/link"
import { Shirt, Image as ImageIcon, PersonStanding, WandSparkles } from "lucide-react"

// one entry per tab. add a tab here, not in the markup below
const TABS = [
  { href: "/wardrobe", label: "Wardrobe", Icon: Shirt },
  { href: "/upload",   label: "Upload",   Icon: ImageIcon },
  { href: "/outfits",  label: "Outfits",  Icon: PersonStanding },
  { href: "/stylist",  label: "Stylist",  Icon: WandSparkles },
]

export function SideNav() {
  return (
    // group = lets the children react to the mouse being anywhere on the nav
    // fixed = floats above the page, so expanding doesn't push the content sideways
    <nav className="group fixed left-0 top-0 z-10 flex h-full w-16 flex-col gap-1 overflow-hidden border-r bg-background p-2 transition-[width] duration-200 hover:w-48">
      {TABS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-md p-3 hover:bg-accent"
        >
          {/* shrink-0 stops the icon squashing while the rail is mid-animation */}
          <Icon className="size-5 shrink-0" />
          {/* label is always there, just invisible until the rail is hovered */}
          <span className="whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
            {label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
