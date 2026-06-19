import cors from "cors";
import express from "express";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  clearRefreshCookie,
  createAccessToken,
  createRefreshToken,
  generateResetToken,
  hashPassword,
  parseCookies,
  setRefreshCookie,
  verifyJwt,
  verifyPassword,
} from "./authCrypto.js";
import { createRateLimiter } from "./middleware/rateLimit.js";

const POLLINATIONS_CHAT_URL = "https://text.pollinations.ai/openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

const files = {
  tariffs: path.join(dataDir, "tariffs.json"),
  news: path.join(dataDir, "news.json"),
  tracking: path.join(dataDir, "tracking.json"),
  publications: path.join(dataDir, "publications.json"),
  stamps: path.join(dataDir, "stamps.json"),
  messages: path.join(dataDir, "messages.json"),
  orders: path.join(dataDir, "orders.json"),
  users: path.join(dataDir, "users.json"),
  reviews: path.join(dataDir, "reviews.json"),
  transactions: path.join(dataDir, "transactions.json"),
  npes: path.join(dataDir, "npes.json"),
  refreshTokens: path.join(dataDir, "refresh_tokens.json"),
  offices: path.join(dataDir, "offices.json"),
  chatSessions: path.join(dataDir, "chat_sessions.json"),
  queueTickets: path.join(dataDir, "queue_tickets.json"),
};

const rateLimitPublic = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: "Превышен лимит запросов. Безопасность системы ограничила доступ на 1 минуту.",
});

const app = express();
const PORT = Number(process.env.API_PORT ?? 4000);
const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? "staryi_";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "viwaldi";

const secureCookie = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(express.json());

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 60_000);
const memoryCache = new Map();

async function cachedRead(cacheKey, filePath, fallback = null) {
  const hit = memoryCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  const data = await readJson(filePath, fallback);
  memoryCache.set(cacheKey, { data, at: Date.now() });
  return data;
}

