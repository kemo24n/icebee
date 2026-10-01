import { db, schema as s } from "@/db";

/**
 * Records an owner alert and, when WhatsApp Cloud API credentials are set,
 * sends it to the owner's WhatsApp number.
 * Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, OWNER_WHATSAPP (e.g. 9639XXXXXXXX)
 */
export async function notifyOwner(kind: string, textAr: string, textEn: string) {
  let sent = false;
  const token = process.env.WHATSAPP_TOKEN, phoneId = process.env.WHATSAPP_PHONE_ID, to = process.env.OWNER_WHATSAPP;
  const muted = kind === "order" && process.env.NOTIFY_ORDERS !== "1";
  if (token && phoneId && to && !muted) {
    try {
      const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: textAr } }),
      });
      sent = r.ok;
    } catch {
      sent = false;
    }
  }
  await db.insert(s.notifications).values({ kind, textAr, textEn, sent });
}
