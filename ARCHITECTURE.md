## FitDrip Techstack
```
FRONTEND
Structure  |  jsx markup inside .tsx files
Style      |  tailwind css, shadcn ui
Behaviour  |  typescript + react
Framework  |  next.js (wraps front + back)

BACKEND
user auth      |  supabase auth, google Oauth
logic          |  next.js api routes (typescript, .ts)
database       |  supabase Postgres
image storage  |  supabase storage
AI stylist     |  google gemini api, flash model
bg removal     |  @imgly/background-removal (runs in browser)

APP RUN
local dev  |  npm run dev
deployed   |  vercel
```

Next.js + Vercel
PRO: one project for front and back, one deploy, same language both sides; Vercel made Next.js so no config needed

## Frontend decisions
```
PROBLEM                                                            |  SOLUTION
you update the page by hand                                        |  react js
markup must live in js so react can re-run it, plain js difficult  |  jsx
browsers cant read jsx                                             |  compiler (swc)
js never catches typos                                             |  typescript
react is UI only, no pages/urls backend, build+deploy              |  next.js
unmanageable class naming + inconsistent spacing                   |  tailwind
```

```
REACT
without |  grid.innerHTML = ""  then rebuild all 40 cards by hand
        |  images reload, screen flashes, scroll jumps to top
        |  header count updated separately — forget once and it lies
with    |  {items.map(i => <GarmentCard item={i} />)}
        |  react diffs old vs new, removes only the 32 that changed
        |  count reads from the same list, so it cant disagree

JSX
without |  _jsx("div", { className: "card", children: item.colour })
        |  unreadable past 2 levels of nesting, typos unnoticed
with    |  <div className="card">{item.colour}</div>
        |  real syntax — editor catches typos and unclosed tags

COMPILER
without |  browser hits <div> inside a .js file --> syntax error, page dead
with    |  jsx rewritten to _jsx() calls before the browser ever sees it
        |  also strips the TS type labels in the same pass

TYPESCRIPT
without |  item.color when the column is colour
        |  no error, card renders blank, 20 min hunting the missing u
with    |  red underline as you type: "did you mean colour?"
        |  type item. and the editor lists the real column names

NEXT.JS
without |  react project + separate backend project (like PasswordVault)
        |  two codebases, two deploys, hand-rolled image resizing
with    |  one folder — app/api/ is the backend, <Image> resizes photos
        |  one deploy, vercel recognizes the structure with no config

TAILWIND
without |  invent a name, then keep it in sync across two files
        |  free-typed px values drift — 14px here, 16px there
with    |  <div className="rounded-lg bg-white p-3">
        |  no name, no second file, p-3 comes from a fixed scale
```

## How they stack (Top-down)
```
Next        - framework around React
  React     - the library JSX targets
    JSX     - syntax inside JS/TS files
      TS - layer over JS
```

## Backend decisions
```
DATABASE: supabase
- free tier
- strict table structure — makes wardrobe filtering (type, colour, fit) fast

AUTH: supabase
- free
- same service as database --> user-scoped data w/o additional code
- google as oauth provider, no password handling

IMAGE STORAGE: supabase
- free
- compress in browser before upload (~200KB each)
  --> ~5,000 photos vs ~250 raw
- store the bg-removed image only
- only 1gb; migrate to cloudflare r2 for 10gb if needed

BACKEND: next.js api routes
- sticking to next.js, less component integration problems

AI PROVIDER: google gemini api, flash model
- free tier, fast responses
- large context window — entire wardrobe list fits in one prompt

HOSTING: vercel
- free, made by the same company as next.js

BG REMOVAL: @imgly/background-removal
- runs in browser on user's device — free at any user count
- 3 models to choose from, balance quality vs processing time
- use isnet_quint8 (~42MB download, faster; quality fine at thumbnail size)
- store cut-outs as WebP not PNG — changing later means reprocessing every image
- speed tuning (resize-before-removal, run-after-save, WebGPU) deferred
  until measurably slow
```

## Data model
```
3 tables. no users table — supabase auth provides it.
```

```
ITEMS  (one row per piece)
id          uuid
user_id     uuid
image_path  text    (path to file in bucket, {user_id}/{item_id}.webp)
type        text
colour      text
tags        text[]  ["cropped", "oversized", "chunky"]

NOTE: store the path, not a full url. a url has the mode baked in
(.../object/public/...), so flipping the bucket to private would kill
every stored url. with just the path, the db never changes — the switch
is one function swap: getPublicUrl --> createSignedUrl
```

```
OUTFITS  (one row per saved outfit — its own facts, NOT its contents)
id          uuid
user_id     uuid
name        text
source      text    (manual/ai)

NOTE: items of each outfit are not in the table; item count varies, columns will vary
```

```
OUTFIT_ITEMS  (one row per piece of an outfit)
outfit_id   uuid
item_id     uuid

  outfit_id | item_id
  7         | 12        <- black cropped hoodie
  7         | 34        <- baggy jeans
  7         | 51        <- chunky sneakers
  9         | 12        <- same hoodie, different outfit
```

## Storage layout
```
item bucket

items / {user_id} / {item_id}.webp

items
  └── {user_id} folder
        ├── {item_id}.webp image file   (uuid)
        └── {item_id}.webp
```

```
PUBLIC vs PRIVATE  (chose public for now)

public   permanent url, works for anyone who has it, no login
         simplest code, browser caching + next/image work with no effort
private  url returns unauthorized; code generates a signed link (~1hr)

public bucket = easier code, but any url works for anyone, no login
easier because a public url is instant; a private one must be requested
from supabase, awaited, and re-requested when it expires (~1hr)
```

## AI stylist implementation
```
1. user enters prompt
2. backend sends user-scoped wardrobe + rules + conversation so far to the api
   (invisible to the user — they only ever see their own message)
3. gemini answers with item IDS, not images
4. backend checks those ids exist and belong to this user again (in case gemini hallucinates ids), stores them, frontend renders the images in gemini reply (looks like part of the response)
5. repeat — wardrobe stays the same, conversation grows
```

## Still to decide
```
2. privacy rules    |  the actual "users only see their own rows" policy
                    |  + flip bucket to private at the same time
```