function bustCache(...keys) {
  keys.forEach((key) => memoryCache.delete(key));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function isAdminAuthorized(req) {
  return req.headers["x-admin-login"] === ADMIN_LOGIN && req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

function isValidTrackingId(id) {
  return /^(\d{13}|[A-Z]{2}\d{9}[A-Z]{2})$/.test(id);
}

function isAdminLogin(login, password) {
  return String(login ?? "").trim() === ADMIN_LOGIN && password === ADMIN_PASSWORD;
}

function publicUser(user) {
  return {
    email: user.email,
    name: user.name,
    phone: user.phone ?? "",
    trackingIds: user.trackingIds ?? [],
    wallet: Number(user.wallet) || 0,
    address: user.address ?? "",
    role: user.role ?? "user",
    clientId: user.clientId ?? "",
    identificationCode: user.identificationCode ?? "",
    consents: user.consents ?? { processing: true, marketing: false, analytics: false },
  };
}

function ensureUserMeta(user) {
  if (!user.clientId) user.clientId = `BP-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  if (!user.identificationCode) {
    user.identificationCode = `BY${createHash("sha256").update(String(user.email).toLowerCase()).digest("hex").slice(0, 12).toUpperCase()}`;
  }
  if (!user.consents) user.consents = { processing: true, marketing: false, analytics: false };
  return user;
}

async function loadUsers() {
  return readJson(files.users, []);
}

async function saveUsers(users) {
  await writeJson(files.users, users);
}

async function loadRefreshTokens() {
  return readJson(files.refreshTokens, []);
}

async function saveRefreshTokens(rows) {
  await writeJson(files.refreshTokens, rows);
}

async function storeRefreshToken(email, token) {
  const payload = verifyJwt(token);
  if (!payload?.jti) return;
  const rows = await loadRefreshTokens();
  rows.push({
    jti: payload.jti,
    email: String(email).toLowerCase(),
    token,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  });
  await saveRefreshTokens(rows);
}

async function revokeRefreshToken(jti) {
  const rows = await loadRefreshTokens();
  await saveRefreshTokens(rows.filter((r) => r.jti !== jti));
}

async function findRefreshToken(jti) {
  const rows = await loadRefreshTokens();
  return rows.find((r) => r.jti === jti) ?? null;
}

async function purgeExpiredRefreshTokens() {
  const now = Date.now();
  const rows = await loadRefreshTokens();
  const fresh = rows.filter((r) => new Date(r.expiresAt).getTime() > now);
  if (fresh.length !== rows.length) await saveRefreshTokens(fresh);
}

function getAccessEmail(req) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const payload = verifyJwt(auth.slice(7));
  if (!payload || payload.type !== "access") return null;
  return String(payload.sub ?? "").toLowerCase();
}

async function authenticateUserPassword(login, password) {
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === login.toLowerCase());
  if (idx === -1) return null;
  const user = users[idx];
  if (!verifyPassword(password, user.password)) return null;
  if (!String(user.password).startsWith("pbkdf2$")) {
    users[idx].password = hashPassword(password);
  }
  ensureUserMeta(users[idx]);
  await saveUsers(users);
  return users[idx];
}

function issueSession(res, user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  void storeRefreshToken(user.email, refreshToken);
  setRefreshCookie(res, refreshToken, { secure: secureCookie });
  return { ...publicUser(user), accessToken };
}

function buildAnastasiaSystemPrompt(tariffs, news) {
  const tariffLines = (tariffs ?? [])
    .filter((t) => t.price > 0)
    .slice(0, 12)
    .map((t) => `${t.title}: ${t.price} BYN`)
    .join("; ");
  const newsLines = (news ?? [])
    .slice(0, 3)
    .map((n) => n.title)
    .join("; ");

  return `Тебя зовут Анастасия. Ты — официальный, умный и вежливый консультант РУП «Белпочта». Общайся как живой человек на любые темы: поддерживай small talk («как дела», «привет»), отвечай естественно и по существу. Не используй шаблонные заготовки и не своди каждый ответ к тарифам — упоминай услуги Белпочты только когда пользователь спрашивает о почте, доставке, подписке или тарифах.

Справочные тарифы (если спросят): ${tariffLines || "уточняйте на портале"}.
Новости: ${newsLines || "см. раздел «Новости»"}.
Услуги: подписка, филателия, отслеживание, НПЭС, ЭЛС, контакт-центр 154.
Отвечай по-русски.`;
}

function historyToOpenAiMessages(history) {
  return (history ?? [])
    .slice(-10)
    .filter((m) => m?.text && (m.from === "user" || m.from === "bot"))
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: String(m.text).trim(),
    }));
}

async function callPollinationsChat(messages) {
  const response = await fetch(POLLINATIONS_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai", messages }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[belpost/chat] Pollinations HTTP", response.status, JSON.stringify(data).slice(0, 800));
    throw new Error(data?.error?.message ?? data?.message ?? `Pollinations HTTP ${response.status}`);
  }

  const reply = data?.choices?.[0]?.message?.content;
  if (!reply || !String(reply).trim()) {
    console.error("[belpost/chat] Pollinations empty choices:", JSON.stringify(data).slice(0, 800));
    throw new Error("Pollinations вернул пустой ответ");
  }

  return String(reply).trim();
}

async function loadTransactions() {
  return readJson(files.transactions, []);
}

async function saveTransactions(rows) {
  await writeJson(files.transactions, rows);
}

async function deductElsBalance(email, amount, meta = {}) {
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (idx === -1) throw new Error("Пользователь не найден");
  const balance = Number(users[idx].wallet) || 0;
  if (balance < amount) throw new Error("Недостаточно средств на лицевом счёте ЭЛС");
  users[idx].wallet = Math.round((balance - amount) * 100) / 100;
  await saveUsers(users);
  const tx = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    email: users[idx].email,
    type: "debit",
    amount,
    balanceAfter: users[idx].wallet,
    ...meta,
  };
  const log = await loadTransactions();
  log.push(tx);
  await saveTransactions(log);
  return { user: publicUser(users[idx]), transaction: tx };
}

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/auth/login", async (req, res) => {
  const login = String(req.body?.login ?? req.body?.email ?? "").trim();
  const password = req.body?.password ?? "";
  if (!login || !password) {
    res.status(400).json({ message: "Введите логин и пароль" });
    return;
  }
  if (isAdminLogin(login, password)) {
    res.json(publicUser({ email: ADMIN_LOGIN, name: "Администратор", trackingIds: [], role: "admin" }));
    return;
  }
  const user = await authenticateUserPassword(login, password);
  if (!user) {
    res.status(401).json({ message: "Неверный логин или пароль" });
    return;
  }
  res.json(issueSession(res, user));
});

app.post("/api/auth/refresh", async (req, res) => {
  await purgeExpiredRefreshTokens();
  const cookies = parseCookies(req);
  const refreshToken = cookies.belpost_refresh;
  if (!refreshToken) {
    res.status(401).json({ message: "Сессия истекла" });
    return;
  }
  const payload = verifyJwt(refreshToken);
  if (!payload || payload.type !== "refresh" || !payload.jti) {
    clearRefreshCookie(res, { secure: secureCookie });
    res.status(401).json({ message: "Недействительный токен" });
    return;
  }
  const stored = await findRefreshToken(payload.jti);
  if (!stored || stored.token !== refreshToken) {
    clearRefreshCookie(res, { secure: secureCookie });
    res.status(401).json({ message: "Сессия отозвана" });
    return;
  }
  const users = await loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === String(payload.sub).toLowerCase());
  if (!user) {
    await revokeRefreshToken(payload.jti);
    clearRefreshCookie(res, { secure: secureCookie });
    res.status(401).json({ message: "Пользователь не найден" });
    return;
  }
  await revokeRefreshToken(payload.jti);
  const accessToken = createAccessToken(user);
  const newRefresh = createRefreshToken(user);
  await storeRefreshToken(user.email, newRefresh);
  setRefreshCookie(res, newRefresh, { secure: secureCookie });
  res.json({ ...publicUser(user), accessToken });
});

app.post("/api/auth/logout", async (req, res) => {
  const cookies = parseCookies(req);
  const refreshToken = cookies.belpost_refresh;
  if (refreshToken) {
    const payload = verifyJwt(refreshToken);
    if (payload?.jti) await revokeRefreshToken(payload.jti);
  }
  clearRefreshCookie(res, { secure: secureCookie });
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const email = getAccessEmail(req) ?? String(req.query.login ?? req.query.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  if (email === ADMIN_LOGIN) {
    res.status(401).json({ message: "Требуется повторный вход" });
    return;
  }
  const users = await loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  res.json(publicUser(user));
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ message: "Укажите email" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email);
  if (idx === -1) {
    res.json({ message: "Если аккаунт существует, на email отправлена ссылка для сброса" });
    return;
  }
  const token = generateResetToken();
  users[idx].resetPasswordToken = token;
  users[idx].resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await saveUsers(users);
  const base = process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`;
  console.log(`[belpost] Сброс пароля для ${email}: ${base}/reset-password?token=${token}`);
  res.json({ message: "Если аккаунт существует, на email отправлена ссылка для сброса" });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = String(req.body?.token ?? "").trim();
  const password = req.body?.password ?? "";
  if (!token || !password) {
    res.status(400).json({ message: "Укажите токен и новый пароль" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex(
    (u) => u.resetPasswordToken === token && u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date(),
  );
  if (idx === -1) {
    res.status(400).json({ message: "Ссылка недействительна или истекла" });
    return;
  }
  users[idx].password = hashPassword(password);
  delete users[idx].resetPasswordToken;
  delete users[idx].resetPasswordExpires;
  await saveUsers(users);
  res.json({ message: "Пароль успешно изменён" });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const trimmedEmail = String(email ?? "").trim().toLowerCase();
  const trimmedName = String(name ?? "").trim();
  if (!trimmedName || !trimmedEmail || !password) {
    res.status(400).json({ message: "Заполните все поля" });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    res.status(400).json({ message: "Некорректный email" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
    return;
  }
  if (isAdminLogin(trimmedEmail, password)) {
    res.status(400).json({ message: "Этот email зарезервирован" });
    return;
  }
  const users = await loadUsers();
  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    res.status(409).json({ message: "Пользователь с таким email уже существует" });
    return;
  }
  const user = ensureUserMeta({
    email: trimmedEmail,
    password: hashPassword(password),
    name: trimmedName,
    trackingIds: [],
    role: "user",
    wallet: 0,
    address: "",
    phone: "",
  });
  users.push(user);
  await saveUsers(users);
  res.json(issueSession(res, user));
});

app.get("/api/tariffs", rateLimitPublic, async (_, res) => {
  try {
    res.json(await cachedRead("tariffs", files.tariffs, []));
  } catch (error) {
    res.status(500).json({ message: "Не удалось загрузить тарифы", error: String(error) });
  }
});

app.post("/api/tariffs", async (req, res) => {
  try {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ message: "Неверные учетные данные администратора" });
      return;
    }
    if (!Array.isArray(req.body)) {
      res.status(400).json({ message: "Ожидается массив тарифов" });
      return;
    }
    const validated = req.body.map((item) => ({
      id: String(item.id ?? ""),
      title: String(item.title ?? ""),
      price: Number(item.price ?? 0),
    }));
    if (validated.some((item) => !item.id.trim() || !item.title.trim() || Number.isNaN(item.price) || item.price < 0)) {
      res.status(400).json({ message: "Некорректный формат тарифов" });
      return;
    }
    await writeJson(files.tariffs, validated);
    bustCache("tariffs", "notifications");
    res.json({ message: "Тарифы обновлены", tariffs: validated });
  } catch (error) {
    res.status(500).json({ message: "Не удалось сохранить тарифы", error: String(error) });
  }
});

app.get("/api/news", async (_, res) => {
  res.json(await cachedRead("news", files.news, []));
});

app.get("/api/publications", async (_, res) => {
  res.json(await cachedRead("publications", files.publications, []));
});

app.get("/api/stamps", async (_, res) => {
  res.json(await cachedRead("stamps", files.stamps, []));
});

app.get("/api/reviews", async (_, res) => {
  res.json(await cachedRead("reviews", files.reviews, []));
});

app.get("/api/notifications", async (req, res) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }

  const [news, orders] = await Promise.all([
    cachedRead("news", files.news, []),
    readJson(files.orders, []),
  ]);

  const items = [];

  news.slice(0, 8).forEach((n) => {
    if (!n?.title?.trim()) return;
    items.push({
      id: `news-${n.id}`,
      type: "news",
      title: "Новости и акции",
      message: n.title,
      link: `/?news=${encodeURIComponent(n.id)}#news`,
      read: false,
      createdAt: n.date ?? new Date().toISOString(),
    });
  });

  orders
    .filter((o) => o.userEmail?.toLowerCase() === email)
    .slice(-5)
    .reverse()
    .forEach((order) => {
      items.push({
        id: `order-${order.id}`,
        type: "order",
        title: "Ваш заказ",
        message: `Заказ ${order.id.slice(0, 8)}… — ${order.status === "shipped" ? "отправлен" : order.status === "done" ? "выполнен" : "в обработке"}`,
        link: "/",
        read: order.status === "done",
        createdAt: order.createdAt,
      });
    });

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(items.slice(0, 10));
});

