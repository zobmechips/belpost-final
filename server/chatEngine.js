function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scoreTopics(tokens, keywords) {
  return keywords.reduce((s, kw) => s + (tokens.some((t) => t.includes(kw) || kw.includes(t)) ? 1 : 0), 0);
}

function formatTariffList(tariffs, limit = 5) {
  return tariffs
    .filter((t) => t.price > 0)
    .slice(0, limit)
    .map((t) => `«${t.title}» — ${t.price} BYN`)
    .join("; ");
}

function buildGreeting(name = "Анастасия") {
  const intros = [
    `Здравствуйте! Меня зовут ${name}, я виртуальный консультант РУП «Белпочта».`,
    `Рада приветствовать вас на официальном портале Белпочты! Я ${name}, ваш цифровой помощник.`,
    `Добрый день! ${name} на связи — помогу разобраться с услугами почтовой связи Беларуси.`,
  ];
  const offers = [
    "Расскажу о тарифах, отслеживании, подписке, филателии, НПЭС и лицевом счёте ЭЛС.",
    "Могу подсказать по отправлениям, оплате через ЭЛС, электронным письмам и работе отделений.",
    "Задайте вопрос свободно — подберу решение под вашу ситуацию.",
  ];
  return `${pick(intros)} ${pick(offers)}`;
}

function weaveBelpostContext(tariffs, news, userTopic) {
  const tariffHint = tariffs.length ? ` Актуальные ориентиры: ${formatTariffList(tariffs, 3)}.` : "";
  const newsHint = news[0]?.title ? ` Среди свежих объявлений: «${news[0].title}».` : "";
  return `${userTopic}${tariffHint}${newsHint}`;
}

function answerOffTopic(tokens, tariffs, news) {
  const weather = scoreTopics(tokens, ["погод", "дожд", "снег", "жар", "холод", "температур"]);
  const mood = scoreTopics(tokens, ["настроен", "устал", "скуч", "груст", "рад", "счаст"]);
  const tech = scoreTopics(tokens, ["компьютер", "телефон", "интернет", "сайт", "ошибк", "баг"]);

  if (weather > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Погода, конечно, влияет на логистику — в непогоду доставка может занять чуть больше времени, но наша сеть отделений работает стабильно.",
    );
  }
  if (mood > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Спасибо, что делитесь — ценю доверие. Если хотите отвлечься полезным делом, могу помочь оформить подписку, отправить НПЭС-письмо или проверить посылку.",
    );
  }
  if (tech > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Если что-то на портале работает не так, попробуйте обновить страницу или войти в личный кабинет заново. Я также могу подсказать альтернативный путь к нужной услуге.",
    );
  }

  const mirrors = [
    "Интересный вопрос! Прямо по этой теме у меня нет внутреннего регламента, но в контексте Белпочты могу предложить практичный путь:",
    "Понимаю запрос. Даже если тема выходит за рамки почты, постараюсь дать полезный ориентир и связать его с нашими сервисами:",
    "Хороший повод обсудить детали. С позиции консультанта Белпочты я бы рекомендовала такой подход:",
  ];
  const bodies = [
    "оформите отправление через личный кабинет, пополните лицевой счёт ЭЛС и отслеживайте статус в реальном времени с QR-кодом для отделения.",
    "загляните в разделы «Подписка» и «Филателия» — там премиальный каталог с прозрачными ценами, а покупка доступна после авторизации.",
    "воспользуйтесь НПЭС для защищённого электронного письма: если адресат не в системе, мы автоматически подготовим гибридную печать в отделении.",
  ];
  return `${pick(mirrors)} ${pick(bodies)}${weaveBelpostContext(tariffs, news, "")}`;
}

