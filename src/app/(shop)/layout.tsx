import { CartProvider } from "@/components/Cart";
import { ShopHeader, BottomNav } from "@/components/ShopChrome";
import { Toaster } from "@/components/Toast";
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShopHeader />
      <main className="mx-auto max-w-[560px] px-4 pb-32">{children}</main>
      <BottomNav />
      <Toaster />
    </CartProvider>
  );
}
