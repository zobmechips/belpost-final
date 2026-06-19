import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
};

const app = express();
const PORT = Number(process.env.API_PORT ?? 4000);
const ADMIN_LOGIN = process.env.ADMIN_LOGIN ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";
const ADMIN_EMAIL = "admin@belpost.by";

app.use(cors());
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

function isAdminLogin(email, password) {
  const login = String(email ?? "").trim().toLowerCase();
  return (login === ADMIN_LOGIN || login === ADMIN_EMAIL) && password === ADMIN_PASSWORD;
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
  };
}

async function loadUsers() {
  return readJson(files.users, []);
}

async function saveUsers(users) {
  await writeJson(files.users, users);
}

function normalizeChat(text) {
  return String(text ?? "").toLowerCase().replace(/ё/g, "е").trim();
}

function findTariff(tariffs, patterns) {
  return tariffs.find((t) => patterns.some((p) => p.test(String(t.title ?? "").toLowerCase()) || p.test(String(t.id ?? "").toLowerCase())));
}

async function generateChatReply(rawText) {
  const text = normalizeChat(rawText);
  if (!text) {
    return "Напишите, пожалуйста, ваш вопрос — я с радостью помогу с тарифами, отслеживанием, подпиской или филателией.";
  }

  const [tariffs, news] = await Promise.all([
    cachedRead("tariffs", files.tariffs, []),
    cachedRead("news", files.news, []),
  ]);

  if (/^(привет|здравств|добрый|доброе|hi|hello|салют|хай)\b/.test(text) || /\bкак дела\b/.test(text)) {
    if (/\bкак дела\b/.test(text)) {
      return "У меня всё отлично, спасибо! Готова помочь вам с услугами Белпочты: тарифы, трекинг, подписка, филателия. Что вас интересует?";
    }
    return "Здравствуйте! Я Анастасия, виртуальный консультант Белпочты. Рада помочь с тарифами, отслеживанием посылок, подпиской на издания и филателией. Задайте вопрос — отвечу по делу.";
  }

  if (/спасибо|благодар/.test(text)) {
    return "Всегда пожалуйста! Если появятся ещё вопросы по услугам Белпочты — я на связи.";
  }

  if (/трек|отслеж|посылк|отправлен|track|номер|где моя|где посылка/.test(text)) {
    return "Я могу помочь! Введите ваш 13-значный номер в поле на главном баннере, и наша система покажет детальный путь посылки. Также поддерживается международный формат: две буквы, 9 цифр и две буквы (например, RB123456789BY).";
  }

  if (/марк|филател|коллекц|конверт/.test(text)) {
    return "Раздел «Филателия» доступен в верхнем меню или по адресу /philately — там каталог марок, конвертов и коллекционных наборов с актуальными ценами. Могу подсказать по конкретной позиции, если уточните название.";
  }

  if (/подписк|газет|журнал|издани/.test(text)) {
    const sub = findTariff(tariffs, [/подписк/]);
    const price = sub ? ` Базовый тариф подписки — ${sub.price} BYN.` : "";
    return `Оформить подписку можно в разделе «Подписка» (/subscription): выберите издание, период и адрес доставки.${price} Нужна помощь с выбором — напишите название газеты или журнала.`;
  }

  if (/новост|акци|событи/.test(text)) {
    const latest = news[0];
    if (latest?.title) {
      return `Свежая новость: «${latest.title}» — ${latest.excerpt ?? latest.body?.slice(0, 120) ?? ""}. Полный список публикаций — на главной странице в блоке «Новости».`;
    }
    return "Актуальные новости и объявления Белпочты размещены на главной странице в разделе «Новости».";
  }

  if (/админ|кабинет|личн|регистрац|войти|логин|пароль/.test(text)) {
    return "Для входа в личный кабинет нажмите «Войти» в шапке сайта. Там доступны история заказов, отслеживание посылок и настройки профиля. Регистрация занимает меньше минуты.";
  }

  if (/тариф|цен|стоим|сколько|прайс|price|оплат|byn|руб|деньг|ems|экспресс|доставк|пересыл|письм/.test(text)) {
    const letter = findTariff(tariffs, [/письм|бланк|post-shipment|отправлен/]);
    const ems = findTariff(tariffs, [/международ|international|ems|экспресс/]);
    const courier = findTariff(tariffs, [/курьер|courier/]);
    const parts = [];

    if (letter) parts.push(`${letter.title} — ${letter.price} BYN`);
    if (ems) parts.push(`международная / экспресс-доставка (${ems.title}) — ${ems.price} BYN`);
    if (courier) parts.push(`${courier.title} — ${courier.price} BYN`);

    const matched = tariffs.filter((t) => text.split(/\s+/).some((w) => w.length > 3 && String(t.title).toLowerCase().includes(w)));
    if (matched.length > 0 && matched.length <= 4) {
      const list = matched.map((t) => `• ${t.title} — ${t.price} BYN`).join("\n");
      return `По вашему запросу нашла актуальные тарифы:\n${list}\n\nТочный расчёт — в калькуляторе на главной в разделе «Онлайн-услуги».`;
    }

    if (parts.length > 0) {
      return `Актуальные ориентиры по стоимости:\n• ${parts.join("\n• ")}\n\nПолный прайс и интерактивный калькулятор — на главной странице в блоке «Онлайн-услуги».`;
    }

    const top = tariffs.filter((t) => t.price > 0).slice(0, 6);
    const list = top.map((t) => `• ${t.title} — ${t.price} BYN`).join("\n");
    return `Вот основные тарифы на сегодня:\n${list}\n\nУточните услугу — назову точную стоимость или подскажу калькулятор.`;
  }

  if (/контакт|телефон|звон|154|поддерж|оператор|связ/.test(text)) {
    return "Контакт-центр Белпочты: MTS +375 (33) 300-01-54, A1 +375 (44) 590-01-54. Также доступны Telegram и Viber через кнопку связи в правом нижнем углу. Чем ещё помочь?";
  }

  if (/отделен|офис|адрес|где найти/.test(text)) {
    const offices = findTariff(tariffs, [/отделен|offices/]);
    return `Сеть отделений Белпочты охватывает всю страну.${offices ? ` Справочник — в разделе «${offices.title}».` : ""} Уточните город — подскажу, как найти ближайшее отделение на belpost.by.`;
  }

  if (/корзин|заказ|оформ/.test(text)) {
    return "Добавьте услуги в корзину через кнопку в шапке сайта, затем оформите заказ в мастере оформления: укажите отправителя, получателя и способ доставки. Нужна помощь с конкретным шагом?";
  }

  return "Спасибо за вопрос! Я могу подробно рассказать о тарифах и стоимости, помочь с отслеживанием посылки, подсказать про подписку или филателию. Сформулируйте, пожалуйста, чуть конкретнее — и я дам точный ответ.";
}

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    res.status(400).json({ message: "Введите email и пароль" });
    return;
  }
  if (isAdminLogin(email, password)) {
    res.json(publicUser({ email: ADMIN_EMAIL, name: "Администратор", trackingIds: [], role: "admin" }));
    return;
  }
  const users = await loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase() && u.password === password);
  if (!user) {
    res.status(401).json({ message: "Неверный email или пароль" });
    return;
  }
  res.json(publicUser(user));
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
  const user = { email: trimmedEmail, password, name: trimmedName, trackingIds: [], role: "user", wallet: 0, address: "", phone: "" };
  users.push(user);
  await saveUsers(users);
  res.json(publicUser(user));
});