export async function generateChatReply(rawText, knowledge = {}) {
  const text = String(rawText ?? "").trim();
  const tokens = tokenize(text);
  const tariffs = knowledge.tariffs ?? [];
  const news = knowledge.news ?? [];
  const publications = knowledge.publications ?? [];
  const stamps = knowledge.stamps ?? [];

  if (!text) {
    return buildGreeting();
  }

  const scores = {
    greet: scoreTopics(tokens, ["привет", "здравств", "добрый", "доброе", "hello", "hi", "салют", "хай", "как дела"]),
    thanks: scoreTopics(tokens, ["спасибо", "благодар", "thanks"]),
    track: scoreTopics(tokens, ["трек", "отслеж", "посылк", "отправлен", "track", "номер", "где", "qr", "код"]),
    philately: scoreTopics(tokens, ["марк", "филател", "коллекц", "конверт", "блок", "сувенир"]),
    subscription: scoreTopics(tokens, ["подписк", "газет", "журнал", "издани", "пресса"]),
    news: scoreTopics(tokens, ["новост", "акци", "событи", "объяв"]),
    auth: scoreTopics(tokens, ["войти", "логин", "пароль", "регистрац", "кабинет", "авториз"]),
    tariff: scoreTopics(tokens, ["тариф", "цен", "стоим", "сколько", "прайс", "оплат", "byn", "ems", "доставк", "письм", "посыл"]),
    contact: scoreTopics(tokens, ["контакт", "телефон", "звон", "154", "поддерж", "оператор"]),
    office: scoreTopics(tokens, ["отделен", "офис", "адрес", "карт"]),
    cart: scoreTopics(tokens, ["корзин", "заказ", "оформ", "купить", "оплат"]),
    npes: scoreTopics(tokens, ["нпэс", "электронн", "письм", "вложен", "гибрид"]),
    els: scoreTopics(tokens, ["элс", "баланс", "лицев", "кошел", "счет", "счёт"]),
  };

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (scores.greet > 0 && scores.greet >= top[1]) {
    if (tokens.includes("дела") || text.includes("как дела")) {
      return weaveBelpostContext(tariffs, news, "У меня всё отлично, система работает штатно, и я готова помочь вам прямо сейчас.");
    }
    return buildGreeting();
  }

  if (scores.thanks > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Всегда пожалуйста! Рада была помочь — если понадобится уточнить тариф, проверить посылку или оформить услугу, я рядом.",
    );
  }

  if (scores.track > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Для отслеживания введите 13-значный номер или международный формат (RB123456789BY) на главной странице. После проверки вы увидите пошаговый статус и QR-код для бесконтактной выдачи в отделении — оператор отсканирует его без паспорта.",
    );
  }

  if (scores.npes > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "НПЭС — это защищённая отправка электронного письма из личного кабинета: укажите адресата, тему, текст и вложение. Если получателя нет в цифровой базе, отправление автоматически помечается как «Гибридное» и будет напечатано в отделении для вручения на бумаге.",
    );
  }

  if (scores.els > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "ЭЛС — ваш виртуальный лицевой счёт в BYN. Пополните баланс в профиле и при оформлении заказа выберите «Списать с лицевого счёта ЭЛС» — средства спишутся мгновенно, а транзакция попадёт в журнал операций.",
    );
  }

  if (scores.philately > 0) {
    const sample = stamps[0];
    const extra = sample ? ` Например, сейчас в каталоге есть «${sample.title}» за ${sample.price} BYN.` : "";
    return weaveBelpostContext(
      tariffs,
      news,
      `Филателия — премиальный каталог марок и коллекционных изделий на /philately. Откройте карточку товара для описания; добавление в корзину доступно после входа в личный кабинет.${extra}`,
    );
  }

  if (scores.subscription > 0) {
    const sample = publications[0];
    const extra = sample ? ` Из популярного: «${sample.title}» — от ${sample.price} BYN в месяц.` : "";
    return weaveBelpostContext(
      tariffs,
      news,
      `Подписка оформляется в разделе /subscription: выберите издание, в модальном окне укажите период (месяц или полгода) и добавьте в корзину после авторизации.${extra}`,
    );
  }

  if (scores.news > 0) {
    const latest = news.slice(0, 2);
    const digest = latest.length
      ? latest.map((n) => `«${n.title}»${n.excerpt ? ` — ${n.excerpt.slice(0, 90)}` : ""}`).join("; ")
      : "на главной странице в блоке «Новости»";
    return weaveBelpostContext(tariffs, news, `Актуальная повестка: ${digest}. Могу подробнее рассказать о любой публикации.`);
  }

  if (scores.auth > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Авторизация открывает корзину, НПЭС, лицевой счёт ЭЛС и историю заказов. Нажмите «Войти» в шапке — регистрация занимает меньше минуты, данные сохраняются на сервере для последующих визитов.",
    );
  }

  if (scores.tariff > 0) {
    const matched = tariffs.filter((t) => tokens.some((w) => w.length > 3 && String(t.title).toLowerCase().includes(w)));
    if (matched.length) {
      const list = matched.slice(0, 4).map((t) => `• ${t.title} — ${t.price} BYN`).join("\n");
      return `По вашему запросу подобрала тарифы:\n${list}\n\nТочный расчёт — в калькуляторе «Онлайн-услуги» на главной.${news[0] ? ` Также обратите внимание: ${news[0].title}.` : ""}`;
    }
    const list = formatTariffList(tariffs, 6);
    return `Стоимость услуг зависит от веса, направления и срочности. Базовые ориентиры: ${list}. Уточните тип отправления — назову точнее или подскажу калькулятор.`;
  }

  if (scores.contact > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Контакт-центр: MTS +375 (33) 300-01-54, A1 +375 (44) 590-01-54. Также Telegram и Viber — через зелёную кнопку связи в углу экрана.",
    );
  }

  if (scores.office > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Карта отделений доступна в разделе «О компании» — кликните на маркер, чтобы увидеть адрес и часы работы. Для выдачи посылки используйте QR-код из трекинга.",
    );
  }

  if (scores.cart > 0) {
    return weaveBelpostContext(
      tariffs,
      news,
      "Добавьте услуги в корзину (нужна авторизация), затем пройдите мастер оформления: отправитель, получатель, доставка и оплата — в том числе с лицевого счёта ЭЛС.",
    );
  }

  return answerOffTopic(tokens, tariffs, news);
}
