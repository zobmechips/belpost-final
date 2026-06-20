import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { api, isValidPhone } from "@/lib/api";

export const Route = createFileRoute("/express-delivery")({
  component: ExpressDeliveryPage,
  head: () => ({ meta: [{ title: "Экспресс-доставка за 2 часа — БЕЛПОЧТА" }] }),
});

const ZONES = [
  { id: "minsk", name: "Минск", eta: 90, coef: 1 },
  { id: "mogilev", name: "Могилёв", eta: 110, coef: 1.15 },
  { id: "gomel", name: "Гомель", eta: 120, coef: 1.2 },
  { id: "brest", name: "Брест", eta: 120, coef: 1.2 },
  { id: "grodno", name: "Гродно", eta: 115, coef: 1.18 },
  { id: "vitebsk", name: "Витебск", eta: 115, coef: 1.18 },
];

function ExpressDeliveryPage() {
  const { pushToast } = useApp();
  const [zone, setZone] = useState("minsk");
  const [weight, setWeight] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = ZONES.find((z) => z.id === zone) ?? ZONES[0];
  const price = useMemo(() => Math.round((16.4 + weight * 2.8) * selected.coef * 100) / 100, [weight, selected]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !isValidPhone(phone)) {
      pushToast("Заполните ФИО, телефон (+375…) и адрес", "error");
      return;
    }
    setLoading(true);
    try {
      await api.createOrder({
        userEmail: "",
        sender: { name, phone, email: "" },
        recipient: { name, phone, address },
        delivery: { method: "express-2h", zone: selected.name, etaMin: selected.eta },
        items: [{ id: "express-courier", title: `Экспресс-доставка (${selected.name})`, qty: 1, price }],
        total: price,
      });
      pushToast("Курьер вызван! Ожидайте звонка в течение 15 минут.", "success");
      setName("");
      setPhone("");
      setAddress("");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Ошибка оформления", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="express-page page-container page-container--express py-10">
        <ScrollReveal>
          <p className="express-eyebrow">E-Commerce Elite</p>
          <h1 className="section-title">Доставка за 2 часа</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Срочная курьерская доставка документов и посылок до 30 кг по Минску, Могилёву и всем областным центрам Беларуси.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <div className="express-hero-stats mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Clock, label: "Срок", value: "до 120 мин" },
              { icon: Truck, label: "Вес", value: "до 30 кг" },
              { icon: MapPin, label: "Зоны", value: "6 городов" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="express-stat-card">
                <Icon className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <section className="express-map mt-10">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Зоны экспресс-доставки</h2>
            <div className="express-zone-grid">
              {ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZone(z.id)}
                  className={`express-zone-btn ${zone === z.id ? "is-active" : ""}`}
                >
                  <span className="font-semibold">{z.name}</span>
                  <span className="text-xs text-slate-500">~{z.eta} мин</span>
                </button>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <ScrollReveal delay={0.12}>
            <section className="express-calc-card">
              <h2 className="mb-4 text-lg font-bold">Калькулятор</h2>
              <label className="fluid-label">
                Город
                <select value={zone} onChange={(e) => setZone(e.target.value)} className="fluid-input">
                  {ZONES.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </label>
              <label className="fluid-label mt-4">
                Вес посылки (кг)
                <input type="range" min={0.5} max={30} step={0.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full" />
                <span className="text-sm font-semibold text-brand">{weight} кг</span>
              </label>
              <p className="mt-6 text-sm text-slate-600">Ориентировочное время: <strong>{selected.eta} мин</strong></p>
              <p className="mt-2 text-2xl font-bold text-brand">{price.toFixed(2)} BYN</p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <motion.form onSubmit={(e) => void submit(e)} className="express-form-card">
              <h2 className="mb-4 text-lg font-bold">Вызов курьера</h2>
              <label className="fluid-label">ФИО<input value={name} onChange={(e) => setName(e.target.value)} className="fluid-input" required /></label>
              <label className="fluid-label">Телефон<input value={phone} onChange={(e) => setPhone(e.target.value)} className="fluid-input" placeholder="+375291234567" required /></label>
              <label className="fluid-label">Адрес<input value={address} onChange={(e) => setAddress(e.target.value)} className="fluid-input" required /></label>
              <button type="submit" disabled={loading} className="btn-primary mt-4 w-full justify-center">
                {loading ? "Отправка…" : "Вызвать курьера"}
              </button>
            </motion.form>
          </ScrollReveal>
        </div>

        <ScrollRevealGroup className="mt-12 grid gap-4 sm:grid-cols-3">
          {["Приём заявки онлайн", "Курьер за 15 минут", "SMS-уведомления"].map((t) => (
            <ScrollRevealItem key={t}>
              <div className="express-feature-pill">{t}</div>
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
      </div>
    </SiteLayout>
  );
}
