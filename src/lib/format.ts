export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const TZ = "Asia/Damascus";

/** offset of Damascus time from UTC in ms at instant d */
export function tzOffsetMs(d = new Date()): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(d).filter((x) => x.type !== "literal").map((x) => [x.type, Number(x.value)])
  );
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - Math.floor(d.getTime() / 1000) * 1000;
}
/** start of today in Damascus, as a UTC Date */
export function dayStart(d = new Date()): Date {
  const off = tzOffsetMs(d);
  const local = new Date(d.getTime() + off);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - off);
}
export function hourIn(d: Date): number {
  return new Date(d.getTime() + tzOffsetMs(d)).getUTCHours();
}
export function clock(d: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d));
}