app.get("/api/offices", async (_, res) => {
  res.json(await cachedRead("offices", files.offices, []));
});

app.get("/api/chat/history", async (req, res) => {
  const email = getAccessEmail(req);
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  const sessions = await readJson(files.chatSessions, {});
  res.json({ messages: sessions[email]?.messages ?? [] });
});

app.put("/api/chat/history", async (req, res) => {
  const email = getAccessEmail(req);
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const sessions = await readJson(files.chatSessions, {});
  sessions[email] = {
    messages: messages.slice(-100).map((m) => ({ from: m.from, text: String(m.text ?? "") })),
    updatedAt: new Date().toISOString(),
  };
  await writeJson(files.chatSessions, sessions);
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body ?? {};
  if (!message?.trim()) {
    res.status(400).json({ message: "Введите сообщение" });
    return;
  }

  try {
    const email = getAccessEmail(req);
    const [tariffs, news, sessions] = await Promise.all([
      cachedRead("tariffs", files.tariffs, []),
      cachedRead("news", files.news, []),
      readJson(files.chatSessions, {}),
    ]);

    const history = email ? (sessions[email]?.messages ?? []) : [];
    const openAiMessages = [
      { role: "system", content: buildAnastasiaSystemPrompt(tariffs, news) },
      ...historyToOpenAiMessages(history),
      { role: "user", content: String(message).trim() },
    ];

    const reply = await callPollinationsChat(openAiMessages);

    if (email) {
      const next = [
        ...history,
        { from: "user", text: String(message).trim() },
        { from: "bot", text: reply },
      ].slice(-100);
      sessions[email] = { messages: next, updatedAt: new Date().toISOString() };
      await writeJson(files.chatSessions, sessions);
    }

    res.json({ reply });
  } catch (err) {
    console.error("[belpost/chat] Ошибка Pollinations:", err);
    res.status(502).json({
      message: err instanceof Error ? err.message : "Не удалось получить ответ от ассистента",
    });
  }
});

