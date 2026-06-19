import { useEffect, useRef, useState } from "react";
import { QueueTicketModal } from "@/components/map/QueueTicketModal";
import { api } from "@/lib/api";

const YANDEX_KEY = import.meta.env.VITE_YANDEX_MAPS_KEY ?? "604ba379-e247-4bf8-a347-f59a434888ad";

export type Office = {
  id: string;
  number: string;
  city: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
  accessible: boolean;
};

const FALLBACK_OFFICES: Office[] = [
  { id: "minsk-central", number: "101", city: "Минск", address: "пр. Независимости, 10", hours: "Пн–Сб 8:00–20:00", lat: 53.8985, lng: 27.5478, accessible: true },
  { id: "gomel-central", number: "201", city: "Гомель", address: "пр. Речицкий, 5", hours: "Пн–Сб 8:00–19:00", lat: 52.4242, lng: 30.9754, accessible: true },
  { id: "brest-central", number: "301", city: "Брест", address: "ул. Московская, 202", hours: "Пн–Сб 8:30–18:30", lat: 52.0976, lng: 23.7341, accessible: true },
  { id: "grodno-central", number: "401", city: "Гродно", address: "ул. Ожешко, 38", hours: "Пн–Сб 8:00–18:30", lat: 53.6694, lng: 23.8131, accessible: true },
  { id: "mogilev-central", number: "501", city: "Могилёв", address: "ул. Первомайская, 57", hours: "Пн–Сб 8:30–19:00", lat: 53.8945, lng: 30.3307, accessible: true },
  { id: "vitebsk-central", number: "601", city: "Витебск", address: "ул. Ленина, 61", hours: "Пн–Сб 8:00–18:00", lat: 55.1904, lng: 30.2049, accessible: true },
];

declare global {
  interface Window {
    ymaps?: {
      ready: (cb: () => void) => void;
      Map: new (el: HTMLElement, opts: object) => YMap;
      Placemark: new (coords: number[], opts: object, props?: object) => { events?: { add: (event: string, cb: () => void) => void } };
    };
    belpostOpenQueue?: (id: string) => void;
  }
}

type YMap = {
  geoObjects: { add: (obj: unknown) => void };
  destroy: () => void;
};

function waitForYmaps(timeoutMs = 15000): Promise<NonNullable<typeof window.ymaps>> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => resolve(window.ymaps!));
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Таймаут загрузки Яндекс.Карт"));
        return;
      }
      window.setTimeout(tick, 80);
    };
    tick();
  });
}

function loadYmapsScript(): Promise<NonNullable<typeof window.ymaps>> {
  if (window.ymaps) return waitForYmaps();

  const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
  if (existing) return waitForYmaps();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => waitForYmaps().then(resolve).catch(reject);
    script.onerror = () => reject(new Error("Не удалось загрузить скрипт Яндекс.Карт"));
    document.head.appendChild(script);
  });
}

function balloonHtml(office: Office) {
  return `
    <div class="ymap-balloon">
      <p class="ymap-balloon-city">${office.city}</p>
      <p class="ymap-balloon-addr">${office.address}</p>
      <p class="ymap-balloon-hours">${office.hours}</p>
      <p class="ymap-balloon-meta">Отделение №${office.number}</p>
      <p class="ymap-balloon-access">Доступная среда: ${office.accessible ? "Адаптировано для людей с инвалидностью" : "Уточняйте на месте"}</p>
      <button type="button" class="ymap-balloon-btn" onclick="window.belpostOpenQueue && window.belpostOpenQueue('${office.id}')">Заказать талон</button>
    </div>
  `;
}

type YandexOfficesMapProps = {
  className?: string;
};

export function YandexOfficesMap({ className = "" }: YandexOfficesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<YMap | null>(null);
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [queueOffice, setQueueOffice] = useState<Office | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .offices()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setOffices(data as Office[]);
      })
      .catch(() => {
        /* используем FALLBACK_OFFICES */
      });
  }, []);

  useEffect(() => {
    if (!mapRef.current || offices.length === 0) return;
    let destroyed = false;

    window.belpostOpenQueue = (id: string) => {
      const office = offices.find((o) => o.id === id);
      if (office) setQueueOffice(office);
    };

    void loadYmapsScript()
      .then((ymaps) => {
        if (destroyed || !mapRef.current) return;
        mapInstance.current?.destroy();

        const map = new ymaps.Map(mapRef.current, {
          center: [53.9, 27.56],
          zoom: 6,
          controls: ["zoomControl", "geolocationControl"],
        });
        mapInstance.current = map;

        offices.forEach((office) => {
          const placemark = new ymaps.Placemark(
            [office.lat, office.lng],
            { balloonContent: balloonHtml(office) },
            { preset: "islands#blueCircleDotIcon" },
          );
          placemark.events?.add?.("click", () => setQueueOffice(office));
          map.geoObjects.add(placemark);
        });

        setMapReady(true);
        setError(null);
      })
      .catch((err) => {
        console.error("[belpost/map]", err);
        setError(err instanceof Error ? err.message : "Карта временно недоступна");
      });

    return () => {
      destroyed = true;
      mapInstance.current?.destroy();
      mapInstance.current = null;
    };
  }, [offices]);

  return (
    <section className={`yandex-map-section ${className}`}>
      <h2 className="section-title mb-4">Карта отделений связи</h2>
      <p className="mb-4 text-sm text-slate-600">
        Центральные отделения Белпочты с адаптированной средой. Нажмите на маркер для подробностей и бронирования талона.
      </p>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      {!mapReady && !error && <p className="mb-3 text-sm text-slate-500">Загрузка карты…</p>}
      <div ref={mapRef} className="yandex-map-canvas" aria-label="Интерактивная карта отделений Белпочты" />
      <QueueTicketModal office={queueOffice} onClose={() => setQueueOffice(null)} />
    </section>
  );
}
