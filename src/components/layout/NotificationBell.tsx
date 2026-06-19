import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type NotificationItem } from "@/lib/api";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    void api.notifications().then(setItems).catch(() => setItems([]));
    const t = window.setInterval(() => void api.notifications().then(setItems).catch(() => {}), 30000);
    return () => window.clearInterval(t);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button type="button" className="notify-bell" onClick={() => setOpen((v) => !v)} aria-label="Уведомления">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="notify-badge">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="notify-panel"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
          >
            <p className="notify-panel-title">Уведомления</p>
            <ul className="notify-list">
              {items.length === 0 ? (
                <li className="notify-empty">Нет новых уведомлений</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className={`notify-item ${n.read ? "" : "is-new"}`}>
                    <p className="notify-item-title">{n.title}</p>
                    <p className="notify-item-text">{n.message}</p>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