app.post("/api/queue/ticket", async (req, res) => {
  const email = getAccessEmail(req) ?? String(req.body?.email ?? "").trim().toLowerCase();
  const { officeId, date, time, name } = req.body ?? {};
  if (!email || !officeId || !date || !time) {
    res.status(400).json({ message: "Заполните все поля бронирования" });
    return;
  }
  const offices = await cachedRead("offices", files.offices, []);
  const office = offices.find((o) => o.id === officeId);
  if (!office) {
    res.status(404).json({ message: "Отделение не найдено" });
    return;
  }
  const tickets = await readJson(files.queueTickets, []);
  const ticket = {
    id: randomUUID(),
    email,
    name: String(name ?? "").trim(),
    officeId,
    officeCity: office.city,
    officeAddress: office.address,
    date: String(date),
    time: String(time),
    status: "booked",
    createdAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  await writeJson(files.queueTickets, tickets);
  res.json({ message: "Талон забронирован", ticket });
});

app.patch("/api/user/profile", async (req, res) => {
  const authEmail = getAccessEmail(req);
  const { email, address, phone, name, consents } = req.body ?? {};
  const targetEmail = (authEmail ?? String(email ?? "")).toLowerCase();
  if (!targetEmail) {
    res.status(400).json({ message: "Email обязателен" });
    return;
  }
  if (authEmail && authEmail !== targetEmail) {
    res.status(403).json({ message: "Недостаточно прав" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === targetEmail);
  if (idx === -1) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  if (name !== undefined) users[idx].name = String(name).trim();
  if (address !== undefined) users[idx].address = String(address);
  if (phone !== undefined) users[idx].phone = String(phone);
  if (consents && typeof consents === "object") {
    users[idx].consents = {
      processing: Boolean(consents.processing),
      marketing: Boolean(consents.marketing),
      analytics: Boolean(consents.analytics),
    };
  }
  ensureUserMeta(users[idx]);
  await saveUsers(users);
  res.json(publicUser(users[idx]));
});

app.post("/api/user/change-password", async (req, res) => {
  const email = getAccessEmail(req);
  const { currentPassword, newPassword } = req.body ?? {};
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "Укажите текущий и новый пароль (мин. 6 символов)" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email);
  if (idx === -1 || !verifyPassword(currentPassword, users[idx].password)) {
    res.status(401).json({ message: "Неверный текущий пароль" });
    return;
  }
  users[idx].password = hashPassword(newPassword);
  await saveUsers(users);
  res.json({ message: "Пароль изменён" });
});

app.delete("/api/user/account", async (req, res) => {
  const email = getAccessEmail(req);
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  const users = await loadUsers();
  const next = users.filter((u) => u.email.toLowerCase() !== email);
  if (next.length === users.length) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  await saveUsers(next);
  const sessions = await readJson(files.chatSessions, {});
  delete sessions[email];
  await writeJson(files.chatSessions, sessions);
  clearRefreshCookie(res, { secure: secureCookie });
  res.json({ message: "Аккаунт удалён" });
});

app.get("/api/track/:id", rateLimitPublic, async (req, res) => {
  const id = String(req.params.id ?? "").toUpperCase();
  if (!isValidTrackingId(id)) {
    res.status(400).json({ message: "Некорректный формат трек-номера" });
    return;
  }
  const db = await readJson(files.tracking, {});
  const record = db[id];
  if (!record) {
    res.status(404).json({ message: "Отправление не найдено" });
    return;
  }
  res.json(record);
});

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY ?? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

app.post("/api/messages", async (req, res) => {
  const { name, email, message, captchaToken } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ message: "Заполните все обязательные поля" });
    return;
  }
  const captchaOk = await verifyRecaptcha(captchaToken);
  if (!captchaOk) {
    res.status(400).json({ message: "Подтвердите, что вы не робот" });
    return;
  }
  const messages = await readJson(files.messages, []);
  const entry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: String(name).trim(),
    email: String(email).trim(),
    message: String(message).trim(),
    status: "new",
  };
  messages.push(entry);
  await writeJson(files.messages, messages);
  res.json({ message: "Обращение принято", id: entry.id });
});

