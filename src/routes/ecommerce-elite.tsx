import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Shield, Truck } from "lucide-react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/ecommerce-elite")({
  component: EcommerceElitePage,
  head: () => ({ meta: [{ title: "E-Commerce «Элит» — БЕЛПОЧТА" }] }),
});

const FEATURES = [
  { icon: Truck, title: "Доставка по всей РБ", text: "Курьер до двери в Минске и доставка в отделения по всей стране." },
  { icon: Package, title: "Страхование отправлений", text: "Автоматическое покрытие до 500 BYN для интернет-заказов." },
  { icon: Shield, title: "Отслеживание 24/7", text: "Статус посылки в реальном времени в личном кабинете и по SMS." },
];

function EcommerceElitePage() {
  return (
    <SiteLayout>
      <div className="express-page page-container page-container--ecommerce py-10">
        <ScrollReveal>
          <p className="express-eyebrow">Премиальный сервис</p>
          <h1 className="section-title">E-Commerce «Элит»</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Доставка интернет-покупок по всей Беларуси с отслеживанием в реальном времени, страхованием и курьерской доставкой до двери.
          </p>
        </ScrollReveal>

        <ScrollRevealGroup className="mt-10 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <ScrollRevealItem key={title}>
              <article className="developer-spec-card h-full">
                <div className="developer-spec-icon">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="developer-spec-label">{title}</h2>
                  <p className="developer-spec-value">{text}</p>
                </div>
              </article>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>

        <ScrollReveal delay={0.1}>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/express-delivery" className="btn-primary">Экспресс за 2 часа</Link>
            <Link to="/subscription" className="reviews-cta-btn">Каталог подписок</Link>
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
