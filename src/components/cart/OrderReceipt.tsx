import { motion } from "framer-motion";
import { Download, X } from "lucide-react";
import type { CartItem } from "@/context/AppProvider";

type OrderReceiptProps = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  items: CartItem[];
  total: number;
  senderName: string;
  createdAt: string;
};

export function OrderReceipt({ open, onClose, orderId, items, total, senderName, createdAt }: OrderReceiptProps) {
  if (!open) return null;

  const download = () => {
    const html = document.getElementById("belpost-receipt")?.innerHTML ?? "";
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Чек ${orderId}</title></head><body>${html}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `belpost-receipt-${orderId.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div className="fluid-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div
        className="receipt-modal"
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-modal-header">
          <h3>Электронная квитанция</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть"><X className="h-4 w-4" /></button>
        </div>
        <div id="belpost-receipt" className="receipt-body">
          <div className="receipt-brand">БЕЛПОЧТА</div>
          <p className="receipt-meta">Заказ № {orderId}</p>
          <p className="receipt-meta">Дата: {new Date(createdAt).toLocaleString("ru-RU")}</p>
          <p className="receipt-meta">Плательщик: {senderName}</p>
          <table className="receipt-table">
            <thead>
              <tr><th>Позиция</th><th>Сумма</th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}><td>{i.title}</td><td>{i.price.toFixed(2)} BYN</td></tr>
              ))}
            </tbody>
          </table>
          <p className="receipt-total">Итого: {total.toFixed(2)} BYN</p>
          <div className="receipt-stamp">ОПЛАЧЕНО</div>
        </div>
        <button type="button" className="btn-primary mt-4 w-full justify-center" onClick={download}>
          <Download className="h-4 w-4" /> Скачать квитанцию
        </button>
      </motion.div>
    </motion.div>
  );
}