app.get("/api/orders", async (req, res) => {
  const email = String(req.query.email ?? "").toLowerCase();
  const orders = await readJson(files.orders, []);
  if (!email) {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ message: "Доступ запрещён" });
      return;
    }
    res.json(orders);
    return;
  }
  res.json(orders.filter((o) => o.userEmail?.toLowerCase() === email));
});

app.post("/api/orders", async (req, res) => {
  const { userEmail, sender, recipient, delivery, items, total, paymentMethod } = req.body ?? {};
  if (!userEmail?.trim()) {
    res.status(401).json({ message: "Для оформления заказа войдите в личный кабинет" });
    return;
  }
  if (!sender?.name || !sender?.phone || !recipient?.name || !delivery?.method || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Неполные данные заказа" });
    return;
  }
  const orderTotal = Number(total) || 0;
  let walletAfter = null;

  if (paymentMethod === "els") {
    try {
      const result = await deductElsBalance(userEmail, orderTotal, {
        description: "Оплата заказа",
        orderPreview: items.map((i) => i.title).join(", "),
      });
      walletAfter = result.user.wallet;
    } catch (e) {
      res.status(400).json({ message: e instanceof Error ? e.message : "Ошибка списания ЭЛС" });
      return;
    }
  }

  const orders = await readJson(files.orders, []);
  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: paymentMethod === "els" ? "paid" : "new",
    userEmail: userEmail.trim(),
    sender,
    recipient,
    delivery,
    items,
    total: orderTotal,
    paymentMethod: paymentMethod ?? "standard",
  };
  orders.push(order);
  await writeJson(files.orders, orders);
  bustCache("orders", "notifications");
  res.json({ message: "Заказ оформлен", order, wallet: walletAfter });
});

