import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhilatelyDetailModal } from "@/components/shop/PhilatelyDetailModal";
import { ShopCover } from "@/components/shop/ShopPlaceholder";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { shopApi, type Stamp } from "@/lib/shop-data";

export const Route = createFileRoute("/philately")({
  component: PhilatelyPage,
  head: () => ({ meta: [{ title: "Филателия — БЕЛПОЧТА" }] }),
});

const CATEGORIES = [
  { id: "все", label: "Все" },
  { id: "марка", label: "Марки" },
  { id: "конверт", label: "Конверты" },
  { id: "открытка", label: "Открытки" },
  { id: "блок", label: "Блоки" },
  { id: "сувенир", label: "Сувениры" },
];

function PhilatelyPage() {
  const { tr } = useApp();
  const [items, setItems] = useState<Stamp[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("все");
  const [year, setYear] = useState<number | "all">("all");
  const [detail, setDetail] = useState<Stamp | null>(null);

  useEffect(() => {
    void shopApi.stamps().then(setItems);
  }, []);

  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b - a), [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchQ = i.title.toLowerCase().includes(query.toLowerCase());
      const matchC = category === "все" || i.category === category;
      const matchY = year === "all" || i.year === year;
      return matchQ && matchC && matchY;
    });
  }, [items, query, category, year]);

  return (
    <SiteLayout>
      <div className="shop-page enterprise-shop">
        <header className="shop-hero">
          <h1 className="section-title">{tr("philately", "title")}</h1>
          <p className="shop-hero-sub">Коллекционные марки, конверты и сувенирная продукция Белпочты.</p>
        </header>

        <div className="shop-filters">
          <div className="search-field shop-search">
            <Search className="search-icon" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("philately", "search")} className="search-input shop-search-input" />
          </div>
          <div className="section-tabs shop-tabs-scroll">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`section-tab ${category === c.id ? "is-active" : ""}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="section-tabs shop-tabs-scroll">
            <button type="button" onClick={() => setYear("all")} className={`section-tab ${year === "all" ? "is-active" : ""}`}>Все годы</button>
            {years.map((y) => (
              <button key={y} type="button" onClick={() => setYear(y)} className={`section-tab ${year === y ? "is-active" : ""}`}>{y}</button>
            ))}
          </div>
        </div>

        <div className="shop-grid">
          {filtered.map((item) => (
            <button key={item.id} type="button" className="shop-product-card" onClick={() => setDetail(item)}>
              <ShopCover src={item.image} alt={item.title} kind="stamp" />
              <div className="shop-product-body">
                <span className="price-chip">{item.category} · {item.year}</span>
                <h3 className="shop-product-title">{item.title}</h3>
                <p className="shop-product-price">{item.price.toFixed(2)} BYN</p>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p className="shop-empty">По вашему запросу ничего не найдено.</p>}
      </div>

      <PhilatelyDetailModal item={detail} onClose={() => setDetail(null)} />
    </SiteLayout>
  );
}
