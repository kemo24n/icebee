"use client";
import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import TreatImg from "@/components/TreatImg";
import { toast, Toaster } from "@/components/Toast";
import { productSpec, type CategoryT, type ProductT, type SizeT } from "@/components/spec";
import { fmt } from "@/lib/format";

const LOOKS = ["softserve", "softserve-cup", "shake", "juice", "coffee", "iced-coffee", "waffle", "crepe", "pancake", "sundae", "cupcake", "croissant", "donut", "cookie", "tub"] as const;
type Cat = CategoryT & { active: boolean };

export default function MenuEditor({ categories, products, flavorsEditor }: { categories: Cat[]; products: ProductT[]; flavorsEditor: React.ReactNode }) {
  const { n, lang } = useLang();
  const ar = lang === "ar";
  const [cats, setCats] = useState(categories);
  const [list, setList] = useState(products);
  const [cat, setCat] = useState(categories[0]?.id);
  const [edit, setEdit] = useState<ProductT | "new" | null>(null);
  const [newCat, setNewCat] = useState(false);
  const c = cats.find((x) => x.id === cat);

  const saveCat = async (id: string, body: Partial<Cat>) => {
    const r = await fetch(`/api/admin/categories/${id}`, { method: "POST", body: JSON.stringify(body) });
    if (r.ok) { const j = await r.json(); setCats(cats.map((x) => (x.id === id ? { ...x, ...j } : x))); toast(ar ? "انحفظ" : "Saved"); }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {cats.map((x) => (
          <button key={x.id} className={`chip shrink-0 py-2 ${x.active ? "" : "opacity-50"}`} aria-pressed={x.id === cat} onClick={() => setCat(x.id)}>{x.icon} {n(x)}</button>
        ))}
        <button className="chip shrink-0 border-dashed py-2" onClick={() => setNewCat(true)}>+ {ar ? "قسم جديد" : "New section"}</button>
      </div>

      {c && !c.isBuilder && (
        <div className="glass flex flex-wrap items-end gap-3 p-4">
          <label className="text-[12px] text-[var(--muted)]">{ar ? "الرمز" : "Icon"}<input className="input mt-1 w-16 text-center" defaultValue={c.icon} key={c.id + "i"} onBlur={(e) => e.target.value !== c.icon && saveCat(c.id, { icon: e.target.value })} /></label>
          <label className="flex-1 text-[12px] text-[var(--muted)]">عربي<input className="input mt-1" defaultValue={c.nameAr} key={c.id + "a"} onBlur={(e) => e.target.value !== c.nameAr && saveCat(c.id, { nameAr: e.target.value })} /></label>
          <label className="flex-1 text-[12px] text-[var(--muted)]">English<input className="input mt-1" dir="ltr" defaultValue={c.nameEn} key={c.id + "e"} onBlur={(e) => e.target.value !== c.nameEn && saveCat(c.id, { nameEn: e.target.value })} /></label>
          <label className="flex items-center gap-2 pb-3 text-[13px]"><input type="checkbox" className="h-4 w-4 accent-[var(--honey)]" checked={c.active} onChange={(e) => saveCat(c.id, { active: e.target.checked })} />{ar ? "ظاهر للزبائن" : "Visible"}</label>
        </div>
      )}

      {c?.isBuilder ? flavorsEditor : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {list.filter((p) => p.categoryId === cat).map((p) => (
            <button key={p.id} onClick={() => setEdit(p)} className={`glass flex flex-col items-center p-3 text-center ${p.active === false ? "opacity-45" : ""}`}>
              <TreatImg spec={productSpec(p)} imageId={p.imageId} alt={n(p)} className="h-[120px] w-[120px] rounded-2xl" size={260} />
              <b className="mt-1">{n(p)}</b>
              <span className="num text-[13px] text-[var(--honey)]">{fmt(p.price)}{p.sizes.length > 1 ? " +" : ""}</span>
              {p.active === false && <span className="pill pill-danger mt-1">{ar ? "مخفي" : "Hidden"}</span>}
            </button>
          ))}
          <button onClick={() => setEdit("new")} className="glass grid min-h-[190px] place-items-center border-dashed text-[var(--muted)]"><span className="text-[34px]">+</span>{ar ? "منتج جديد" : "New product"}</button>
        </div>
      )}

      {edit && cat && (
        <ProductEditor key={edit === "new" ? "new" : edit.id} initial={edit === "new" ? null : edit} categoryId={cat}
          onClose={() => setEdit(null)}
          onSaved={(p, deleted) => { setList((l) => deleted ? l.filter((x) => x.id !== p.id) : l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [...l, p]); setEdit(null); toast(ar ? "انحفظ ✓" : "Saved ✓"); }} />
      )}
      {newCat && <NewCategory onClose={() => setNewCat(false)} onSaved={(x) => { setCats([...cats, { ...x, active: true }]); setCat(x.id); setNewCat(false); }} />}
    </div>
  );
}