app.get("/api/user/transactions", async (req, res) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(400).json({ message: "Email обязателен" });
    return;
  }
  const log = await loadTransactions();
  res.json(log.filter((t) => t.email?.toLowerCase() === email).slice(-50).reverse());
});

app.post("/api/user/els/topup", async (req, res) => {
  const { email, amount } = req.body ?? {};
  const trimmed = String(email ?? "").trim().toLowerCase();
  const sum = Number(amount);
  if (!trimmed || !sum || sum <= 0) {
    res.status(400).json({ message: "Некорректные данные пополнения" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === trimmed);
  if (idx === -1) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  users[idx].wallet = Math.round(((Number(users[idx].wallet) || 0) + sum) * 100) / 100;
  await saveUsers(users);
  const tx = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    email: trimmed,
    type: "credit",
    amount: sum,
    balanceAfter: users[idx].wallet,
    description: "Пополнение лицевого счёта ЭЛС",
  };
  const log = await loadTransactions();
  log.push(tx);
  await saveTransactions(log);
  res.json({ wallet: users[idx].wallet, transaction: tx });
});

app.post("/api/npes/send", async (req, res) => {
  const { userEmail, recipient, subject, body, attachmentName, recipientInSystem } = req.body ?? {};
  if (!userEmail?.trim() || !recipient?.trim() || !subject?.trim() || !body?.trim()) {
    res.status(400).json({ message: "Заполните адресата, тему и текст письма" });
    return;
  }
  const isHybrid = recipientInSystem === false;
  const npesId = randomUUID();
  const npes = await readJson(files.npes, []);
  const entry = {
    id: npesId,
    createdAt: new Date().toISOString(),
    userEmail: userEmail.trim(),
    recipient: String(recipient).trim(),
    subject: String(subject).trim(),
    body: String(body).trim(),
    attachmentName: attachmentName ? String(attachmentName) : null,
    mode: isHybrid ? "hybrid" : "digital",
    status: isHybrid ? "queued_print" : "delivered_digital",
  };
  npes.push(entry);

  const orders = await readJson(files.orders, []);
  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: isHybrid ? "hybrid" : "digital",
    type: "npes",
    userEmail: userEmail.trim(),
    npesId,
    recipient: { name: entry.recipient, email: entry.recipient },
    items: [{ title: `НПЭС: ${entry.subject}`, price: isHybrid ? 2.5 : 1.2 }],
    total: isHybrid ? 2.5 : 1.2,
    delivery: { method: isHybrid ? "office_print" : "digital", note: isHybrid ? "Гибридное: печать в отделении" : "Цифровая доставка" },
  };
  orders.push(order);

  await Promise.all([writeJson(files.npes, npes), writeJson(files.orders, orders)]);
  bustCache("orders", "notifications");
  res.json({
    message: isHybrid
      ? "Письмо принято. Отправление помечено как «Гибридное» — будет напечатано в отделении."
      : "Электронное письмо НПЭС успешно отправлено.",
    entry,
    order,
  });
});

