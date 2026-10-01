"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { CartItemT } from "./spec";

type Cart = { branchId: string | null; items: CartItemT[] };
type Ctx = Cart & {
  setBranch: (id: string) => void; add: (it: CartItemT) => void; remove: (i: number) => void; setQty: (i: number, q: number) => void; clear: () => void; count: number;
};
const C = createContext<Ctx | null>(null);
const KEY = "ib_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ branchId: null, items: [] });
  useEffect(() => { try { const s = localStorage.getItem(KEY); if (s) setCart(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} }, [cart]);
  const v: Ctx = {
    ...cart,
    count: cart.items.reduce((a, b) => a + b.qty, 0),
    setBranch: (id) => setCart((c) => ({ ...c, branchId: id })),
    add: (it) => setCart((c) => ({ ...c, items: [...c.items, it] })),
    remove: (i) => setCart((c) => ({ ...c, items: c.items.filter((_, k) => k !== i) })),
    setQty: (i, q) => setCart((c) => ({ ...c, items: c.items.map((x, k) => (k === i ? { ...x, qty: Math.max(1, Math.min(20, q)) } : x)) })),
    clear: () => setCart((c) => ({ ...c, items: [] })),
  };
  return <C.Provider value={v}>{children}</C.Provider>;
}
export function useCart() { const c = useContext(C); if (!c) throw new Error("CartProvider missing"); return c; }
