import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3, FileText, Inbox, LogOut, Package, Save, Settings, Truck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { ToastStack, type ToastItem } from "@/components/belpost/ToastStack";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

type Tariff = { id: string; title: string; price: number };
type NewsItem = { id: string; tag: string; date: string; title: string; excerpt: string; body: string; image: string };
type Message = { id: string; createdAt: string; name: string; email: string; message: string; status?: string };
type Order = {
  id: string;
  createdAt: string;
  status?: string;
  userEmail: string;
  total: number;
  items: { title: string; price: number }[];
  sender: { name: string; phone: string };
  recipient: { name: string };
};
type Stats = { orders: number; messages: number; newMessages: number; news: number; tracking: number };

type Tab = "dashboard" | "tariffs" | "news" | "orders" | "messages" | "tracking";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, adminCreds, logout, pushToast: appToast } = useApp();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tracking, setTracking] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [newsDraft, setNewsDraft] = useState<Partial<NewsItem>>({ tag: "Новости", date: new Date().toISOString().slice(0, 10) });

  const creds = adminCreds;

  const pushToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const loadAll = useCallback(async () => {
    if (!creds) return;
    try {
      const [s, t, n, o, m, tr] = await Promise.all([
        api.adminStats(creds),
        api.tariffs(),
        api.news(),
        api.orders(undefined, creds),
        api.adminMessages(creds),
        api.adminTracking(creds),
      ]);
      setStats(s);
      setTariffs(Array.isArray(t) ? t : []);
      setNews(Array.isArray(n) ? n : []);
      setOrders(Array.isArray(o) ? o : []);
      setMessages(Array.isArray(m) ? m : []);
      setTracking(tr && typeof tr === "object" ? tr : {});
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка загрузки", "error");
    }
  }, [creds, pushToast]);

  useEffect(() => {
    if (isAdmin && creds) void loadAll();
  }, [isAdmin, creds, loadAll]);

  const saveTariffs = async () => {
    if (!creds) return;
    setSaving(true);
    try {
      await api.saveTariffs(tariffs, creds);
      pushToast("Тарифы сохранены", "success");
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setSaving(false);
    }
  };

  const createNews = async () => {
    if (!creds || !newsDraft.title?.trim()) return;
    try {
      await api.adminCreateNews(newsDraft, creds);
      pushToast("Новость добавлена", "success");
      setNewsDraft({ tag: "Новости", date: new Date().toISOString().slice(0, 10) });
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const updateNews = async (item: NewsItem) => {
    if (!creds) return;
    try {
      await api.adminUpdateNews(item.id, item, creds);
      pushToast("Новость обновлена", "success");
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const deleteNews = async (id: string) => {
    if (!creds) return;
    try {
      await api.adminDeleteNews(id, creds);
      pushToast("Новость удалена", "info");
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const patchOrder = async (id: string, status: string) => {
    if (!creds) return;
    try {
      await api.adminPatchOrder(id, status, creds);
      pushToast("Статус заказа обновлён", "success");
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const patchMessage = async (id: string, status: string) => {
    if (!creds) return;
    try {
      await api.adminPatchMessage(id, status, creds);
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!creds) return;
    try {
      await api.adminDeleteMessage(id, creds);
      pushToast("Обращение удалено", "info");
      await loadAll();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const handleLogout = () => {
    logout();
    appToast("Вы вышли из системы", "info");
    window.location.href = "/";
  };

  if (!isAdmin || !creds) {
    return (
      <main className="admin-shell flex min-h-screen items-center justify-center p-6">
        <div className="admin-card max-w-md text-center">
          <Settings className="mx-auto mb-4 h-10 w-10 text-brand" />
          <h1 className="admin-title text-2xl">Кабинет администратора</h1>
          <p className="mt-3 text-sm text-slate-600">
            Войдите через кнопку «Вход» на главной странице.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">На главную</Link>
        </div>
      </main>
    );
  }

  const nav: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "dashboard", label: "Дашборд", icon: BarChart3 },
    { id: "tariffs", label: "Тарифы", icon: Settings },
    { id: "news", label: "Новости", icon: FileText },
    { id: "orders", label: "Заказы", icon: Package },
    { id: "messages", label: "Обращения", icon: Inbox },
    { id: "tracking", label: "Трекинг", icon: Truck },
  ];

  return (
    <main className="admin-shell min-h-screen">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      <div className="page-container flex flex-col gap-4 py-4 sm:flex-row sm:gap-6 sm:py-6">
        <aside className="admin-card w-full shrink-0 self-start p-4 sm:w-64">
          <p className="admin-kicker">Belpost Admin</p>
          <h1 className="text-lg font-bold text-slate-800">{user?.name}</h1>
          <p className="mb-4 text-xs text-slate-500">{user?.email}</p>
          <nav className="space-y-1">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`admin-nav-btn w-full ${tab === id ? "is-active" : ""}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={handleLogout} className="admin-nav-btn mt-4 w-full text-red-600">
            <LogOut className="h-4 w-4" /> Выйти
          </button>
          <Link to="/" className="admin-link mt-4 block text-center text-xs">← На сайт</Link>
        </aside>

        <div className="admin-card min-w-0 flex-1 p-6">
          {tab === "dashboard" && stats && (
            <div>
              <h2 className="section-title mb-6">Обзор</h2>
              <AdminAnalytics orders={orders} messagesCount={messages.length} />
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Заказы", value: stats.orders },
                  { label: "Новые обращения", value: stats.newMessages },
                  { label: "Новости", value: stats.news },
                  { label: "Трек-записи", value: stats.tracking },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-3xl font-bold text-brand">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "tariffs" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title">Тарифы</h2>
                <button type="button" onClick={() => void saveTariffs()} disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4" /> {saving ? "Сохранение…" : "Сохранить"}
                </button>
              </div>
              <div className="admin-table-wrap overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr><th>ID</th><th>Название</th><th>Цена (BYN)</th></tr>
                  </thead>
                  <tbody>
                    {tariffs.map((item) => (
                      <tr key={item.id}>
                        <td className="font-mono text-xs">{item.id}</td>
                        <td>
                          <input
                            value={item.title}
                            onChange={(e) => setTariffs((p) => p.map((t) => (t.id === item.id ? { ...t, title: e.target.value } : t)))}
                            className="admin-price-input w-full"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.price}
                            onChange={(e) => setTariffs((p) => p.map((t) => (t.id === item.id ? { ...t, price: Number(e.target.value) } : t)))}
                            className="admin-price-input"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "news" && (
            <div className="space-y-6">
              <h2 className="section-title">Новости</h2>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold">Добавить новость</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input placeholder="Заголовок" value={newsDraft.title ?? ""} onChange={(e) => setNewsDraft((d) => ({ ...d, title: e.target.value }))} className="fluid-input" />
                  <input placeholder="Тег" value={newsDraft.tag ?? ""} onChange={(e) => setNewsDraft((d) => ({ ...d, tag: e.target.value }))} className="fluid-input" />
                  <input placeholder="URL изображения" value={newsDraft.image ?? ""} onChange={(e) => setNewsDraft((d) => ({ ...d, image: e.target.value }))} className="fluid-input sm:col-span-2" />
                  <textarea placeholder="Краткое описание" value={newsDraft.excerpt ?? ""} onChange={(e) => setNewsDraft((d) => ({ ...d, excerpt: e.target.value }))} className="fluid-input sm:col-span-2" rows={2} />
                  <textarea placeholder="Полный текст" value={newsDraft.body ?? ""} onChange={(e) => setNewsDraft((d) => ({ ...d, body: e.target.value }))} className="fluid-input sm:col-span-2" rows={3} />
                </div>
                <button type="button" onClick={() => void createNews()} className="btn-primary mt-3">Добавить</button>
              </div>
              <div className="space-y-4">
                {news.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                    <input value={item.title} onChange={(e) => setNews((p) => p.map((n) => (n.id === item.id ? { ...n, title: e.target.value } : n)))} className="fluid-input mb-2 w-full font-semibold" />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void updateNews(item)} className="btn-primary text-xs">Сохранить</button>
                      <button type="button" onClick={() => void deleteNews(item.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <h2 className="section-title mb-4">Заказы</h2>
              <div className="space-y-3">
                {orders.length === 0 && <p className="text-sm text-slate-500">Заказов пока нет</p>}
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-100 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-500">{order.id.slice(0, 8)}…</span>
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-brand">{order.total.toFixed(2)} BYN</span>
                      <select value={order.status ?? "new"} onChange={(e) => void patchOrder(order.id, e.target.value)} className="admin-price-input">
                        <option value="new">Новый</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="done">Выполнен</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </div>
                    <p className="mt-2">{order.sender?.name} → {order.recipient?.name}</p>
                    <p className="text-xs text-slate-500">{order.userEmail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "messages" && (
            <div>
              <h2 className="section-title mb-4">Обращения</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`rounded-xl border p-4 text-sm ${msg.status === "read" ? "border-slate-100 opacity-70" : "border-brand/20"}`}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold">{msg.name}</span>
                      <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-brand">{msg.email}</p>
                    <p className="mt-2">{msg.message}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => void patchMessage(msg.id, "read")} className="btn-primary text-xs">Прочитано</button>
                      <button type="button" onClick={() => void deleteMessage(msg.id)} className="text-xs text-red-600">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "tracking" && (
            <div>
              <h2 className="section-title mb-4">База отслеживания</h2>
              <p className="mb-4 text-sm text-slate-500">Записей: {Object.keys(tracking).length}</p>
              <div className="space-y-2 font-mono text-xs">
                {Object.keys(tracking).map((id) => (
                  <div key={id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <span>{id}</span>
                    <span className="text-slate-500">{Array.isArray((tracking[id] as { events?: unknown[] })?.events) ? `${(tracking[id] as { events: unknown[] }).events.length} событий` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
