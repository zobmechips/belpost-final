import { motion } from "framer-motion";
import { Code2, Layers, ShieldCheck, Server } from "lucide-react";
import { ScrollReveal } from "@/components/belpost/ScrollReveal";
import { playMasterTribute } from "@/lib/masterTribute";
import { useApp } from "@/context/AppProvider";

const STACK_ITEMS = [
  { icon: Code2, label: "Технологический стек", value: "Vite / React / TypeScript / Node.js (Express) / REST API" },
  {
    icon: Layers,
    label: "Реализованный функционал",
    value:
      "Архитектура проекта построена по модульному принципу. Интегрированы интерактивные калькуляторы тарифов, полноценная система онлайн-корзины, сквозное отслеживание отправлений (трекинг) и мультиязычный интерфейс (локализация RU/BY/EN).",
  },
  {
    icon: Server,
    label: "Сопровождение ПО",
    value:
      "Разработана защищённая панель администратора для оперативного управления контентом и тарифами в реальном времени через синхронизацию с JSON-базами данных.",
  },
];

export function ChiefArchitectBlock() {
  const { pushToast } = useApp();

  const handleContact = () => {
    playMasterTribute();
    pushToast("Спасибо за интерес к проекту!", "success");
  };

  return (
    <section id="developer" className="developer-section page-container py-12 sm:py-16">
      <ScrollReveal>
        <div className="developer-card">
          <div className="developer-grid">
            <div className="developer-content">
              <p className="developer-eyebrow">Команда проекта</p>
              <h2 className="developer-title">Разработчик веб-платформы</h2>
              <p className="developer-name">Власенко Вадим Викторович</p>
              <span className="developer-badge">Fullstack Web Developer | Специалист по разработке и сопровождению ПО</span>

              <div className="developer-specs">
                {STACK_ITEMS.map(({ icon: Icon, label, value }) => (
                  <article key={label} className="developer-spec-card">
                    <div className="developer-spec-icon">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="developer-spec-label">{label}</h3>
                      <p className="developer-spec-value">{value}</p>
                    </div>
                  </article>
                ))}
              </div>

              <p className="developer-security">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
                Исходный код проекта оптимизирован для высоких нагрузок и соответствует стандартам безопасной веб-разработки.
              </p>

              <motion.button
                type="button"
                className="developer-cta"
                onClick={handleContact}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Связаться с разработчиком
              </motion.button>
            </div>

            <div className="developer-visual" aria-hidden>
              <img src="/developer.png" alt="Власенко Вадим Викторович" className="developer-photo" />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
