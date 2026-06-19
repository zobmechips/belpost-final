import { motion } from "framer-motion";
import { useState } from "react";
import { ScrollReveal } from "@/components/belpost/ScrollReveal";

const OFFICES = [
  { id: "minsk-1", city: "Минск", address: "пр. Независимости, 10", hours: "Пн–Сб 8:00–20:00", x: 52, y: 38 },
  { id: "minsk-2", city: "Минск", address: "ул. Кальварийская, 16", hours: "Пн–Пт 9:00–19:00", x: 48, y: 42 },
  { id: "brest", city: "Брест", address: "ул. Московская, 202", hours: "Пн–Сб 8:30–18:30", x: 18, y: 72 },
  { id: "gomel", city: "Гомель", address: "пр. Речицкий, 5", hours: "Пн–Сб 8:00–19:00", x: 62, y: 68 },
  { id: "vitebsk", city: "Витебск", address: "ул. Ленина, 61", hours: "Пн–Сб 8:00–18:00", x: 58, y: 18 },
  { id: "mogilev", city: "Могилёв", address: "ул. Первомайская, 57", hours: "Пн–Сб 8:30–19:00", x: 68, y: 48 },
  { id: "grodno", city: "Гродно", address: "ул. Ожешко, 38", hours: "Пн–Сб 8:00–18:30", x: 22, y: 28 },
];

export function OfficesMap() {
  const [active, setActive] = useState(OFFICES[0]);

  return (
    <ScrollReveal>
      <section className="offices-map-section">
        <h2 className="section-title mb-4">Карта отделений связи</h2>
        <div className="offices-map-grid">
          <div className="offices-map-svg-wrap">
            <svg viewBox="0 0 100 80" className="offices-map-svg" aria-label="Карта отделений">
              <rect width="100" height="80" rx="8" fill="#eef4fc" />
              {OFFICES.map((o) => (
                <g key={o.id} onClick={() => setActive(o)} style={{ cursor: "pointer" }}>
                  <circle cx={o.x} cy={o.y} r={active.id === o.id ? 3.2 : 2.4} fill="#1F6FD8" />
                  {active.id === o.id && <circle cx={o.x} cy={o.y} r={5} fill="none" stroke="#1F6FD8" strokeWidth="0.6" opacity="0.5" />}
                </g>
              ))}
            </svg>
          </div>
          <motion.div key={active.id} className="offices-map-card" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
            <p className="font-bold text-slate-800">{active.city}</p>
            <p className="mt-1 text-sm text-slate-600">{active.address}</p>
            <p className="mt-2 text-xs text-brand">{active.hours}</p>
          </motion.div>
        </div>
      </section>
    </ScrollReveal>
  );
}
