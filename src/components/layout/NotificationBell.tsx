import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/context/AppProvider";
import { api, type NotificationItem } from "@/lib/api";

export function NotificationBell() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user?.email) {
      setItems([]);
      return;
    }
    const load = () => void api.notifications(user.email).then(setItems).catch(() => setItems([]));
    load();
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
  }, [user?.email]);

  if (!user) return null;

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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="notify-panel-title">Уведомления</p>
            <ul className="notify-list">
              {items.length === 0 ? (
                <li className="notify-empty">Нет новых уведомлений</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className={`notify-item ${n.read ? "" : "is-new"}`}>
                    {n.link ? (
                      <Link to={n.link} className="notify-item-link" onClick={() => setOpen(false)}>
                        <p className="notify-item-title">{n.title}</p>
                        <p className="notify-item-text">{n.message}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="notify-item-title">{n.title}</p>
                        <p className="notify-item-text">{n.message}</p>
                      </>
                    )}
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