app.get("/api/npes", async (req, res) => {
  const email = String(req.query.email ?? "").trim().toLowerCase();
  if (!email) {
    res.status(401).json({ message: "Требуется авторизация" });
    return;
  }
  const npes = await readJson(files.npes, []);
  res.json(npes.filter((n) => n.userEmail?.toLowerCase() === email).slice(-30).reverse());
});

// ── Admin API ──

app.get("/api/admin/stats", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const [orders, messages, news, tracking] = await Promise.all([
    readJson(files.orders, []),
    readJson(files.messages, []),
    readJson(files.news, []),
    readJson(files.tracking, {}),
  ]);
  res.json({
    orders: orders.length,
    messages: messages.length,
    newMessages: messages.filter((m) => m.status !== "read").length,
    news: news.length,
    tracking: Object.keys(tracking).length,
  });
});

app.get("/api/admin/messages", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const messages = await readJson(files.messages, []);
  res.json(messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.patch("/api/admin/messages/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const messages = await readJson(files.messages, []);
  const idx = messages.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: "Обращение не найдено" });
    return;
  }
  messages[idx] = { ...messages[idx], status: req.body?.status ?? "read" };
  await writeJson(files.messages, messages);
  res.json(messages[idx]);
});

app.delete("/api/admin/messages/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const messages = await readJson(files.messages, []);
  const next = messages.filter((m) => m.id !== req.params.id);
  await writeJson(files.messages, next);
  res.json({ message: "Удалено" });
});

