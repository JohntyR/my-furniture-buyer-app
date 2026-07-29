# Furniture Buyer App

## What this is

A Day 1 hackathon project: a web app for a furniture shop's buyers.

- A user logs in.
- They browse a product catalogue (furniture items with prices).
- They place orders, tracked against a fixed budget (so they can see how much of their budget is left as they order).

The user building this has no coding background — Claude is responsible for writing and explaining all code. Favor simplicity, readability, and minimal setup steps over scalability or best-practice architecture. Avoid introducing external accounts/services unless there's no simpler option.

## Tech stack

- **Next.js (App Router, JavaScript, not TypeScript)** — combines frontend pages and backend API routes in a single project, single `npm run dev` to start everything.
- **SQLite + Prisma** — SQLite is a single-file database, no install or account needed. Prisma is the ORM used to define the schema (Users, Products, Orders) and query it.
- **Custom session-based login** — plain username/password. Passwords hashed with bcrypt, session tracked via a secure httpOnly cookie. No third-party auth provider — the buyer list is small and internal.
- **Tailwind CSS** — utility classes for styling, avoids hand-written CSS files.

## Folder structure

```
furniture-buyer-app/
├── CLAUDE.md
├── package.json
├── prisma/
│   └── schema.prisma          # Users, Products, Orders tables
├── public/                    # static images (product photos, logo)
├── src/
│   ├── app/
│   │   ├── layout.js          # shared page frame (nav bar etc.)
│   │   ├── page.js            # home page
│   │   ├── login/page.js      # login screen
│   │   ├── catalogue/page.js  # browse products
│   │   ├── orders/page.js     # place/view orders + budget tracker
│   │   └── api/                # backend endpoints
│   │       ├── auth/route.js
│   │       ├── products/route.js
│   │       └── orders/route.js
│   ├── components/            # reusable UI pieces (ProductCard, BudgetBar, Nav)
│   └── lib/
│       ├── db.js               # Prisma client helper
│       └── auth.js             # login/session helpers
```

## Conventions

- Plain JavaScript, not TypeScript — keep things easy to read even though the user won't be editing code directly.
- No external services (no Supabase, no OAuth providers, no cloud DB) — everything runs locally with zero account setup, since this is a time-boxed hackathon build.
- Budget tracking: each user has a budget field; placing an order deducts from remaining budget, and an order should be blocked (or at least flagged) if it would exceed the budget.
