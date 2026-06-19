export type Publication = {
  id: string;
  type: string;
  category: string;
  title: string;
  period: string;
  year?: number;
  price: number;
  priceHalfYear: number;
  cover: string;
};

export type Stamp = {
  id: string;
  title: string;
  category: string;
  price: number;
  year: number;
  image: string;
  description: string;
};

export const FALLBACK_PUBLICATIONS: Publication[] = [
  { id: "pub-sb", type: "newspaper", category: "politics", title: "СБ. Беларусь сегодня", period: "Еженедельно", price: 3.9, priceHalfYear: 22, cover: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80" },
  { id: "pub-pressbol", type: "magazine", category: "sport", title: "Прессбол", period: "Еженедельно", price: 5.2, priceHalfYear: 128, cover: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&q=80" },
  { id: "pub-kacheli", type: "magazine", category: "kids", title: "Качели", period: "Ежемесячно", price: 7.8, priceHalfYear: 42.5, cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&q=80" },
  { id: "pub-kultura", type: "magazine", category: "culture", title: "Культура", period: "Ежемесячно", price: 6.4, priceHalfYear: 35, cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80" },
  { id: "pub-zviazda", type: "newspaper", category: "politics", title: "Звязда", period: "Ежедневно", price: 3.8, priceHalfYear: 20.4, cover: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=500&q=80" },
  { id: "pub-niva", type: "magazine", category: "culture", title: "Наша Ніва", period: "Ежемесячно", price: 12.5, priceHalfYear: 68, cover: "https://images.unsplash.com/photo-1524995995648-beda9c2e4bf1?w=500&q=80" },
];

export const FALLBACK_STAMPS: Stamp[] = [
  { id: "stamp-birds", title: "Почтовая марка «Птицы Беларуси»", category: "марка", price: 2.6, year: 2026, image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=500&q=80", description: "Серия из 6 марок с редкими птицами." },
  { id: "stamp-liberation", title: "Марка «80 лет освобождения Беларуси»", category: "марка", price: 2.8, year: 2025, image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&q=80", description: "Юбилейная марка." },
  { id: "stamp-minsk-env", title: "Художественный конверт «Минск исторический»", category: "конверт", price: 5.4, year: 2026, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80", description: "Конверт первого дня." },
  { id: "stamp-mir", title: "Блок «Мирский замок»", category: "блок", price: 15.9, year: 2026, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500&q=80", description: "Коллекционный блок UNESCO." },
  { id: "stamp-flora", title: "Марка «Флора Беларуси»", category: "марка", price: 2.4, year: 2025, image: "https://images.unsplash.com/photo-1490750967868-88d44826c7f7?w=500&q=80", description: "Серия «Красная книга»." },
  { id: "stamp-souvenir", title: "Сувенирный набор «Белпочта Premium»", category: "сувенир", price: 28, year: 2026, image: "https://images.unsplash.com/photo-1606107557195-0a29c4ca9b7b?w=500&q=80", description: "Подарочный набор." },
];

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("bad status");
    const data = await r.json();
    return Array.isArray(data) && data.length > 0 ? data : fallback;
  } catch {
    return fallback;
  }
}

export const shopApi = {
  publications: () => fetchJson<Publication[]>("/api/publications", FALLBACK_PUBLICATIONS),
  stamps: () => fetchJson<Stamp[]>("/api/stamps", FALLBACK_STAMPS),
};
