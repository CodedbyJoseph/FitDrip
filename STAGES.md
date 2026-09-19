## STAGES OF DEVELOPMENT
```
Stage 0: npx create next app to initialize proper folder/file names and starting code, npm install dependencies

STAGE          |  COMPONENTS                                          |  RUN/TEST
1. UI          |  next.js, react, tailwind                            |  mock item list, npm run dev
2. auth        |  supabase auth, google oauth                         |  log in/out, session persists
3. save items  |  items table, rls, supabase bucket, img process      |  real uploads replace mock data
4. outfits     |  outfits + outfit_items tables, rls, outfit builder  |  save and reload an outfit
5. ai stylist  |  app/api/stylist/route.ts, gemini                    |  chat returns owned item ids, saveable outfit
6. deploy      |  ux pass, push to vercel                             |  vercel --prod, works on mobile browser
7. create PWA  |  manifest, icons, redeploy                           |  mobile PWA
```