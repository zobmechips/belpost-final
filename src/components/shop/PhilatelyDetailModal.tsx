import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AuthGateMessage, ShopCover } from "@/components/shop/ShopPlaceholder";
import { useApp } from "@/context/AppProvider";
import type { Stamp } from "@/lib/shop-data";

type PhilatelyDetailModalProps = {
  item: Stamp | null;
  onClose: () => void;
};

export function PhilatelyDetailModal({ item, onClose }: PhilatelyDetailModalProps) {
  const { user, addToCart, requireAuth } = useApp();

  if (!item) return null;

  const buy = () => {
    if (!user) {
      requireAuth();
      return;
    }
    addToCart({ id: item.id, title: item.title, price: item.price });
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
            <ShopCover src={item.image} alt={item.title} kind="stamp" />
            <div>
              <span className="price-chip">{item.category} · {item.year}</span>
              <h2 className="shop-detail-title">{item.title}</h2>
              <p className="shop-detail-desc">{item.description}</p>
              <p className="mt-4 text-2xl font-bold text-brand">{item.price.toFixed(2)} BYN</p>
              {user ? (
                <button type="button" className="btn-primary mt-5 w-full justify-center" onClick={buy}>
                  Добавить в корзину
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
