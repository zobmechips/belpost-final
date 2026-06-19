import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SubscriptionDetailModal } from "@/components/shop/SubscriptionDetailModal";
import { ShopCover } from "@/components/shop/ShopPlaceholder";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { shopApi, type Publication } from "@/lib/shop-data";

export const Route = createFileRoute("/subscription")({
  component: SubscriptionPage,
  head: () => ({ meta: [{ title: "Подписка на издания — БЕЛПОЧТА" }] }),
});

const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "sport", label: "Спорт" },
  { id: "politics", label: "Политика" },
  { id: "kids", label: "Детские" },
  { id: "culture", label: "Культура" },
];

const PERIOD_FILTERS = [
  { id: "all", label: "Все периоды" },
  { id: "month", label: "Месяц" },
  { id: "half", label: "Полгода" },
];

function SubscriptionPage() {
  const { tr } = useApp();
  const [items, setItems] = useState<Publication[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [year, setYear] = useState<number | "all">("all");
  const [period, setPeriod] = useState<"all" | "month" | "half">("all");
  const [detail, setDetail] = useState<Publication | null>(null);

  useEffect(() => {
    void shopApi.publications().then(setItems);
  }, []);

  const years = useMemo(() => [...new Set(items.map((i) => i.year).filter(Boolean))].sort((a, b) => (b as number) - (a as number)), [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchQ = i.title.toLowerCase().includes(query.toLowerCase());
      const matchC = category === "all" || i.category === category;
      const matchY = year === "all" || i.year === year;
      const matchP = period === "all" || (period === "month" && i.price > 0) || (period === "half" && i.priceHalfYear > 0);
      return matchQ && matchC && matchY && matchP;
    });
  }, [items, query, category, year, period]);

  const displayPrice = (pub: Publication) => {
    if (period === "half") return `от ${pub.priceHalfYear.toFixed(2)} BYN / 6 мес.`;
    return `от ${pub.price.toFixed(2)} BYN`;
  };

  return (
    <SiteLayout>
      <div className="shop-page enterprise-shop">
        <header className="shop-hero">
          <h1 className="section-title">{tr("subscription", "title")}</h1>
          <p className="shop-hero-sub">{tr("sections", "subscriptionDesc")}</p>
        </header>

        <div className="shop-filters">
          <div className="search-field shop-search">
            <Search className="search-icon" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("subscription", "search")} className="search-input shop-search-input" />
          </div>
          <div className="section-tabs shop-tabs-scroll">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`section-tab ${category === c.id ? "is-active" : ""}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="section-tabs shop-tabs-scroll">
            {PERIOD_FILTERS.map((p) => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id as typeof period)} className={`section-tab ${period === p.id ? "is-active" : ""}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="section-tabs shop-tabs-scroll">
            <button type="button" onClick={() => setYear("all")} className={`section-tab ${year === "all" ? "is-active" : ""}`}>Все годы</button>
            {years.map((y) => (
              <button key={y} type="button" onClick={() => setYear(y as number)} className={`section-tab ${year === y ? "is-active" : ""}`}>{y}</button>
            ))}
          </div>
        </div>

        <div className="shop-grid">
          {filtered.map((pub) => (
            <button key={pub.id} type="button" className="shop-product-card" onClick={() => setDetail(pub)}>
              <ShopCover src={pub.cover} alt={pub.title} kind="publication" />
              <div className="shop-product-body">
                <span className="price-chip">{pub.type === "newspaper" ? tr("subscription", "newspaper") : tr("subscription", "magazine")}{pub.year ? ` · ${pub.year}` : ""}</span>
                <h3 className="shop-product-title">{pub.title}</h3>
                <p className="shop-product-price">{displayPrice(pub)}</p>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p className="shop-empty">По вашему запросу ничего не найдено.</p>}
      </div>

      <SubscriptionDetailModal item={detail} onClose={() => setDetail(null)} />
    </SiteLayout>
  );
}
