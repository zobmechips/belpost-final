import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FluidModal } from "@/components/belpost/FluidModal";
import { MagneticCard } from "@/components/belpost/MagneticCard";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
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
  const { tr, addToCart } = useApp();
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
      <div className="shop-page mx-auto max-w-[1200px] px-6 py-8">
        <ScrollReveal>
          <h1 className="section-title mb-2">{tr("philately", "title")}</h1>
          <p className="mb-6 text-slate-600">Коллекционные марки, конверты и сувенирная продукция Белпочты с доставкой по всей стране.</p>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="shop-toolbar mb-6 flex flex-wrap gap-3">
            <div className="search-field relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("philately", "search")} className="search-input w-full pl-10" />
            </div>
            <div className="section-tabs flex-wrap">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`section-tab ${category === c.id ? "is-active" : ""}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="section-tabs flex-wrap">
              <button type="button" onClick={() => setYear("all")} className={`section-tab ${year === "all" ? "is-active" : ""}`}>Все годы</button>
              {years.map((y) => (
                <button key={y} type="button" onClick={() => setYear(y)} className={`section-tab ${year === y ? "is-active" : ""}`}>{y}</button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ScrollRevealItem key={item.id} className="h-full">
              <MagneticCard
                className="shop-card p-0"
                onClick={() => setDetail(item)}
                footer={
                  <button
                    type="button"
                    className="add-cart-btn w-full justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ id: item.id, title: item.title, price: item.price });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> {tr("philately", "add")}
                  </button>
                }
              >
                <img src={item.image} alt={item.title} className="shop-cover h-44 w-full object-cover" />
                <div className="p-4">
                  <span className="price-chip">{item.category} · {item.year}</span>
                  <h3 className="mt-2 line-clamp-2 font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-2 text-lg font-bold text-brand">{item.price.toFixed(2)} BYN</p>
                </div>
              </MagneticCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>

        {filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">По вашему запросу ничего не найдено.</p>
        )}
      </div>

      <FluidModal open={!!detail} title={detail?.title ?? ""} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <img src={detail.image} alt="" className="mb-4 max-h-56 w-full rounded-xl object-cover" />
            <p className="text-sm text-slate-600">{detail.category}, {detail.year}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail.description}</p>
            <p className="mt-4 text-xl font-bold text-brand">{detail.price.toFixed(2)} BYN</p>
          </>
        )}
      </FluidModal>
    </SiteLayout>
  );
}