app.get("/api/tariffs", async (_, res) => {
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

app.get("/api/notifications", async (_, res) => {
  const [orders, news, tariffs] = await Promise.all([
    cachedRead("orders", files.orders, []),
    cachedRead("news", files.news, []),
    cachedRead("tariffs", files.tariffs, []),
  ]);

  const items = [];

  orders.slice(-4).reverse().forEach((order) => {
    items.push({
      id: `order-${order.id}`,
      title: "Статус заказа",
      message: `Заказ ${order.id.slice(0, 8)}… — ${order.status === "shipped" ? "отправлен" : order.status === "done" ? "выполнен" : "в обработке"}. Сумма ${Number(order.total || 0).toFixed(2)} BYN`,
      read: order.status === "done",
      createdAt: order.createdAt,
    });
  });

  news.slice(0, 3).forEach((n) => {
    items.push({
      id: `news-${n.id}`,
      title: "Акция и новости",
      message: n.title,
      read: false,
      createdAt: n.date ?? new Date().toISOString(),
    });
  });

  const sampleTariff = tariffs.find((t) => t.price > 0);
  if (sampleTariff) {
    items.push({
      id: "tariff-update",
      title: "Изменение тарифов",
      message: `Актуальная стоимость «${sampleTariff.title}» — ${sampleTariff.price} BYN`,
      read: true,
      createdAt: new Date().toISOString(),
    });
  }

  res.json(items.slice(0, 8));
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body ?? {};
  if (!message?.trim()) {
    res.status(400).json({ message: "Введите сообщение" });
    return;
  }
  try {
    const reply = await generateChatReply(message);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: "Не удалось обработать сообщение", error: String(error) });
  }
});

app.patch("/api/user/profile", async (req, res) => {
  const { email, address, phone } = req.body ?? {};
  if (!email) {
    res.status(400).json({ message: "Email обязателен" });
    return;
  }
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (idx === -1) {
    res.status(404).json({ message: "Пользователь не найден" });
    return;
  }
  if (address !== undefined) users[idx].address = String(address);
  if (phone !== undefined) users[idx].phone = String(phone);
  await saveUsers(users);
  res.json(publicUser(users[idx]));
});

app.get("/api/track/:id", async (req, res) => {
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
  const { userEmail, sender, recipient, delivery, items, total } = req.body ?? {};
  if (!sender?.name || !sender?.phone || !recipient?.name || !delivery?.method || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Неполные данные заказа" });
    return;
  }
  const orders = await readJson(files.orders, []);
  const order = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
    userEmail: userEmail ?? sender.email ?? "",
    sender,
    recipient,
    delivery,
    items,
    total: Number(total) || 0,
  };
  orders.push(order);
  await writeJson(files.orders, orders);
  bustCache("orders", "notifications");
  res.json({ message: "Заказ оформлен", order });
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
