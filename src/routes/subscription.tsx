import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FluidModal } from "@/components/belpost/FluidModal";
import { MagneticCard } from "@/components/belpost/MagneticCard";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
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

function SubscriptionPage() {
  const { tr, addToCart } = useApp();
  const [items, setItems] = useState<Publication[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState<"month" | "half">("month");
  const [detail, setDetail] = useState<Publication | null>(null);

  useEffect(() => {
    void shopApi.publications().then(setItems);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchQ = i.title.toLowerCase().includes(query.toLowerCase());
      const matchC = category === "all" || i.category === category;
      return matchQ && matchC;
    });
  }, [items, query, category]);

  const subscribe = (pub: Publication) => {
    const price = period === "month" ? pub.price : pub.priceHalfYear;
    const title = `${pub.title} (${period === "month" ? "1 мес." : "6 мес."})`;
    addToCart({ id: `${pub.id}-${period}`, title, price });
  };

  return (
    <SiteLayout>
      <div className="shop-page mx-auto max-w-[1200px] px-6 py-8">
        <ScrollReveal>
          <h1 className="section-title mb-2">{tr("subscription", "title")}</h1>
          <p className="mb-6 text-slate-600">{tr("sections", "subscriptionDesc")}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="shop-toolbar mb-6 flex flex-wrap gap-3">
            <div className="search-field flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("subscription", "search")} className="search-input w-full pl-10" />
            </div>
            <div className="section-tabs">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`section-tab ${category === c.id ? "is-active" : ""}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="section-tabs">
              <button type="button" onClick={() => setPeriod("month")} className={`section-tab ${period === "month" ? "is-active" : ""}`}>За месяц</button>
              <button type="button" onClick={() => setPeriod("half")} className={`section-tab ${period === "half" ? "is-active" : ""}`}>За полгода</button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((pub) => (
            <ScrollRevealItem key={pub.id} className="h-full">
              <MagneticCard
                className="shop-card p-0"
                onClick={() => setDetail(pub)}
                footer={
                  <button
                    type="button"
                    className="add-cart-btn w-full justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      subscribe(pub);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> {tr("subscription", "add")}
                  </button>
                }
              >
                <img src={pub.cover} alt={pub.title} className="shop-cover h-44 w-full object-cover" />
                <div className="p-4">
                  <span className="price-chip">{pub.type === "newspaper" ? tr("subscription", "newspaper") : tr("subscription", "magazine")}</span>
                  <h3 className="mt-2 font-semibold leading-snug">{pub.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{pub.period}</p>
                  <p className="mt-2 text-lg font-bold text-brand">
                    {(period === "month" ? pub.price : pub.priceHalfYear).toFixed(2)} BYN
                  </p>
                </div>
              </MagneticCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>

      <FluidModal open={!!detail} title={detail?.title ?? ""} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <img src={detail.cover} alt="" className="mb-4 max-h-48 w-full rounded-xl object-cover" />
            <p className="text-sm text-slate-600">{detail.period} · {detail.type}</p>
            <p className="mt-4 text-xl font-bold text-brand">{detail.price.toFixed(2)} BYN / мес.</p>
            <p className="text-sm text-slate-500">Полгода: {detail.priceHalfYear.toFixed(2)} BYN</p>
          </>
        )}
      </FluidModal>
    </SiteLayout>
  );
}
