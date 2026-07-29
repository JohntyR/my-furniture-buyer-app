# Furniture Buyer App

## What this is

A Day 1 hackathon project: a web app for a furniture shop's buyers.

- A user logs in.
- They browse a product catalogue (furniture items with prices) — sourced live from the furniture shop's real catalogue API.
- They place orders, which really debit a real per-event balance via that same API, and can see that balance and their real order history.

The user building this has no coding background — Claude is responsible for writing and explaining all code. Favor simplicity, readability, and minimal setup steps over scalability or best-practice architecture.

## Tech stack

- **Next.js (App Router, JavaScript, not TypeScript)** — combines frontend pages and backend API routes in a single project, single `npm run dev` to start everything.
- **Furniture shop catalogue/order API** (external, real) — the catalogue, balance, and order history all live here now, not in our own database. See `src/lib/productApi.js`. Configured via `PRODUCT_API_BASE_URL` / `PRODUCT_API_USER` / `PRODUCT_API_KEY` in `.env`.
- **SQLite + Prisma** — used only for our own login accounts now (a single `User` table). Single-file database, no install or account needed.
- **Custom session-based login** — plain username/password. Passwords hashed with bcrypt, session tracked via a secure httpOnly cookie. No third-party auth provider — the buyer list is small and internal.
- **Tailwind CSS** — utility classes for styling, avoids hand-written CSS files.

## Folder structure

```
furniture-buyer-app/
├── CLAUDE.md
├── package.json
├── prisma/
│   ├── schema.prisma          # just the User table (login accounts)
│   └── seed.js                # creates a demo login account
├── public/
├── src/
│   ├── app/
│   │   ├── layout.js          # shared page frame (nav bar etc.)
│   │   ├── page.js            # home page: live catalogue + real balance
│   │   ├── login/page.js      # login screen
│   │   ├── orders/page.js     # real order history (from the shop API)
│   │   └── api/
│   │       ├── auth/route.js
│   │       └── orders/route.js  # places a real order via the shop API
│   ├── components/            # reusable UI pieces (ProductCard, BudgetBar, Nav)
│   └── lib/
│       ├── db.js              # Prisma client helper (User table only)
│       ├── auth.js             # login/session helpers
│       └── productApi.js      # client for the furniture shop's catalogue/order API
```

## Conventions

- Plain JavaScript, not TypeScript — keep things easy to read even though the user won't be editing code directly.
- The furniture shop API is a real, live external service tied to one shared event balance — test purchases cost real (event) money. Always use the cheapest item when testing the buy flow.
- The API is scoped to a single participant identity (`PRODUCT_API_USER`/`PRODUCT_API_KEY`), so every local login account that buys something spends against the same shared real balance — there's no per-account balance separation.
- No local storage of catalogue/order data — it's always fetched live from the shop API, never cached in our own database.
- Any style/visual change (animations, scroll effects, decorative elements) must not introduce a meaningful performance problem: prefer `transform`/`opacity` over properties that trigger layout or paint, throttle scroll/resize handlers via `requestAnimationFrame` (never run per-event unthrottled logic), and avoid unbounded DOM growth. If a requested effect would risk noticeable jank or a real performance cost, flag that tradeoff and ask before implementing rather than guessing.
