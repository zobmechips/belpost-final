import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail, ShoppingBag, ScanLine, CalendarCheck, Package, CreditCard, Newspaper,
  Stamp, Globe2, Truck, Calculator, Building2, Plus,
} from "lucide-react";
import { ChiefArchitectBlock } from "@/components/home/ChiefArchitectBlock";
import { ReviewsCarousel } from "@/components/home/ReviewsCarousel";
import { MagneticCard } from "@/components/belpost/MagneticCard";
import { FluidModal } from "@/components/belpost/FluidModal";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
import { TariffCalculator } from "@/components/services/TariffCalculator";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { useSmoothScroll } from "@/components/belpost/SmoothScrollProvider";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "БЕЛПОЧТА — Национальный оператор почтовой связи" },
      { name: "description", content: "Отслеживание отправлений, тарифы, онлайн-услуги, подписка и филателия. Официальный сайт РУП «Белпочта»." },
    ],
  }),
});

const quickTiles = [
  { icon: Mail, key: "mail", action: "feedback" as const },
  { icon: ShoppingBag, key: "shop", action: "subscription" as const },
  { icon: ScanLine, key: "scan", action: "services" as const },
  { icon: CalendarCheck, key: "calendar", action: "feedback" as const },
];

const serviceDefs = [
  { id: "post-shipment", Icon: Package },
  { id: "finance", Icon: CreditCard },
  { id: "subscription", Icon: Newspaper },
  { id: "philately", Icon: Stamp },
  { id: "international", Icon: Globe2 },
  { id: "courier", Icon: Truck },
  { id: "calculator", Icon: Calculator },
  { id: "offices", Icon: Building2 },
  { id: "ecommerce", Icon: ShoppingBag },
];

type NewsItem = { id: string; tag: string; date: string; title: string; excerpt: string; body: string; image: string };

