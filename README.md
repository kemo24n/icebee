# Ice Bee Hive

One system for every Ice Bee branch in Aleppo: customer app, self-order kiosk, branch order screens, owner dashboard and in-store TV screens. Arabic first, English second.

Built by Solunera · Kamel Nassif · @soluneragency

## What's inside

| Who | Address | What it does |
|---|---|---|
| Customers | `/` | Home with live 3D ice cream, limited drop with countdown, live crowd level per branch, menu |
| | `/#menu` | Ice Bee's real menu by section: build-your-own, soft ice cream, gelati cream, slush, crêpe, waffle, Bee Bakery, hot drinks (Ramadan maarouk is hidden until the owner turns it on). Tap a product for its photo/3D view, size and quantity |
| | `/build` | 3D builder: pick base, up to 3 scoops, toppings; spin it with a finger |
| | `/cart` | Order, pick the branch, phone number for honey points, pay cash at pickup |
| | `/order/CODE` | Live order tracking (received → preparing → ready) |
| | `/hive` | Honey points (10 orders = free ice cream) |
| | `/vote` | Vote for next week's flavor |
| | `/events` | Event & party booking (schools, weddings, birthdays, openings) with packages; requests land in the owner dashboard |
| | `/gift/new` | Send an ice cream as a gift: pay at any branch, share on WhatsApp |
| Kiosk | `/kiosk/BRANCH` | Touchscreen self-order in the shop (attract screen, auto-reset) |
| Staff | `/staff` | PIN login, live orders per branch with sound, counter orders, gifts, sold-out button, stock |
| Owner | `/admin` | Sales today, by hour, by branch, best sellers, live orders, low stock, WhatsApp alert feed. **Products tab:** add/rename/hide menu sections, add/edit/delete products (names, descriptions, price, sizes, badge, 3D look and colors, real photo) and flavor prices/photos |
| TV | `/screen/BRANCH/menu` | Animated 3D menu board with QR code |
| | `/screen/BRANCH/orders` | "Preparing / Ready" numbers with chime |

Branch slugs: `aziziyah`, `citadel`, `razi`, `muhafaza`.

Demo PINs (change them before going live, see below): owner `1234`, Al-Aziziyah `1111`, Citadel `2222`, Al-Razi `3333`, Al-Muhafaza `4444`.

The menu items come from Ice Bee's Instagram menu. **Prices are placeholders** (Ice Bee doesn't publish prices): set the real ones in the Products tab.

**Photos:** `src/db/seed-images/` holds product photos taken from Ice Bee's own Instagram posts, for the private demo shown to Ice Bee only. Don't publish the demo with them; replace them with photos the owner provides.

No online payment: customers pay cash at the counter. Product images are real-time 3D renders until the owner uploads real photos from the dashboard (Products tab).

## Run it on your computer

Needs Node 20+ and a PostgreSQL database (a free Supabase project works).

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:push             # creates the tables
npm run db:seed             # branches, flavors, PINs + demo sales (SEED_DEMO=0 for no demo data)
npm run dev                 # http://localhost:3000
```

## Put it online (Supabase + Render)

1. **Supabase**: create a project (region: Frankfurt is closest). Go to Project Settings → Database → Connection string. Copy the **Transaction pooler** string (port 6543) for `DATABASE_URL` and the **Session pooler** string (port 5432) for `DIRECT_URL`. Put your database password in both.
2. On your computer, put those two strings in `.env` and run `npm run db:push` then `npm run db:seed`.
3. Push this folder to a GitHub repository.
4. **Render**: New → Blueprint → pick the repository. Render reads `render.yaml`. Fill in `DATABASE_URL`, `DIRECT_URL` and `PUBLIC_URL` (your Render address, e.g. `https://ice-bee.onrender.com`). Deploy.
5. Change the PINs: `npm run pin -- owner 482913` and `npm run pin -- aziziyah 7731` (one per branch).

Render's free plan sleeps after 15 minutes without visitors, so the first open takes ~30 seconds. Use a paid plan for the real launch.

## WhatsApp alerts

Alerts always appear in the dashboard's WhatsApp panel. To also send them to the owner's real WhatsApp, create a WhatsApp Cloud API app on Meta for Developers and set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` and `OWNER_WHATSAPP`. Set `NOTIFY_ORDERS=1` to get a message for every app/kiosk order (off by default to avoid spam).

## Tech

Next.js 15 (App Router) · TypeScript · Tailwind 4 · Drizzle ORM + PostgreSQL · three.js · installable as a phone app (PWA).
