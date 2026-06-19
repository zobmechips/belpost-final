import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, MapPin, Package, User, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TrackingStepper } from "@/components/belpost/TrackingStepper";
import { useApp } from "@/context/AppProvider";
import { api, isValidTrackingId } from "@/lib/api";
import type { TrackEvent } from "@/components/home/TrackingPanel";

type Order = {
  id: string;
  createdAt: string;
  status?: string;
  total: number;
  items: { title: string; price: number }[];
};

type CabinetDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  new: "В обработке",
  processing: "В обработке",
  paid: "Оплачено",
  done: "Оплачено",
  shipped: "Отправлен",
  cancelled: "Отменён",
};

export function CabinetDrawer({ open, onClose }: CabinetDrawerProps) {
  const { user, tr, logout, pushToast, setUser } = useApp();
  const [tab, setTab] = useState<"profile" | "orders" | "parcels">("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([]);
  const [trackStep, setTrackStep] = useState(0);

  useEffect(() => {
    if (!open || !user) return;
    setAddress(user.address ?? "");
    setPhone(user.phone ?? "");
    void api.orders(user.email).then(setOrders);
  }, [open, user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.email, { address, phone });
      setUser({ ...user, address: updated.address, phone: updated.phone });
      pushToast("Профиль обновлён", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setSaving(false);
    }
  };

  const trackParcel = async (id: string) => {
    if (!isValidTrackingId(id)) {
      pushToast(tr("tracking", "invalid"), "error");
      return;
    }
    try {
      const data = await api.track(id);
      setTrackId(id);
      setTrackEvents(data.events ?? []);
      setTrackStep(data.events?.length ? data.events[data.events.length - 1].step : 0);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : tr("tracking", "notFound"), "error");
    }
  };

  if (!user) return null;

  const tabs = [
    { id: "profile" as const, label: "Профиль", icon: User },
    { id: "orders" as const, label: tr("cabinet", "orders"), icon: Package },
    { id: "parcels" as const, label: tr("cabinet", "parcels"), icon: MapPin },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fluid-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.aside
            className="cart-drawer cabinet-drawer cabinet-drawer-wide"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cabinet-header">
              <div>
                <h3 className="text-lg font-semibold">{tr("cabinet", "title")}</h3>
                <p className="text-sm text-slate-500">{user.name}</p>
              </div>
              <button type="button" onClick={onClose} className="fluid-modal-close" aria-label={tr("common", "close")}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="cabinet-tabs">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={`cabinet-tab ${tab === id ? "is-active" : ""}`} onClick={() => setTab(id)}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            <div className="cabinet-body">
              {tab === "profile" && (
                <div className="space-y-5">
                  <div className="cabinet-stat-card">
                    <Wallet className="h-5 w-5 text-brand" />
                    <div>
                      <p className="text-xs text-slate-500">Виртуальный кошелёк</p>
                      <p className="text-2xl font-bold text-brand">{(user.wallet ?? 0).toFixed(2)} BYN</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="fluid-label">
                      Email
                      <input value={user.email} className="fluid-input" disabled />
                    </label>
                    <label className="fluid-label">
                      Телефон
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="fluid-input" />
                    </label>
                    <label className="fluid-label">
                      Адрес доставки
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="fluid-input min-h-[80px]" />
                    </label>
                    <button type="button" onClick={() => void saveProfile()} disabled={saving} className="btn-primary">
                      {saving ? "…" : "Сохранить профиль"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "orders" && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <p className="text-sm text-slate-500">{tr("cabinet", "noOrders")}</p>
                  ) : (
                    <table className="cabinet-orders-table w-full text-sm">
                      <thead>
                        <tr>
                          <th>Дата</th>
                          <th>Товары</th>
                          <th>Сумма</th>
                          <th>Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id}>
                            <td className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td>{o.items?.map((i) => i.title).join(", ")}</td>
                            <td className="font-semibold text-brand">{o.total?.toFixed(2)} BYN</td>
                            <td>
                              <span className={`cabinet-status ${o.status === "done" || o.status === "paid" ? "is-paid" : ""}`}>
                                <CreditCard className="h-3 w-3" />
                                {STATUS_LABELS[o.status ?? "new"] ?? "В обработке"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === "parcels" && (
                <div className="space-y-3">
                  {user.trackingIds.length === 0 ? (
                    <p className="text-sm text-slate-500">{tr("cabinet", "noParcels")}</p>
                  ) : (
                    user.trackingIds.map((id) => (
                      <button key={id} type="button" className={`cabinet-parcel-card ${trackId === id ? "is-active" : ""}`} onClick={() => void trackParcel(id)}>
                        <Package className="h-5 w-5 text-brand" />
                        <span className="font-mono text-sm">{id}</span>
                        <span className="ml-auto text-xs text-brand">{tr("cabinet", "track")}</span>
                      </button>
                    ))
                  )}
                  {trackId && (
                    <div className="cabinet-track-detail">
                      <p className="mb-3 font-mono text-sm font-bold text-brand">{trackId}</p>
                      <TrackingStepper
                        activeStep={trackStep}
                        visible
                        labels={[tr("tracking", "stepAccepted"), tr("tracking", "stepSort"), tr("tracking", "stepTransit"), tr("tracking", "stepDelivered")]}
                      />
                      <ul className="mt-4 space-y-2 text-xs text-slate-600">
                        {trackEvents.map((ev, i) => (
                          <li key={i} className="flex flex-wrap gap-2 border-l-2 border-brand/30 pl-3">
                            <span className="font-semibold text-brand">{ev.label}</span>
                            <span>{new Date(ev.time).toLocaleString()}</span>
                            <span>{ev.city}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cabinet-footer">
              <button type="button" onClick={() => { logout(); onClose(); }} className="btn-ghost">
                {tr("auth", "logout")}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
