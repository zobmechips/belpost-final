import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { AuthGateMessage, ShopCover } from "@/components/shop/ShopPlaceholder";
import { useApp } from "@/context/AppProvider";
import type { Publication } from "@/lib/shop-data";

type SubscriptionDetailModalProps = {
  item: Publication | null;
  onClose: () => void;
};

export function SubscriptionDetailModal({ item, onClose }: SubscriptionDetailModalProps) {
  const { user, addToCart, requireAuth } = useApp();
  const [period, setPeriod] = useState<"month" | "half">("month");

  if (!item) return null;

  const price = period === "month" ? item.price : item.priceHalfYear;
  const periodLabel = period === "month" ? "1 месяц" : "6 месяцев";

  const subscribe = () => {
    if (!user) {
      requireAuth();
      return;
    }
    addToCart({
      id: `${item.id}-${period}`,
      title: `${item.title} (${period === "month" ? "1 мес." : "6 мес."})`,
      price,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div className="fluid-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="shop-detail-modal"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="shop-detail-close" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
          <div className="shop-detail-grid">
            <ShopCover src={item.cover} alt={item.title} kind="publication" />
            <div>
              <span className="price-chip">{item.type === "newspaper" ? "Газета" : "Журнал"}</span>
              <h2 className="shop-detail-title">{item.title}</h2>
              <p className="shop-detail-meta">{item.period}</p>
              <p className="shop-detail-desc">
                Официальная подписка РУП «Белпочта» с доставкой по указанному адресу. Выберите период и добавьте в корзину после авторизации.
              </p>
              <div className="section-tabs mt-4">
                <button type="button" className={`section-tab ${period === "month" ? "is-active" : ""}`} onClick={() => setPeriod("month")}>
                  1 месяц — {item.price.toFixed(2)} BYN
                </button>
                <button type="button" className={`section-tab ${period === "half" ? "is-active" : ""}`} onClick={() => setPeriod("half")}>
                  6 месяцев — {item.priceHalfYear.toFixed(2)} BYN
                </button>
              </div>
              <p className="mt-4 text-2xl font-bold text-brand">{price.toFixed(2)} BYN <span className="text-sm font-normal text-slate-500">/ {periodLabel}</span></p>
              {user ? (
                <button type="button" className="btn-primary mt-5 w-full justify-center" onClick={subscribe}>
                  Оформить подписку
                </button>
              ) : (
                <AuthGateMessage onLogin={() => requireAuth()} />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
