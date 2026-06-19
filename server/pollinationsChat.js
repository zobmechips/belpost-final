const POLLINATIONS_URL = "https://text.pollinations.ai/openai";
const MODELS = ["openai", "mistral"];

function buildSystemPrompt(knowledge) {
  const tariffs = (knowledge.tariffs ?? [])
    .filter((t) => t.price > 0)
    .slice(0, 12)
    .map((t) => `${t.title}: ${t.price} BYN`)
    .join("; ");
  const news = (knowledge.news ?? [])
    .slice(0, 3)
    .map((n) => n.title)
    .join("; ");

  return `Тебя зовут Анастасия. Ты — официальный, умный и вежливый ИИ-ассистент РУП «Белпочта». Общайся как живой человек на абсолютно любые темы — не используй шаблонные заготовки. Если пользователь спрашивает про тарифы, сроки или услуги компании, используй актуальные данные из базы Белпочты.

Актуальные тарифы: ${tariffs || "уточняйте на портале"}.
Свежие новости: ${news || "см. раздел «Новости» на главной"}.
Услуги: подписка на издания, филателия, отслеживание посылок, НПЭС, лицевой счёт ЭЛС, контакт-центр 154, карта отделений.
Отвечай по-русски, развёрнуто и по делу.`;
}

function extractReply(data) {
  if (typeof data === "string") return data.trim();
  const choice = data?.choices?.[0];
  if (choice?.message?.content) return String(choice.message.content).trim();
  if (choice?.text) return String(choice.text).trim();
  if (data?.reply) return String(data.reply).trim();
  if (data?.content) return String(data.content).trim();
  return "";
}

async function requestModel(model, messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ model, messages }),
    });
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      if (raw.trim()) return raw.trim();
      throw new Error(`Pollinations: некорректный ответ (${response.status})`);
    }
    if (!response.ok) {
      throw new Error(data?.error?.message ?? data?.message ?? `Pollinations HTTP ${response.status}`);
    }
    const reply = extractReply(data);
    if (!reply) throw new Error("Pollinations вернул пустой ответ");
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPollinationsReply(userMessage, knowledge = {}) {
  const systemPrompt = buildSystemPrompt(knowledge);
  const history = (knowledge.history ?? [])
    .slice(-8)
    .filter((m) => m?.text && (m.from === "user" || m.from === "bot"))
    .map((m) => ({
      role: m.from === "user" ? "user" : "assistant",
      content: String(m.text).trim(),
    }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: String(userMessage).trim() },
  ];

  let lastError;
  for (const model of MODELS) {
    try {
      return await requestModel(model, messages);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("ИИ-ассистент временно недоступен");
}
