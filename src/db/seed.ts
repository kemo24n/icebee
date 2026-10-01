import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { db, schema as s } from "./index";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { shortCode } from "../lib/id";

/**
 * Menu = Ice Bee's real menu (from their Instagram MENU / PRODUCTS highlights).
 * Prices are placeholders: Ice Bee doesn't publish prices, the owner sets them in the dashboard.
 * Photos in ./seed-images are Ice Bee's own Instagram posts, used for the private demo only.
 */

const BRANCHES = [
  { slug: "aziziyah", nameAr: "العزيزية", nameEn: "Al-Aziziyah", addressAr: "شارع الهلال، أمام XO", addressEn: "Al-Hilal St, opposite XO" },
  { slug: "citadel", nameAr: "محيط القلعة", nameEn: "Citadel", addressAr: "جانب مطعم بيرويا", addressEn: "Next to Beroea restaurant" },
  { slug: "razi", nameAr: "جسر الرازي", nameEn: "Al-Razi Bridge", addressAr: "شارع الغراند", addressEn: "Grand St" },
  { slug: "muhafaza", nameAr: "المحافظة", nameEn: "Al-Muhafaza", addressAr: "", addressEn: "" },
];

const FLAVORS = [
  { slug: "vanilla", nameAr: "حليب وفانيلا", nameEn: "Milk & vanilla", descAr: "الطعم الكلاسيكي تبع آيس بي", descEn: "The classic Ice Bee taste", color: "#FFF8EA", tag: "signature" },
  { slug: "chocolate", nameAr: "شوكولا", nameEn: "Chocolate", descAr: "شوكولا غنية", descEn: "Rich chocolate", color: "#5B3626", tag: null },
  { slug: "cherry", nameAr: "كرز", nameEn: "Cherry", descAr: "كرز حامض حلو", descEn: "Sweet-sour cherry", color: "#D81B3C", tag: "signature" },
  { slug: "almond", nameAr: "شراب اللوز", nameEn: "Almond syrup", descAr: "شراب اللوز الحلبي", descEn: "Aleppo almond syrup", color: "#F3E3C3", tag: null },
  { slug: "orange", nameAr: "برتقال", nameEn: "Orange", descAr: "منعش", descEn: "Refreshing", color: "#FF8A1C", tag: null },
  { slug: "caramel-cheesecake", nameAr: "كراميل تشيز كيك", nameEn: "Caramel cheesecake", descAr: "جيلاتي بقطع التشيز كيك والكراميل", descEn: "Gelati with cheesecake and caramel", color: "#D9A15B", tag: "new" },
  { slug: "pistachio", nameAr: "فستق حلبي", nameEn: "Aleppo pistachio", descAr: "من مهرجان الفستق الحلبي", descEn: "From the Aleppo pistachio festival", color: "#93C25E", tag: "signature" },
  { slug: "bee-love", nameAr: "Bee Love", nameEn: "Bee Love", descAr: "حليب وكرز وصوص عسل – إصدار محدود", descEn: "Milk, cherry and honey sauce – limited drop", color: "#F59AC0", tag: "drop" },
];

const TOPPINGS = [
  { slug: "oreo", nameAr: "أوريو", nameEn: "Oreo" },
  { slug: "lotus", nameAr: "لوتس", nameEn: "Lotus" },
  { slug: "chocolate-drizzle", nameAr: "صوص شوكولا", nameEn: "Chocolate sauce" },
  { slug: "honey-drizzle", nameAr: "صوص كراميل", nameEn: "Caramel sauce" },
  { slug: "crushed-pistachio", nameAr: "فستق حلبي مطحون", nameEn: "Crushed pistachio" },
  { slug: "cornflakes", nameAr: "كورن فليكس", nameEn: "Cornflakes" },
];

type Sz = { key: string; nameAr: string; nameEn: string; delta: number };
const CONE_CUP: Sz[] = [{ key: "CONE", nameAr: "بسكوت", nameEn: "Cone", delta: 0 }, { key: "CUP", nameAr: "كاسة", nameEn: "Cup", delta: 0 }];
const ML: Sz[] = [{ key: "M", nameAr: "وسط", nameEn: "Medium", delta: 0 }, { key: "L", nameAr: "كبير", nameEn: "Large", delta: 5000 }];
const PLATE_STICK: Sz[] = [{ key: "PLATE", nameAr: "صحن", nameEn: "Plate", delta: 0 }, { key: "STICK", nameAr: "ستيك", nameEn: "Stick", delta: -3000 }];