function NewCategory({ onClose, onSaved }: { onClose: () => void; onSaved: (c: Cat) => void }) {
  const { lang } = useLang(); const ar = lang === "ar";
  const [f, setF] = useState({ icon: "🍽", nameAr: "", nameEn: "" });
  const save = async () => { const r = await fetch("/api/admin/categories", { method: "POST", body: JSON.stringify(f) }); if (r.ok) onSaved(await r.json()); };
  return (
    <Modal onClose={onClose} title={ar ? "قسم جديد" : "New section"}>
      <div className="flex gap-2">
        <input className="input w-16 text-center" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} aria-label="icon" />
        <input className="input" placeholder="عربي" value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} />
        <input className="input" dir="ltr" placeholder="English" value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} />
      </div>
      <button className="btn btn-honey mt-4 w-full" disabled={!f.nameAr || !f.nameEn} onClick={save}>{ar ? "إضافة" : "Add"}</button>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(0,0,0,.6)] p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="glass max-h-[92dvh] w-full max-w-[760px] overflow-auto p-5" style={{ background: "rgba(255,255,255,.98)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="display text-[22px]">{title}</h2><button className="chip" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

function ProductEditor({ initial, categoryId, onClose, onSaved }: { initial: ProductT | null; categoryId: string; onClose: () => void; onSaved: (p: ProductT, deleted?: boolean) => void }) {
  const { lang } = useLang(); const ar = lang === "ar";
  const [p, setP] = useState<ProductT>(initial ?? { id: "", categoryId, nameAr: "", nameEn: "", descAr: "", descEn: "", price: 20000, sizes: [], look: "shake", color: "#F27D9E", accent: "#FFF6E3", tag: null, imageId: null, active: true });
  const [busy, setBusy] = useState(false);
  const set = (k: Partial<ProductT>) => setP({ ...p, ...k });
  const setSize = (i: number, k: Partial<SizeT>) => set({ sizes: p.sizes.map((z, j) => (j === i ? { ...z, ...k } : z)) });

  const save = async () => {
    setBusy(true);
    const body = { categoryId: p.categoryId, nameAr: p.nameAr, nameEn: p.nameEn, descAr: p.descAr, descEn: p.descEn, price: p.price, sizes: p.sizes, look: p.look, color: p.color, accent: p.accent, tag: p.tag, active: p.active !== false, imageId: p.imageId };
    const r = await fetch(initial ? `/api/admin/products/${initial.id}` : "/api/admin/products", { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    if (r.ok) onSaved(await r.json()); else toast(ar ? "تأكد من الحقول" : "Check the fields");
  };
  const upload = async (file: File) => {
    if (!initial) { toast(ar ? "احفظ المنتج أول" : "Save the product first"); return; }
    const fd = new FormData(); fd.append("file", file); fd.append("productId", initial.id);
    const r = await fetch("/api/admin/images", { method: "POST", body: fd });
    if (r.ok) { const { id } = await r.json(); set({ imageId: id }); toast("✓"); } else toast(ar ? "صورة JPG أو PNG لحد 3MB" : "JPG or PNG up to 3MB");
  };
  const del = async () => {
    if (!initial) return;
    const r = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (r.ok) { const j = await r.json(); onSaved(j.hidden ? { ...p, active: false } : p, !j.hidden); }
  };

  return (
    <Modal onClose={onClose} title={initial ? (ar ? "تعديل منتج" : "Edit product") : (ar ? "منتج جديد" : "New product")}>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-[200px] w-[200px] overflow-hidden rounded-3xl bg-[rgba(120,60,20,.04)]">
            <TreatImg spec={productSpec(p)} imageId={p.imageId} alt="" className="h-full w-full" size={300} />
          </div>
          <label className="btn btn-ghost w-full cursor-pointer py-2.5 text-[13px]">📷 {ar ? "رفع صورة حقيقية" : "Upload real photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {p.imageId && <button className="text-[12px] underline" onClick={() => set({ imageId: null })}>{ar ? "رجّع الـ 3D" : "Use 3D again"}</button>}
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="الاسم بالعربي" value={p.nameAr} onChange={(e) => set({ nameAr: e.target.value })} />
            <input className="input" dir="ltr" placeholder="English name" value={p.nameEn} onChange={(e) => set({ nameEn: e.target.value })} />
            <input className="input" placeholder="وصف قصير" value={p.descAr} onChange={(e) => set({ descAr: e.target.value })} />
            <input className="input" dir="ltr" placeholder="Short description" value={p.descEn} onChange={(e) => set({ descEn: e.target.value })} />
          </div>
          <label className="text-[12px] text-[var(--muted)]">{ar ? "السعر (ل.س)" : "Price (SYP)"}
            <input className="input num mt-1" dir="ltr" inputMode="numeric" value={p.price} onChange={(e) => set({ price: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} />
          </label>
          <div>
            <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--muted)]">{ar ? "الأحجام (الفرق بالسعر)" : "Sizes (price difference)"}
              <button className="chip px-2.5 py-1 text-[12px]" disabled={p.sizes.length >= 5} onClick={() => set({ sizes: [...p.sizes, { key: "S" + (p.sizes.length + 1), nameAr: p.sizes.length ? "كبير" : "وسط", nameEn: p.sizes.length ? "Large" : "Medium", delta: 0 }] })}>+</button>
            </div>
            {p.sizes.map((z, i) => (
              <div key={i} className="mb-1.5 flex gap-1.5">
                <input className="input py-2" value={z.nameAr} onChange={(e) => setSize(i, { nameAr: e.target.value })} aria-label="size ar" />
                <input className="input py-2" dir="ltr" value={z.nameEn} onChange={(e) => setSize(i, { nameEn: e.target.value })} aria-label="size en" />
                <input className="input num w-28 py-2" dir="ltr" value={z.delta} onChange={(e) => setSize(i, { delta: parseInt(e.target.value.replace(/[^\d-]/g, "") || "0", 10) })} aria-label="delta" />
                <button className="chip px-2.5" onClick={() => set({ sizes: p.sizes.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-1 text-[12px] text-[var(--muted)]">{ar ? "شكل الـ 3D (لحد ما ترفع صورة)" : "3D look (until a photo is uploaded)"}</div>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
              {LOOKS.map((l) => (
                <button key={l} onClick={() => set({ look: l })} aria-pressed={p.look === l} className={`rounded-xl p-1 ${p.look === l ? "bg-[rgba(255,107,26,.2)] ring-2 ring-[var(--honey)]" : "bg-[rgba(120,60,20,.04)]"}`} title={l}>
                  <TreatImg spec={productSpec({ look: l, color: p.color, accent: p.accent })} alt={l} className="h-12 w-12" size={140} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px]">
            <label className="flex items-center gap-2">{ar ? "اللون" : "Color"}<input type="color" value={p.color} onChange={(e) => set({ color: e.target.value })} className="h-8 w-10 rounded bg-transparent" /></label>
            <label className="flex items-center gap-2">{ar ? "لون ثاني" : "Accent"}<input type="color" value={p.accent} onChange={(e) => set({ accent: e.target.value })} className="h-8 w-10 rounded bg-transparent" /></label>
            <select className="input w-auto py-2" value={p.tag ?? ""} onChange={(e) => set({ tag: e.target.value || null })} aria-label="tag">
              <option value="">{ar ? "بدون شارة" : "No badge"}</option><option value="signature">{ar ? "توقيعنا" : "Signature"}</option><option value="new">{ar ? "جديد" : "New"}</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--honey)]" checked={p.active !== false} onChange={(e) => set({ active: e.target.checked })} />{ar ? "ظاهر" : "Visible"}</label>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn btn-honey flex-1" disabled={busy || !p.nameAr || !p.nameEn} onClick={save}>{ar ? "حفظ" : "Save"}</button>
            {initial && <button className="btn btn-ghost text-[var(--danger)]" onClick={del}>{ar ? "حذف" : "Delete"}</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
