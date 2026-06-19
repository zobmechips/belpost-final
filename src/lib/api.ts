export type AdminCredentials = { login: string; password: string };

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
};

function adminHeaders(creds: AdminCredentials) {
  return {
    "Content-Type": "application/json",
    "x-admin-login": creds.login,
    "x-admin-password": creds.password,
  };
}

async function parseResponse(r: Response) {
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Ошибка запроса");
  return data;
}

export const api = {
  tariffs: () => fetch("/api/tariffs").then((r) => r.json()),
  news: () => fetch("/api/news").then((r) => r.json()),
  publications: () => fetch("/api/publications").then((r) => r.json()),
  stamps: () => fetch("/api/stamps").then((r) => r.json()),
  reviews: () => fetch("/api/reviews").then((r) => r.json()),
  track: (id: string) =>
    fetch(`/api/track/${encodeURIComponent(id)}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Track error");
      return data;
    }),
  login: (email: string, password: string) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(parseResponse),
  register: (name: string, email: string, password: string) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(parseResponse),
  orders: (email?: string, creds?: AdminCredentials) => {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    const init = creds ? { headers: adminHeaders(creds) } : undefined;
    return fetch(`/api/orders${q}`, init).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Ошибка загрузки заказов");
      return data;
    });
  },
  createOrder: (payload: unknown) =>
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(parseResponse),
  sendMessage: (payload: { name: string; email: string; message: string; captchaToken: string }) =>
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(parseResponse),
  saveTariffs: (tariffs: unknown, creds: AdminCredentials) =>
    fetch("/api/tariffs", {
      method: "POST",
      headers: adminHeaders(creds),
      body: JSON.stringify(tariffs),
    }).then(parseResponse),
  adminStats: (creds: AdminCredentials) =>
    fetch("/api/admin/stats", { headers: adminHeaders(creds) }).then(parseResponse),
  adminMessages: (creds: AdminCredentials) =>
    fetch("/api/admin/messages", { headers: adminHeaders(creds) }).then(parseResponse),
  adminPatchMessage: (id: string, status: string, creds: AdminCredentials) =>
    fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: adminHeaders(creds),
      body: JSON.stringify({ status }),
    }).then(parseResponse),
  adminDeleteMessage: (id: string, creds: AdminCredentials) =>
    fetch(`/api/admin/messages/${id}`, { method: "DELETE", headers: adminHeaders(creds) }).then(parseResponse),
  adminPatchOrder: (id: string, status: string, creds: AdminCredentials) =>
    fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: adminHeaders(creds),
      body: JSON.stringify({ status }),
    }).then(parseResponse),
  adminCreateNews: (payload: unknown, creds: AdminCredentials) =>
    fetch("/api/admin/news", { method: "POST", headers: adminHeaders(creds), body: JSON.stringify(payload) }).then(parseResponse),
  adminUpdateNews: (id: string, payload: unknown, creds: AdminCredentials) =>
    fetch(`/api/admin/news/${id}`, { method: "PUT", headers: adminHeaders(creds), body: JSON.stringify(payload) }).then(parseResponse),
  adminDeleteNews: (id: string, creds: AdminCredentials) =>
    fetch(`/api/admin/news/${id}`, { method: "DELETE", headers: adminHeaders(creds) }).then(parseResponse),
  adminTracking: (creds: AdminCredentials) =>
    fetch("/api/admin/tracking", { headers: adminHeaders(creds) }).then(parseResponse),
  adminSaveTracking: (id: string, payload: unknown, creds: AdminCredentials) =>
    fetch(`/api/admin/tracking/${id}`, { method: "PUT", headers: adminHeaders(creds), body: JSON.stringify(payload) }).then(parseResponse),
  adminDeleteTracking: (id: string, creds: AdminCredentials) =>
    fetch(`/api/admin/tracking/${id}`, { method: "DELETE", headers: adminHeaders(creds) }).then(parseResponse),
  updateProfile: (email: string, data: { address?: string; phone?: string }) =>
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...data }),
    }).then(parseResponse),
  chat: (message: string) =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }).then(parseResponse),
  notifications: () => fetch("/api/notifications").then((r) => r.json()) as Promise<NotificationItem[]>,
};

export function isValidTrackingId(id: string) {
  const normalized = id.trim().toUpperCase();
  return /^(\d{13}|[A-Z]{2}\d{9}[A-Z]{2})$/.test(normalized);
}

export function calcTariff(base: number, type: string, weightG: number, declared: boolean) {
  const rates: Record<string, number> = { letter: 0.8, parcel: 1.2, ems: 2.1 };
  const rate = rates[type] ?? 1;
  const weightPart = (Math.max(weightG, 1) / 100) * rate;
  const declaredPart = declared ? base * 0.15 : 0;
  return Math.round((base + weightPart + declaredPart) * 100) / 100;
}

export function isValidPhone(phone: string) {
  return /^\+375(25|29|33|44)\d{7}$/.test(phone.replace(/\s/g, ""));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
