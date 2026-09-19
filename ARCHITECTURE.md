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

## Dependencies
```
MACHINE
node, npm, git

PROJECT
next, react, react-dom     |  framework, ui library
typescript, @types/*       |  types
tailwindcss                |  styling
@supabase/supabase-js      |  database, auth, storage
@supabase/ssr              |  reads the session inside route.ts
@imgly/background-removal  |  cut-out
browser-image-compression  |  shrink before upload
@google/genai              |  gemini
shadcn ui                  |  prebuilt components
```

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
without |  after any change, wipe the page and rebuild every element by hand (slow, redundant reloads)
with    |  describe the page once as a list, react handles updating it by comparing old vs new

JSX
without |  markup written as nested function calls, unreadable past two levels of nesting
with    |  markup written as html-looking tags inside the js file

COMPILER
without |  browser cannot parse jsx html-markup
with    |  converts tags into native function calls before the browser sees them

TYPESCRIPT
without |  misspell a column name and nothing signals error
with    |  red underline as you type, correct spelling suggested

NEXT.JS
without |  react is ui only — no urls/pages, no server side (must build routing and api layer yourself)
with    |  folder names become urls, the api folder is the backend (simply integrated backend)

TAILWIND
without |  invent a class name, then keep it in sync across two files
with    |  style applied on the element itself using preset shorthand names
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

```
Note: the alternative was service_role in api routes — verify the token,
extract the uuid, scope every query by hand (the PasswordVault_v1 model,
minus FastAPI). chose RLS instead, less code, less error prone.
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

## PWA
```
installed from the mobile browser via "add to home screen".

Additions:

app/manifest.ts   |  appearance and behaviour of PWA (name, icon, splash screen)
public/icons      |  the picture on the home screen (iphone needs its own copy)

iphone installs with just those two. android also wants a service worker
(@serwist/next) before it offers to install — a background script normally used
for offline mode. not worth chasing here: the wardrobe photos live online, so
offline would show empty boxes anyway.
```

## Project Tree (TENTATIVE)
```
fitdrip/
├── app/                          <- folder path = url. next.js reads this
│   ├── layout.tsx                root shell (html, fonts, nav)
│   ├── globals.css               the one css file (tailwind import)
│   ├── page.tsx                  /                   landing
│   ├── wardrobe/page.tsx         /wardrobe           grid + filters
│   ├── upload/page.tsx           /upload             photo + tagging
│   ├── outfits/page.tsx          /outfits            saved outfits
│   ├── outfits/builder/page.tsx  /outfits/builder    manual builder
│   ├── stylist/page.tsx          /stylist            ai chat
│   ├── manifest.ts               pwa - makes "add to home screen" open as an app
│   └── api/
│       └── stylist/route.ts      SERVER ONLY - holds GEMINI_API_KEY
│
├── components/                   reusable ui, imported by pages
│   ├── GarmentCard.tsx           used in wardrobe + builder + chat
│   ├── TagChips.tsx              tap-to-select tags, no free text
│   ├── FilterBar.tsx
│   ├── OutfitCard.tsx
│   └── ChatMessage.tsx
│
├── lib/                          shared logic, no ui
│   ├── supabase.ts               browser client (anon key)
│   ├── supabase-server.ts        route client, takes the user's token
│   ├── images.ts                 getImageUrl() - batched signed urls
│   ├── upload.ts                 compress > bg removal > upload > insert
│   └── types.ts                  generated from supabase tables
│
├── public/                       static files served as-is
│   ├── icon-192.png              android home screen
│   ├── icon-512.png              splash screen
│   └── apple-touch-icon.png      ios home screen
├── .env.local                    keys, GIT IGNORED
├── package.json                  lists "next" - this is what makes it a next.js app; requirements file
├── tsconfig.json
├── next.config.ts
└── ARCHITECTURE.md
```

```
NAMING IS THE CONFIG  (next.js + vercel convention, not a rule of js)
page.tsx    |  a visitable url. shipped to the browser
route.ts    |  an api endpoint. runs on the server, never shipped
layout.tsx  |  wraps every page below it in the folder
folder name |  becomes the url segment

components/ and lib/ are just imports — they get bundled INTO whichever
side imports them. a lib file imported by a page ends up in the browser.
--> read GEMINI_API_KEY inside route.ts itself, never from a lib/ file
```