async function main() {
  const [{ n }] = (await db.execute(sql`select count(*)::int as n from orders where source = 'APP' or source = 'KIOSK'`)).rows as { n: number }[];
  if (n > 50 && process.env.FORCE !== "1") {
    console.error("This database already has real orders. Seeding would wipe them. Run with FORCE=1 if you really mean it.");
    process.exit(1);
  }
  const DEMO = process.env.SEED_DEMO !== "0";
  await db.execute(sql`TRUNCATE events, product_stock, products, categories, votes, poll_options, polls, gifts, order_items, orders, customers, stock, users, notifications, toppings, flavors, branches, images RESTART IDENTITY CASCADE`);

  // photos
  const img: Record<string, string> = {};
  const dir = join(__dirname, "seed-images");
  for (const f of ["p01", "f02", "f03", "f05", "f06", "f07", "f08", "f09", "f11", "m02"]) {
    const path = join(dir, f + ".jpg");
    if (!existsSync(path)) continue;
    const [r] = await db.insert(s.images).values({ mime: "image/jpeg", data: readFileSync(path) }).returning({ id: s.images.id });
    img[f] = r.id;
  }

  const br = await db.insert(s.branches).values(BRANCHES.map((b, i) => ({ ...b, sort: i }))).returning();
  const fl = await db.insert(s.flavors).values(FLAVORS.map((f, i) => ({
    ...f, price: 10000, sort: i, dropEndsAt: f.tag === "drop" ? new Date(Date.now() + 3 * 864e5) : null,
  }))).returning();
  const tp = await db.insert(s.toppings).values(TOPPINGS.map((t, i) => ({ ...t, price: 3000, sort: i }))).returning();

  const cats = await db.insert(s.categories).values([
    { slug: "build", nameAr: "اصنع كاستك", nameEn: "Build your own", icon: "🍦", isBuilder: true, sort: 0 },
    { slug: "soft", nameAr: "سوفت آيس كريم", nameEn: "Soft ice cream", icon: "🍦", sort: 1 },
    { slug: "gelati", nameAr: "جيلاتي كريم", nameEn: "Gelati cream", icon: "🍨", sort: 2 },
    { slug: "slush", nameAr: "سلاش", nameEn: "Slush", icon: "🥤", sort: 3 },
    { slug: "crepe", nameAr: "كريب", nameEn: "Crêpe", icon: "🥞", sort: 4 },
    { slug: "waffle", nameAr: "وافل", nameEn: "Waffle", icon: "🧇", sort: 5 },
    { slug: "bakery", nameAr: "Bee Bakery", nameEn: "Bee Bakery", icon: "🥐", sort: 6 },
    { slug: "hot", nameAr: "مشروبات ساخنة", nameEn: "Hot drinks", icon: "☕", sort: 7 },
    { slug: "ramadan", nameAr: "معروك رمضان", nameEn: "Ramadan maarouk", icon: "🌙", sort: 8, active: false },
  ]).returning();
  const C = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  type P = typeof s.products.$inferInsert;
  const P = (cat: string, nameAr: string, nameEn: string, price: number, look: string, color: string, accent: string, x: Partial<P> = {}): P =>
    ({ categoryId: C[cat], nameAr, nameEn, price, look, color, accent, descAr: "", descEn: "", ...x });
  const prods = await db.insert(s.products).values([
    // soft ice cream
    P("soft", "ميكس حليب وكرز", "Milk & cherry twist", 12000, "softserve", "#FFFDF6", "#E53935", { sizes: CONE_CUP, tag: "signature", imageId: img.f03, descAr: "التويست الأشهر عند آيس بي", descEn: "The famous Ice Bee twist" }),
    P("soft", "ميكس حليب وشوكولا", "Milk & chocolate twist", 12000, "softserve", "#FFFDF6", "#6B3B22", { sizes: CONE_CUP, imageId: img.f08 }),
    P("soft", "سوفت فانيلا", "Vanilla soft serve", 10000, "softserve", "#FFFDF6", "#FFF3DA", { sizes: CONE_CUP }),
    P("soft", "سوفت شوكولا", "Chocolate soft serve", 10000, "softserve", "#7A4A2A", "#5B3626", { sizes: CONE_CUP }),
    P("soft", "سوفت كرز", "Cherry soft serve", 10000, "softserve", "#F06292", "#E53935", { sizes: CONE_CUP }),
    P("soft", "سوفت شراب اللوز", "Almond syrup soft serve", 10000, "softserve", "#FFF3DA", "#E8CFA0", { sizes: CONE_CUP }),
    P("soft", "آيس كريم كوكيز", "Ice cream cookies", 18000, "sundae", "#FFFDF6", "#6B3B22", { tag: "new", imageId: img.f02, descAr: "سوفت آيس مع كوكيز وأوريو", descEn: "Soft ice with cookies and Oreo" }),
    P("soft", "جيلاتي تشيز كيك كراميل", "Cheesecake caramel gelati", 20000, "sundae", "#FFFDF6", "#D9A15B", { tag: "signature", imageId: img.f05, descAr: "طبقات تشيز كيك وكراميل وسوفت آيس", descEn: "Layers of cheesecake, caramel and soft ice" }),
    // gelati cream
    P("gelati", "جيلاتي برتقال", "Orange gelati", 14000, "softserve-cup", "#FFFDF6", "#FF8A1C", {}),
    P("gelati", "جيلاتي كرز", "Cherry gelati", 14000, "softserve-cup", "#FFFDF6", "#D81B3C", {}),
    P("gelati", "جيلاتي شراب اللوز", "Almond syrup gelati", 14000, "softserve-cup", "#FFFDF6", "#E8CFA0", {}),
    // slush
    P("slush", "سلاش كرز", "Cherry slush", 9000, "juice", "#C8102E", "#FFFFFF", { sizes: ML }),
    P("slush", "سلاش برتقال", "Orange slush", 9000, "juice", "#FF8A1C", "#FFFFFF", { sizes: ML }),
    P("slush", "سلاش شراب اللوز", "Almond syrup slush", 9000, "juice", "#F3E3C3", "#FFFFFF", { sizes: ML }),
    P("slush", "سلاش فلوت كرز", "Cherry float", 15000, "shake", "#C8102E", "#FFFFFF", { tag: "new", descAr: "سلاش كرز مع سوفت آيس فوقه", descEn: "Cherry slush topped with soft ice" }),
    // crepe
    P("crepe", "كريب شوكولا", "Chocolate crêpe", 20000, "crepe", "#E7B46A", "#4E2B1C", {}),
    P("crepe", "كريب شوكولا وفانيلا", "Chocolate & vanilla crêpe", 22000, "crepe", "#E7B46A", "#F3E3C3", {}),
    P("crepe", "كريب أوريو", "Oreo crêpe", 23000, "crepe", "#E7B46A", "#1E1410", {}),
    P("crepe", "كريب كراميل لوتس", "Lotus caramel crêpe", 24000, "crepe", "#E7B46A", "#C98540", { tag: "signature" }),
    // waffle
    P("waffle", "وافل سكر أبيض", "Powdered sugar waffle", 15000, "waffle", "#FFFFFF", "#FFF8EA", { sizes: PLATE_STICK }),
    P("waffle", "وافل شوكولا", "Chocolate waffle", 18000, "waffle", "#4E2B1C", "#5B3626", { sizes: PLATE_STICK }),
    P("waffle", "وافل أوريو", "Oreo waffle", 20000, "waffle", "#1E1410", "#FFFDF6", { sizes: PLATE_STICK }),
    P("waffle", "وافل شوكولا وفانيلا", "Chocolate & vanilla waffle", 20000, "waffle", "#4E2B1C", "#FFF8EA", { sizes: PLATE_STICK }),
    // bakery
    P("bakery", "كوكيز", "Cookies", 7000, "cookie", "#D9A15B", "#3B2213", { imageId: img.p01 }),
    P("bakery", "كب كيك شوكولا", "Chocolate cupcake", 9000, "cupcake", "#5B3626", "#E53935", { imageId: img.f07 }),
    P("bakery", "كب كيك ريد فيلفيت", "Red velvet cupcake", 10000, "cupcake", "#A3142C", "#FFFFFF", { tag: "new" }),
    P("bakery", "كب كيك كراميل", "Caramel cupcake", 9000, "cupcake", "#C98540", "#FF6B1A", {}),
    P("bakery", "كب كيك فانيلا", "Vanilla cupcake", 9000, "cupcake", "#F3E3C3", "#1E88E5", {}),
    P("bakery", "كروسان شوكولا", "Chocolate croissant", 9000, "croissant", "#D9952F", "#4E2B1C", { imageId: img.f06 }),
    P("bakery", "كروسان جبنة", "Cheese croissant", 9000, "croissant", "#D9952F", "#D9952F", { imageId: img.f09 }),
    P("bakery", "كروسان زعتر", "Zaatar croissant", 8000, "croissant", "#D9952F", "#4E6B1F", {}),
    P("bakery", "كروسان زيتون", "Olive croissant", 8000, "croissant", "#D9952F", "#2B2B1F", {}),
    P("bakery", "كومبو كروسان وقهوة", "Croissant + coffee combo", 14000, "croissant", "#D9952F", "#D9952F", { tag: "signature", imageId: img.f11, descAr: "سوري، تحلّى الحياة", descEn: "Breakfast, Ice Bee style" }),
    P("bakery", "دونات ستيك شوكولا", "Chocolate donut stick", 8000, "donut", "#5B3626", "#E53935", {}),
    P("bakery", "دونات ستيك كراميل", "Caramel donut stick", 8000, "donut", "#C98540", "#FFFFFF", {}),
    P("bakery", "دونات ستيك فانيلا", "Vanilla donut stick", 8000, "donut", "#FFF3DA", "#E53935", {}),
    P("bakery", "آيس بي كيك", "Ice Bee cake", 12000, "cupcake", "#FFC72C", "#E53935", { tag: "signature" }),
    // hot drinks
    P("hot", "سحلب", "Sahlab", 9000, "coffee", "#F5EBDC", "#C98540", { tag: "signature" }),
    P("hot", "هوت شوكولت", "Hot chocolate", 10000, "coffee", "#5B3626", "#F5EBDC", {}),
    P("hot", "شاي", "Tea", 4000, "coffee", "#8B2E0F", "#8B2E0F", {}),
    // ramadan (seasonal, hidden until the owner turns it on)
    P("ramadan", "معروك جبنة", "Cheese maarouk", 15000, "croissant", "#C98540", "#F5EBDC", { imageId: img.m02 }),
    P("ramadan", "معروك ميلفيه بالكريمة", "Mille-feuille cream maarouk", 18000, "croissant", "#B8743A", "#F5EBDC", { imageId: img.m02 }),
    P("ramadan", "معروك شوكولا كلير", "Chocolate éclair maarouk", 18000, "croissant", "#4E2B1C", "#4E2B1C", { imageId: img.m02 }),
    P("ramadan", "معروك كراميل كروكان", "Caramel crunch maarouk", 18000, "croissant", "#C98540", "#E8B04A", { imageId: img.m02 }),
  ].map((x, i) => ({ ...x, sort: i }))).returning();
  await db.insert(s.productStock).values(br.flatMap((b) => prods.map((p) => ({ branchId: b.id, productId: p.id }))));

  await db.insert(s.stock).values(br.flatMap((b, bi) => fl.map((f, fi) => ({ branchId: b.id, flavorId: f.id, level: 35 + ((bi * 29 + fi * 17) % 60), soldOut: false }))));

  const pin = (p: string) => bcrypt.hashSync(p, 10);
  await db.insert(s.users).values([
    { name: "Owner", role: "OWNER" as const, pinHash: pin("1234") },
    ...br.map((b, i) => ({ name: `Staff ${b.nameEn}`, role: "STAFF" as const, pinHash: pin(String(i + 1).repeat(4)), branchId: b.id })),
  ]);

  // realistic history so dashboards are alive on first open
  const nowMs = Date.now();
  const start = new Date(nowMs - 9 * 3600e3);
  const sellable = prods.filter((p) => !p.categoryId || p.categoryId !== C.ramadan);
  const popular = sellable.filter((p) => p.categoryId === C.soft || p.categoryId === C.slush);
  const counters: Record<string, number> = {};
  let made = 0;
  for (let t = start.getTime(); DEMO && t < nowMs - 10 * 60e3 && made < 900; t += 60e3) {
    const prog = (t - start.getTime()) / (nowMs - start.getTime());
    let k = Math.floor((prog < 0.33 ? 0.5 : prog < 0.66 ? 1 : 1.8) + Math.random());
    while (k-- > 0) {
      const b = br[Math.floor(Math.random() * br.length)];
      counters[b.id] = (counters[b.id] ?? 100) + 1;
      const created = new Date(t + Math.random() * 60e3);
      const lines: { productId: string | null; size: string | null; scoops: string[]; toppings: string[]; price: number; base: "CONE" | "CUP" | "WAFFLE" }[] = [];
      const nItems = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < nItems; j++) {
        if (Math.random() < 0.25) {
          const sc = Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => fl[Math.floor(Math.random() * (fl.length - 1))].id);
          const tops = Math.random() < 0.5 ? [tp[Math.floor(Math.random() * tp.length)].id] : [];
          lines.push({ productId: null, size: null, scoops: sc, toppings: tops, base: Math.random() < 0.5 ? "CONE" : "CUP", price: sc.length * 10000 + tops.length * 3000 });
        } else {
          const pool = Math.random() < 0.6 ? popular : sellable;
          const p = pool[Math.floor(Math.random() * pool.length)];
          lines.push({ productId: p.id, size: p.sizes[0]?.key ?? null, scoops: [], toppings: [], base: "CONE", price: p.price });
        }
      }
      const total = lines.reduce((a, l) => a + l.price, 0);
      const [o] = await db.insert(s.orders).values({
        code: shortCode(), number: counters[b.id], branchId: b.id,
        source: Math.random() < 0.35 ? "APP" : Math.random() < 0.15 ? "KIOSK" : "COUNTER", status: "DONE", total,
        createdAt: created, startedAt: new Date(created.getTime() + 30e3),
        readyAt: new Date(created.getTime() + (90 + Math.random() * 120) * 1e3), doneAt: new Date(created.getTime() + 240e3),
      }).returning();
      await db.insert(s.orderItems).values(lines.map((l) => ({ ...l, orderId: o.id })));
      made++;
    }
  }

  // flavor vote + a few event requests
  const [poll] = await db.insert(s.polls).values({ titleAr: "شو النكهة الجاية؟", titleEn: "What’s next week’s flavor?", endsAt: new Date(Date.now() + 4 * 864e5) }).returning();
  const opts = await db.insert(s.pollOptions).values([
    { pollId: poll.id, nameAr: "سوفت فستق حلبي", nameEn: "Pistachio soft serve", descAr: "على شرف مهرجان الفستق", descEn: "For the pistachio festival", look: "pistachio", color: "#93C25E", sort: 0 },
    { pollId: poll.id, nameAr: "مستكة وورد", nameEn: "Mastic & rose", descAr: "بوظة عربية بالمستكة", descEn: "Arabic mastic booza", look: "vanilla", color: "#FBE7EE", sort: 1 },
    { pollId: poll.id, nameAr: "لوتس", nameEn: "Lotus", descAr: "سوفت لوتس مع قطع البسكويت", descEn: "Lotus soft serve with biscuit", look: "caramel-cheesecake", color: "#C98540", sort: 2 },
    { pollId: poll.id, nameAr: "رمان حلبي", nameEn: "Aleppo pomegranate", descAr: "سلاش رمان حامض حلو", descEn: "Sweet-sour pomegranate slush", look: "cherry", color: "#B3122E", sort: 3 },
  ]).returning();
  const w = DEMO ? [44, 23, 31, 18] : [0, 0, 0, 0];
  const seedVotes = opts.flatMap((o, i) => Array.from({ length: w[i] }, (_, k) => ({ pollId: poll.id, optionId: o.id, voter: `seed-${i}-${k}` })));
  if (seedVotes.length) await db.insert(s.votes).values(seedVotes);

  if (DEMO) {
    const cs = Array.from({ length: 1860 }, (_, i) => ({ phone: "96399" + String(1000000 + i * 37), points: (i * 7) % 11 }));
    for (let i = 0; i < cs.length; i += 500) await db.insert(s.customers).values(cs.slice(i, i + 500));
  }
  if (DEMO) await db.insert(s.events).values([
    { name: "أبو سامر (تجريبي)", phone: "963944000111", kind: "school", pkg: "station", date: new Date(Date.now() + 5 * 864e5), guests: 350, location: "الحمدانية", notes: "حفلة تخرج، بدنا الشخصية النحلة إذا ممكن" },
    { name: "ريم (تجريبي)", phone: "963955000222", kind: "birthday", pkg: "cart", date: new Date(Date.now() + 9 * 864e5), guests: 60, location: "الفرقان", notes: "" },
  ]);

  await db.insert(s.notifications).values([{ kind: "summary", textAr: "صباح الخير! ملخص مبارح جاهز بلوحة المالك.", textEn: "Good morning! Yesterday's summary is ready on the dashboard." }]);
  console.log(`Seeded ${br.length} branches, ${fl.length} flavors, ${prods.length} products, ${Object.keys(img).length} photos, ${made} orders.`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
void eq;