app.patch("/api/admin/orders/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const orders = await readJson(files.orders, []);
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: "Заказ не найден" });
    return;
  }
  orders[idx] = { ...orders[idx], status: req.body?.status ?? orders[idx].status };
  await writeJson(files.orders, orders);
  res.json(orders[idx]);
});

app.post("/api/admin/news", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const news = await readJson(files.news, []);
  const item = {
    id: `news-${randomUUID().slice(0, 8)}`,
    tag: String(req.body?.tag ?? "Новости"),
    date: req.body?.date ?? new Date().toISOString().slice(0, 10),
    title: String(req.body?.title ?? ""),
    excerpt: String(req.body?.excerpt ?? ""),
    body: String(req.body?.body ?? ""),
    image: String(req.body?.image ?? ""),
  };
  if (!item.title.trim()) {
    res.status(400).json({ message: "Укажите заголовок" });
    return;
  }
  news.unshift(item);
  await writeJson(files.news, news);
  bustCache("news", "notifications");
  res.json(item);
});

app.put("/api/admin/news/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const news = await readJson(files.news, []);
  const idx = news.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: "Новость не найдена" });
    return;
  }
  news[idx] = { ...news[idx], ...req.body, id: news[idx].id };
  await writeJson(files.news, news);
  res.json(news[idx]);
});

app.delete("/api/admin/news/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const news = await readJson(files.news, []);
  await writeJson(files.news, news.filter((n) => n.id !== req.params.id));
  res.json({ message: "Удалено" });
});

app.get("/api/admin/tracking", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  res.json(await readJson(files.tracking, {}));
});

app.put("/api/admin/tracking/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const id = String(req.params.id ?? "").toUpperCase();
  if (!isValidTrackingId(id)) {
    res.status(400).json({ message: "Некорректный трек-номер" });
    return;
  }
  const db = await readJson(files.tracking, {});
  db[id] = req.body;
  await writeJson(files.tracking, db);
  res.json(db[id]);
});

app.delete("/api/admin/tracking/:id", async (req, res) => {
  if (!isAdminAuthorized(req)) {
    res.status(401).json({ message: "Доступ запрещён" });
    return;
  }
  const id = String(req.params.id ?? "").toUpperCase();
  const db = await readJson(files.tracking, {});
  delete db[id];
  await writeJson(files.tracking, db);
  res.json({ message: "Удалено" });
});

const isProd = process.env.NODE_ENV === "production";
const distClient = path.join(__dirname, "..", "dist", "client");

async function setupProduction() {
  if (!isProd) return;

  app.use(express.static(distClient, { index: false, maxAge: "1d" }));

  const ssrUrl = pathToFileURL(path.join(__dirname, "..", "dist", "server", "server.js")).href;
  const { default: ssr } = await import(ssrUrl);

  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    try {
      const protocol = req.headers["x-forwarded-proto"] ?? req.protocol ?? "http";
      const host = req.headers.host ?? `localhost:${PORT}`;
      const url = `${protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (!value) continue;
        headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
      }
      const response = await ssr.fetch(new Request(url, { method: req.method, headers }));
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "transfer-encoding") res.setHeader(key, value);
      });
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  });
}

await setupProduction();

app.listen(PORT, () => {
  console.log(`Belpost API started on http://localhost:${PORT}${isProd ? " (production + SSR)" : ""}`);
});
