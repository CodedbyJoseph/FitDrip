## FitDrip Techstack
```
FRONTEND
Structure  |  jsx markup inside .tsx files
Style      |  tailwind css, shadcn ui
Behaviour  |  typescript + react
Framework  |  next.js (wraps front + backend as next.js app)

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

## Frontend Decisions
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

## Backend Decisions
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

## Data Model
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
outfit_id   uuid    --> outfits.id
item_id     uuid    --> items.id

NOTE: both are foreign keys — copies of another table's id

  outfit_id | item_id
  7         | 12        <- black cropped hoodie
  7         | 34        <- baggy jeans
  7         | 51        <- chunky sneakers
  9         | 12        <- same hoodie, different outfit
```

## Image Storage
```
"item" bucket: holds the actual image files

items / {user_id} / {item_id}.webp

items
  └── {user_id} folder
        ├── {item_id}.webp image file   (uuid)
        └── {item_id}.webp
```

## AI Stylist Implementation
```
1. user enters prompt
2. backend sends user-scoped wardrobe + rules + conversation so far to the api
   (invisible to the user — they only ever see their own message)
3. gemini answers with item IDS, not images
4. backend checks those ids exist and belong to this user again (in case gemini hallucinates ids), stores them, frontend renders the images in gemini reply (looks like part of the response)
5. repeat — wardrobe stays the same, conversation grows
```

## Security Model - Supabase Postgres
```
THE PIECES
anon key  |  public in js, allows talking to supabase project
             (frontend starts google login; supabase issues the session token)
RLS       |  on, denies data access by default
             — implement policies: logged in user can only read/change own data (based on verified session token)
             — public anon key harmless: logged out returns nothing, logged in returns only that user's rows

RESULT: browser talks to the database directly, not backend; RLS decides what it gets.
```

```
TABLE POLICIES  (allow all SQL operations — select/insert/update/delete)
items         |  user_id = auth.uid()
outfits       |  user_id = auth.uid()
outfit_items  |  check outfit_id, which equals outfits.id, then check
                 outfits.user_id = auth.uid()
                 
*logged in users can only operate on their own data
```

## Security Model - Supabase Storage
```
- private bucket, blocks data access (similar to rls with anon)
- requires policy to override rule
- prevents unathorized users from accessing others' data
```

```
STORAGE POLICY  (all operations)
items bucket  |  the first folder in the path must = auth.uid()     -->{ user_id}/{item_id}.webp

*logged in users can only reach files inside their own folder
```

```
Note: the alternative was service_role in api routes — verify the token,
extract the uuid, scope every query by hand (the PasswordVault_v1 model,
minus FastAPI). chose RLS instead, less code, less error prone.
```
