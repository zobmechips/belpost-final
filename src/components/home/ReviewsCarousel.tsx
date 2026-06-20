import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ScrollReveal } from "@/components/belpost/ScrollReveal";
import { useCarouselVisibleCount } from "@/hooks/use-breakpoint";
import { api } from "@/lib/api";

type Review = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  source: string;
};

export function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const visible = useCarouselVisibleCount();

  useEffect(() => {
    void api.reviews().then((data) => {
      if (Array.isArray(data)) setReviews(data);
    });
  }, []);

  const maxIndex = Math.max(0, reviews.length - visible);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const go = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }, [index]);

  useEffect(() => {
    if (reviews.length <= visible) return;
    const timer = window.setInterval(() => {
      setIndex((i) => {
        const next = i >= maxIndex ? 0 : i + 1;
        setDirection(next >= i ? 1 : -1);
        return next;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [reviews.length, maxIndex, visible]);

  if (!reviews.length) return null;

  const slice = reviews.slice(index, index + visible);
  const padded = slice.length < visible ? [...slice, ...reviews.slice(0, visible - slice.length)] : slice;

  return (
    <section id="reviews" className="reviews-section page-container py-12 sm:py-16">
      <ScrollReveal>
        <div className="reviews-panel">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="reviews-score">5.0</span>
                <span className="text-sm text-slate-500">из 5</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">На основе {reviews.length * 30 + 4} оценок</p>
              <h2 className="section-title mt-4">Отзывы наших клиентов</h2>
            </div>
            <a href="/feedback" className="reviews-cta-btn">Оставить отзыв</a>
          </div>

          <div className="reviews-carousel-track">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${index}-${visible}`}
                custom={direction}
                className="reviews-carousel-grid"
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {padded.map((r) => (
                  <article key={r.id} className="review-card">
                    <div className="flex items-center gap-3">
                      <img src={r.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full bg-slate-100" loading="lazy" decoding="async" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{r.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>
                    <p className="review-card-text">{r.text}</p>
                    <p className="mt-auto text-xs text-slate-400">{r.source}</p>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button type="button" className="reviews-nav-btn" aria-label="Назад" onClick={() => go(index <= 0 ? maxIndex : index - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" className="reviews-nav-btn" aria-label="Вперёд" onClick={() => go(index >= maxIndex ? 0 : index + 1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="reviews-progress">
              <motion.div className="reviews-progress-fill" animate={{ width: `${maxIndex === 0 ? 100 : ((index + 1) / (maxIndex + 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
