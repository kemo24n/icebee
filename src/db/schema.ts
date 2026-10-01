import { pgTable, text, integer, boolean, timestamp, primaryKey, pgEnum, index, customType, jsonb } from "drizzle-orm/pg-core";
import { createId } from "../lib/id";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const roleEnum = pgEnum("role", ["OWNER", "STAFF"]);
export const statusEnum = pgEnum("order_status", ["NEW", "PREPARING", "READY", "DONE", "CANCELLED"]);
export const sourceEnum = pgEnum("order_source", ["APP", "KIOSK", "COUNTER"]);
export const baseEnum = pgEnum("base", ["CONE", "CUP", "WAFFLE"]);

const id = () => text("id").primaryKey().$defaultFn(createId);

export const branches = pgTable("branches", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  addressAr: text("address_ar").notNull().default(""),
  addressEn: text("address_en").notNull().default(""),
  isOpen: boolean("is_open").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const flavors = pgTable("flavors", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  color: text("color").notNull().default("#F7B500"),
  tag: text("tag"), // signature | new | drop
  price: integer("price").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  imageId: text("image_id"),
  dropEndsAt: timestamp("drop_ends_at", { withTimezone: true }),
});

export const toppings = pgTable("toppings", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  price: integer("price").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const stock = pgTable("stock", {
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  flavorId: text("flavor_id").notNull().references(() => flavors.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(100),
  soldOut: boolean("sold_out").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.branchId, t.flavorId] })]);

export const customers = pgTable("customers", {
  id: id(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: id(),
  code: text("code").notNull().unique(),
  number: integer("number").notNull(),
  branchId: text("branch_id").notNull().references(() => branches.id),
  customerId: text("customer_id").references(() => customers.id),
  source: sourceEnum("source").notNull().default("APP"),
  status: statusEnum("status").notNull().default("NEW"),
  total: integer("total").notNull(),
  note: text("note"),
  usedReward: boolean("used_reward").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  readyAt: timestamp("ready_at", { withTimezone: true }),
  doneAt: timestamp("done_at", { withTimezone: true }),
}, (t) => [index("orders_branch_status").on(t.branchId, t.status), index("orders_created").on(t.createdAt)]);

export const categories = pgTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon").notNull().default("🍦"),
  isBuilder: boolean("is_builder").notNull().default(false), // the scoop builder category
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export type Size = { key: string; nameAr: string; nameEn: string; delta: number };
export const products = pgTable("products", {
  id: id(),
  categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  price: integer("price").notNull(),
  sizes: jsonb("sizes").$type<Size[]>().notNull().default([]),
  look: text("look").notNull().default("sundae"), // 3D model used until a photo is uploaded
  color: text("color").notNull().default("#F7B500"),
  accent: text("accent").notNull().default("#FFF1D6"),
  tag: text("tag"),
  imageId: text("image_id"),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const productStock = pgTable("product_stock", {
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  soldOut: boolean("sold_out").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.branchId, t.productId] })]);

export const orderItems = pgTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id"),
  size: text("size"),
  base: baseEnum("base").notNull().default("CONE"),
  scoops: text("scoops").array().notNull(),
  toppings: text("toppings").array().notNull(),
  qty: integer("qty").notNull().default(1),
  price: integer("price").notNull(),
});

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull(),
  pinHash: text("pin_hash").notNull(),
  branchId: text("branch_id").references(() => branches.id),
});

export const notifications = pgTable("notifications", {
  id: id(),
  kind: text("kind").notNull(),
  textAr: text("text_ar").notNull(),
  textEn: text("text_en").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const images = pgTable("images", {
  id: id(),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const giftStatusEnum = pgEnum("gift_status", ["PENDING", "ACTIVE", "REDEEMED", "CANCELLED"]);
export const gifts = pgTable("gifts", {
  id: id(),
  payCode: text("pay_code").notNull().unique(), // shown at the counter to pay
  redeemCode: text("redeem_code").notNull().unique(), // only the receiver sees this
  fromName: text("from_name").notNull(),
  toName: text("to_name").notNull(),
  message: text("message").notNull().default(""),
  base: baseEnum("base").notNull(),
  scoops: text("scoops").array().notNull(),
  toppings: text("toppings").array().notNull(),
  price: integer("price").notNull(),
  status: giftStatusEnum("status").notNull().default("PENDING"),
  paidBranchId: text("paid_branch_id").references(() => branches.id),
  redeemedOrderId: text("redeemed_order_id").references(() => orders.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
});

export const polls = pgTable("polls", {
  id: id(),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
});
export const pollOptions = pgTable("poll_options", {
  id: id(),
  pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descAr: text("desc_ar").notNull().default(""),
  descEn: text("desc_en").notNull().default(""),
  look: text("look").notNull(), // slug of a 3D look
  color: text("color").notNull(),
  sort: integer("sort").notNull().default(0),
});
export const votes = pgTable("votes", {
  pollId: text("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  voter: text("voter").notNull(),
  optionId: text("option_id").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.pollId, t.voter] })]);

export const eventStatusEnum = pgEnum("event_status", ["NEW", "CONFIRMED", "DONE", "DECLINED"]);
export const events = pgTable("events", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  kind: text("kind").notNull(), // school | birthday | wedding | opening | corporate | other
  pkg: text("pkg").notNull(), // cart | station | full
  date: timestamp("date", { withTimezone: true }).notNull(),
  guests: integer("guests").notNull(),
  location: text("location").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: eventStatusEnum("status").notNull().default("NEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
