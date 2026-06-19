import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import heroImage from "@/assets/hero-ecommerce.jpg";
import { RevealText } from "@/components/belpost/RevealText";
import { useApp } from "@/context/AppProvider";

export const heroSlides = [
  {
    id: 1,
    image: heroImage,
    kickerKey: "kicker",
    title1: "ПОЧТА",
    title2: "РЯДОМ",
    title1By: "ПОШТА",
    title2By: "ПОРУЧ",
    title1En: "POST",
    title2En: "NEARBY",
    subtitle:
      "Премиальный цифровой опыт национального оператора: отслеживание, тарифы в реальном времени и оформление услуг в один клик.",
    subtitleBy:
      "Прэміальны лічбавы вопыт нацыянальнага аператара: адсочванне, тарыфы ў рэальным часе і афармленне паслуг у адзін клік.",
    subtitleEn:
      "Premium digital experience: real-time tracking, live tariffs and one-click service ordering.",
    link: "/about",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    kickerKey: "kicker",
    title1: "E-COMMERCE",
    title2: "«ЭЛИТ»",
    title1By: "E-COMMERCE",
    title2By: "«ЭЛІТ»",
    title1En: "E-COMMERCE",
    title2En: "ELITE",
    subtitle:
      "Доставка интернет-покупок по всей Беларуси: страхование, курьер до двери и отслеживание каждого этапа в личном кабинете.",
    subtitleBy:
      "Дастаўка інтэрнэт-пакупак па ўсёй Беларусі: страхаванне, курьер да дзвярэй і адсочванне кожнага этапа.",
    subtitleEn:
      "Nationwide e-commerce delivery with insurance, door-to-door courier and full tracking.",
    link: "/ecommerce-elite",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&q=80",
    kickerKey: "kicker",
    title1: "ДОСТАВКА",
    title2: "ЗА 2 ЧАСА",
    title1By: "ДАСТАЎКА",
    title2By: "ЗА 2 ГАДЗІНЫ",
    title1En: "DELIVERY",
    title2En: "IN 2 HOURS",
    subtitle:
      "Экспресс-курьер по Минску, Могилёву и областным центрам: документы и посылки до 30 кг — за 120 минут.",
    subtitleBy:
      "Экспрэс-курьер па Мінску, Магілёве і абласным цэнтрах: дакументы і пасылкі да 30 кг — за 120 хвілін.",
    subtitleEn:
      "Express courier in Minsk, Mogilev and regional centers — up to 30 kg in 120 minutes.",
    link: "/express-delivery",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80",
    kickerKey: "kicker",
    title1: "ПОДПИСКА",
    title2: "ОНЛАЙН",
    title1By: "ПАДПІСКА",
    title2By: "ОНЛАЙН",
    title1En: "SUBSCRIBE",
    title2En: "ONLINE",
    subtitle:
      "Более 200 газет и журналов с доставкой на дом: оформите подписку онлайн и управляйте ею в личном кабинете.",
    subtitleBy:
      "Больш за 200 газет і часопісаў з дастаўкай на дом: аформіце падпіску онлайн і кіруйце ёй у асабістым кабінеце.",
    subtitleEn:
      "200+ newspapers and magazines delivered to your door — subscribe and manage online.",
    link: "/subscription",
  },
];

type HeroBackgroundProps = {
  parallaxX: unknown;
  parallaxY: unknown;
  slideIndex: number;
};

export function HeroBackground({ parallaxX, parallaxY, slideIndex }: HeroBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const slide = heroSlides[slideIndex];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.img
          key={slide.image}
          src={slide.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ x: parallaxX, y: parallaxY, scale: 1.08 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 1.1, ease: [0.4, 0, 0.2, 1] }}
        />
      </AnimatePresence>
      <motion.div className="hero-gradient absolute inset-0" style={{ x: parallaxX, y: parallaxY }} />
    </div>
  );
};

type HeroCarouselProps = {
  slideIndex: number;
  onSlideChange: (index: number, direction: number) => void;
};

export function HeroCarousel({ slideIndex, onSlideChange }: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const { tr, lang } = useApp();
  const [direction, setDirection] = useState(1);

  const go = (next: number, explicitDir?: number) => {
    const normalized = (next + heroSlides.length) % heroSlides.length;
    if (normalized === slideIndex) return;
    let dir = explicitDir;
    if (dir === undefined) {
      const forward = (normalized - slideIndex + heroSlides.length) % heroSlides.length;
      const backward = (slideIndex - normalized + heroSlides.length) % heroSlides.length;
      dir = forward <= backward ? 1 : -1;
    }
    setDirection(dir);
    onSlideChange(normalized, dir);
  };

  const advance = useCallback(() => {
    setDirection(1);
    onSlideChange((slideIndex + 1) % heroSlides.length, 1);
  }, [slideIndex, onSlideChange]);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(advance, 5000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, advance]);

  const slide = heroSlides[slideIndex];
  const titles =
    lang === "by"
      ? { t1: slide.title1By, t2: slide.title2By, sub: slide.subtitleBy }
      : lang === "en"
        ? { t1: slide.title1En, t2: slide.title2En, sub: slide.subtitleEn }
        : { t1: slide.title1, t2: slide.title2, sub: slide.subtitle };

  return (
    <div className="flex min-h-[460px] items-center">
      <div className="relative w-full max-w-xl text-white">
        <div className="relative min-h-[240px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              className="absolute inset-0 flex flex-col justify-center"
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -28 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.85, ease: [0.4, 0, 0.2, 1] }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">{tr("hero", slide.kickerKey)}</p>
              <h1 className="kinetic-title text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.95]">
                <RevealText text={titles.t1} delay={0.05} />
                <br />
                <RevealText text={titles.t2} delay={0.2} />
              </h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/85">{titles.sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-4">
          <button type="button" aria-label={tr("hero", "prev")} onClick={() => go(slideIndex - 1)} className="hero-nav-btn">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <Link to={slide.link} className="hero-cta hero-cta-nudge">
            {tr("hero", "details")}
          </Link>
          <button type="button" aria-label={tr("hero", "next")} onClick={() => go(slideIndex + 1)} className="hero-nav-btn">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => go(i)}
              className={`hero-dot ${i === slideIndex ? "is-active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
