import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  Package,
  Shield,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NpesPanel } from "@/components/cabinet/NpesPanel";
import { TrackingStepper } from "@/components/belpost/TrackingStepper";
import { TrackingQr } from "@/components/tracking/TrackingQr";
import { FluidModal } from "@/components/belpost/FluidModal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { api, isValidTrackingId } from "@/lib/api";
import type { TrackEvent } from "@/components/home/TrackingPanel";

export const Route = createFileRoute("/cabinet")({
  component: CabinetPage,
  head: () => ({ meta: [{ title: "Личный кабинет — БЕЛПОЧТА" }] }),
});

type Order = {
  id: string;
  createdAt: string;
  status?: string;
  total: number;
  items: { title: string; price: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  new: "В обработке",
  processing: "В обработке",
  paid: "Оплачено",
  done: "Оплачено",
  shipped: "Отправлен",
  cancelled: "Отменён",
};

function CabinetPage() {
  const { user, tr, logout, pushToast, setUser, requireAuth } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile" | "orders" | "parcels" | "npes">("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [consents, setConsents] = useState({ processing: true, marketing: false, analytics: false });
  const [saving, setSaving] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([]);
  const [trackStep, setTrackStep] = useState(0);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      requireAuth();
      return;
    }
    if (user.role === "admin") {
      void navigate({ to: "/admin" });
      return;
    }
    setName(user.name);
    setAddress(user.address ?? "");
    setPhone(user.phone ?? "");
    setConsents(user.consents ?? { processing: true, marketing: false, analytics: false });
    void api.orders(user.email).then(setOrders);
    void api.me().then((data) => {
      setUser({
        ...user,
        name: data.name,
        phone: data.phone ?? "",
        address: data.address ?? "",
        clientId: data.clientId,
        identificationCode: data.identificationCode,
        consents: data.consents,
        wallet: data.wallet ?? 0,
        trackingIds: data.trackingIds ?? [],
      });
    }).catch(() => {});
  }, [user?.email]);

  if (!user || user.role === "admin") {
    return (
      <SiteLayout>
        <div className="page-container page-container--form py-20 text-center">
          <p className="text-muted-foreground">Войдите в личный кабинет для доступа к профилю.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">На главную</Link>
        </div>
      </SiteLayout>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(user.email, { name, address, phone, consents });
      setUser({ ...user, ...updated });
      pushToast("Данные сохранены", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      await api.changePassword(currentPassword, newPassword);
      pushToast("Пароль изменён", "success");
      setPwdOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const deleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
      pushToast("Аккаунт удалён", "info");
      void navigate({ to: "/" });
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
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

  const tabs = [
    { id: "profile" as const, label: "Профиль", icon: User },
    { id: "orders" as const, label: tr("cabinet", "orders"), icon: Package },
    { id: "parcels" as const, label: tr("cabinet", "parcels"), icon: MapPin },
    { id: "npes" as const, label: "НПЭС", icon: Mail },
  ];

  return (
    <SiteLayout>
      <div className="cabinet-page page-container page-container--cabinet py-8">
        <header className="cabinet-page-header">
          <div>
            <h1 className="section-title">{tr("cabinet", "title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{user.name}</p>
          </div>
          <button type="button" className="btn-ghost" onClick={() => { logout(); void navigate({ to: "/" }); }}>
            {tr("auth", "logout")}
          </button>
        </header>

        <div className="cabinet-page-tabs">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`cabinet-tab ${tab === id ? "is-active" : ""}`} onClick={() => setTab(id)}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="cabinet-page-body">
          {tab === "profile" && (
            <div className="cabinet-profile-grid">
              <section className="cabinet-card">
                <h2 className="cabinet-card-title">Идентификация</h2>
                <dl className="cabinet-id-list">
                  <div>
                    <dt>ID клиента</dt>
                    <dd className="font-mono">{user.clientId || "—"}</dd>
                  </div>
                  <div>
                    <dt>Идентификационный код</dt>
                    <dd className="font-mono">{user.identificationCode || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{user.email}</dd>
                  </div>
                </dl>
              </section>

              <section className="cabinet-card">
                <h2 className="cabinet-card-title">Лицевой счёт ЭЛС</h2>
                <div className="cabinet-stat-card">
                  <Wallet className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-xs text-slate-500">Баланс</p>
                    <p className="text-2xl font-bold text-brand">{(user.wallet ?? 0).toFixed(2)} BYN</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-3 text-sm"
                  onClick={() => void api.topupEls(user.email, 10).then((r) => {
                    setUser({ ...user, wallet: r.wallet });
                    pushToast("Счёт ЭЛС пополнен на 10 BYN", "success");
                  }).catch((e) => pushToast(e instanceof Error ? e.message : "Ошибка", "error"))}
                >
                  Пополнить ЭЛС (+10 BYN демо)
                </button>
              </section>

              <section className="cabinet-card cabinet-card-wide">
                <h2 className="cabinet-card-title">Личные данные</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="fluid-label sm:col-span-2">
                    ФИО
                    <input value={name} onChange={(e) => setName(e.target.value)} className="fluid-input" />
                  </label>
                  <label className="fluid-label">
                    Телефон
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="fluid-input" />
                  </label>
                  <label className="fluid-label sm:col-span-2">
                    Адрес доставки
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="fluid-input min-h-[80px]" />
                  </label>
                </div>
                <button type="button" onClick={() => void saveProfile()} disabled={saving} className="btn-primary mt-4">
                  {saving ? "…" : "Сохранить"}
                </button>
              </section>

              <section className="cabinet-card cabinet-card-wide">
                <h2 className="cabinet-card-title flex items-center gap-2">
                  <Shield className="h-4 w-4 text-brand" />
                  Согласия на обработку персональных данных
                </h2>
                <div className="space-y-3 text-sm">
                  <label className="cabinet-consent-row">
                    <input
                      type="checkbox"
                      checked={consents.processing}
                      onChange={(e) => setConsents((c) => ({ ...c, processing: e.target.checked }))}
                    />
                    Обработка персональных данных для оказания услуг Белпочты
                  </label>
                  <label className="cabinet-consent-row">
                    <input
                      type="checkbox"
                      checked={consents.marketing}
                      onChange={(e) => setConsents((c) => ({ ...c, marketing: e.target.checked }))}
                    />
                    Информирование об акциях и специальных предложениях
                  </label>
                  <label className="cabinet-consent-row">
                    <input
                      type="checkbox"
                      checked={consents.analytics}
                      onChange={(e) => setConsents((c) => ({ ...c, analytics: e.target.checked }))}
                    />
                    Аналитика использования сервисов для улучшения качества
                  </label>
                </div>
                <button type="button" onClick={() => void saveProfile()} disabled={saving} className="btn-ghost mt-4 text-sm">
                  Сохранить согласия
                </button>
              </section>

              <section className="cabinet-card cabinet-card-wide">
                <h2 className="cabinet-card-title">Действия с аккаунтом</h2>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-ghost" onClick={() => setPwdOpen(true)}>
                    <KeyRound className="h-4 w-4" /> Сменить пароль
                  </button>
                  <button type="button" className="btn-ghost text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" /> Удалить аккаунт
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { logout(); void navigate({ to: "/" }); }}>
                    Выйти из аккаунта
                  </button>
                </div>
              </section>
            </div>
          )}

          {tab === "orders" && (
            <section className="cabinet-card">
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">{tr("cabinet", "noOrders")}</p>
              ) : (
                <div className="cabinet-table-wrap -mx-1 overflow-x-auto px-1">
                  <table className="cabinet-orders-table w-full min-w-[32rem] text-sm">
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
                </div>
              )}
            </section>
          )}

          {tab === "parcels" && (
            <section className="cabinet-card space-y-3">
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
                  <TrackingQr trackingId={trackId} />
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
            </section>
          )}

          {tab === "npes" && (
            <section className="cabinet-card">
              <NpesPanel />
            </section>
          )}
        </div>
      </div>

      <FluidModal open={pwdOpen} title="Смена пароля" onClose={() => setPwdOpen(false)} footer={
        <button type="button" className="btn-primary" onClick={() => void changePassword()}>Сохранить</button>
      }>
        <div className="grid gap-4">
          <label className="fluid-label">
            Текущий пароль
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="fluid-input" />
          </label>
          <label className="fluid-label">
            Новый пароль
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="fluid-input" minLength={6} />
          </label>
        </div>
      </FluidModal>

      <FluidModal open={deleteOpen} title="Удаление аккаунта" onClose={() => setDeleteOpen(false)} footer={
        <button type="button" className="btn-primary bg-destructive" onClick={() => void deleteAccount()}>Удалить навсегда</button>
      }>
        <p className="text-sm text-slate-600">Все данные профиля, история заказов и чат с Анастасией будут удалены без возможности восстановления.</p>
      </FluidModal>
    </SiteLayout>
  );
}