function Index() {
  const { tr, tariffs, tariffsLoading, addToCart, pushToast } = useApp();
  const { scrollToSection } = useSmoothScroll();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"online" | "services" | "news">("online");
  const [modal, setModal] = useState<{ title: string; id?: string } | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsModal, setNewsModal] = useState<NewsItem | null>(null);

  useEffect(() => {
    void api.news()
      .then(setNews)
      .finally(() => setNewsLoading(false));
  }, []);

  const q = query.toLowerCase();
  const onlineIds = ["home-service", "forms", "e-stamp"];

  const filteredServices = serviceDefs.filter((s) => (tariffs[s.id]?.title ?? s.id).toLowerCase().includes(q));
  const filteredNews = news.filter((n) => n.title.toLowerCase().includes(q) || n.tag.toLowerCase().includes(q));

  const price = (id: string) => {
    if (tariffsLoading) return tr("common", "loading");
    const v = tariffs[id]?.price;
    return v === undefined ? tr("common", "onRequest") : `${v.toFixed(2)} BYN`;
  };

  const runQuickAction = (action: (typeof quickTiles)[0]["action"]) => {
    if (action === "feedback") {
      void navigate({ to: "/feedback" });
      return;
    }
    if (action === "subscription") {
      void navigate({ to: "/subscription" });
      return;
    }
    setActiveTab("services");
    scrollToSection("online-services");
  };

  return (
    <SiteLayout hero>
      <section id="quick-actions" className="mx-auto max-w-[1400px] px-6 pb-12 pt-20">
        <ScrollReveal className="mb-8"><h2 className="section-title">{tr("sections", "quickActions")}</h2></ScrollReveal>
        <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickTiles.map(({ icon: Icon, key, action }) => (
            <ScrollRevealItem key={key} className="h-full">
              <MagneticCard className="service-card-unified" onClick={() => runQuickAction(action)}>
                <Icon className="h-8 w-8 text-brand" strokeWidth={1.4} />
                <span className="text-[15px] font-medium leading-snug">{tr("quickActions", key)}</span>
              </MagneticCard>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </section>

      <section id="online-services" className="mx-auto max-w-[1400px] px-6 pb-20">
        <ScrollReveal>
          <div className="mb-6 flex flex-wrap justify-between gap-3">
            <h2 className="section-title">{tr("sections", "onlineServices")}</h2>
            <div className="section-tabs" role="tablist">
              {(["online", "services", "news"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t}
                  onClick={() => setActiveTab(t)}
                  className={`section-tab ${activeTab === t ? "is-active" : ""}`}
                >
                  {tr("sections", t === "online" ? "tabOnline" : t === "services" ? "tabServices" : "tabNews")}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.05}>
          <div className="search-field mb-6">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("sections", "search")} className="search-input w-full" />
          </div>
        </ScrollReveal>

        {activeTab === "online" && (
          <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {onlineIds.filter((id) => (tariffs[id]?.title ?? id).toLowerCase().includes(q)).map((id) => (
              <ScrollRevealItem key={id} className="h-full">
                <MagneticCard className="service-card-unified" onClick={() => setModal({ title: tariffs[id]?.title ?? id, id })}>
                  <span className="service-icon"><Mail className="h-6 w-6" /></span>
                  <span className="font-medium leading-snug">{tariffs[id]?.title ?? id}</span>
                  <span className="price-chip mt-auto w-fit">{price(id)}</span>
                </MagneticCard>
              </ScrollRevealItem>
            ))}
          </ScrollRevealGroup>
        )}

        {activeTab === "services" && (
          <div id="services-grid">
            <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map(({ id, Icon }) => (
                <ScrollRevealItem key={id} className="h-full">
                  <MagneticCard
                    className="service-card-unified"
                    onClick={() => setModal({ title: tariffs[id]?.title ?? id, id })}
                    footer={
                      <button
                        type="button"
                        className="add-cart-btn"
                        onClick={() => addToCart({ id, title: tariffs[id]?.title ?? id, price: tariffs[id]?.price ?? 0 })}
                      >
                        <Plus className="h-3.5 w-3.5" /> {tr("sections", "addToCart")}
                      </button>
                    }
                  >
                    <span className="service-icon"><Icon className="h-6 w-6" /></span>
                    <span className="font-medium leading-snug">{tariffs[id]?.title ?? id}</span>
                    <span className="price-chip w-fit">{price(id)}</span>
                    <TariffCalculator serviceId={id} basePrice={tariffs[id]?.price ?? 0} />
                  </MagneticCard>
                </ScrollRevealItem>
              ))}
            </ScrollRevealGroup>
          </div>
        )}

        {activeTab === "news" && (
          <div id="news-section">
            {newsLoading ? (
              <p className="text-sm text-slate-500">{tr("common", "loading")}</p>
            ) : filteredNews.length === 0 ? (
              <p className="text-sm text-slate-500">{tr("common", "notFound")}</p>
            ) : (
              <ScrollRevealGroup className="card-grid-equal grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {filteredNews.map((n) => (
                  <ScrollRevealItem key={n.id} className="h-full">
                    <MagneticCard className="news-card service-card-unified news-card-compact p-0" onClick={() => setNewsModal(n)}>
                      <img src={n.image} alt={n.title} className="news-card-visual h-32 w-full object-cover" />
                      <div className="p-4">
                        <span className="price-chip">{n.tag}</span>
                        <h3 className="mt-2 line-clamp-2 font-semibold leading-snug">{n.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{n.date}</p>
                      </div>
                    </MagneticCard>
                  </ScrollRevealItem>
                ))}
              </ScrollRevealGroup>
            )}
          </div>
        )}
      </section>

      <ChiefArchitectBlock />
      <ReviewsCarousel />

      <FluidModal open={!!modal} title={modal?.title ?? ""} onClose={() => setModal(null)}>
        {modal?.id && <TariffCalculator serviceId={modal.id} basePrice={tariffs[modal.id]?.price ?? 0} />}
      </FluidModal>
      <FluidModal open={!!newsModal} title={newsModal?.title ?? ""} onClose={() => setNewsModal(null)}>
        {newsModal && (
          <>
            <img src={newsModal.image} alt={newsModal.title} className="mb-4 max-h-56 w-full rounded-xl object-cover" />
            <p className="text-sm leading-relaxed text-slate-600">{newsModal.body}</p>
          </>
        )}
      </FluidModal>
    </SiteLayout>
  );
}
