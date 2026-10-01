export const EVENT_KINDS = [
  { key: "school", ar: "حفلة مدرسة", en: "School party", icon: "🎓" },
  { key: "birthday", ar: "عيد ميلاد", en: "Birthday", icon: "🎂" },
  { key: "wedding", ar: "عرس وخطبة", en: "Wedding / engagement", icon: "💍" },
  { key: "opening", ar: "افتتاح محل", en: "Store opening", icon: "🎉" },
  { key: "corporate", ar: "شركة أو مؤتمر", en: "Company / conference", icon: "🏢" },
  { key: "other", ar: "غير ذلك", en: "Other", icon: "✨" },
] as const;
export const EVENT_PKGS = [
  { key: "cart", ar: "عربة السوفت آيس", en: "Soft ice cart", descAr: "عربة آيس بي مع موظف، سوفت آيس كريم لكل الضيوف", descEn: "An Ice Bee cart with staff, soft ice cream for every guest", from: 50 },
  { key: "station", ar: "ستيشن آيس بي", en: "Ice Bee station", descAr: "سوفت آيس + سلاش + كريب ووافل مباشر", descEn: "Soft ice + slush + live crêpes and waffles", from: 100 },
  { key: "full", ar: "الباقة الكاملة", en: "The full hive", descAr: "ستيشن كاملة + ديكور آيس بي + الشخصية النحلة", descEn: "Full station + Ice Bee decor + the bee mascot", from: 200 },
] as const;
