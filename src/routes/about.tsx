import { createFileRoute } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ScrollReveal, ScrollRevealGroup, ScrollRevealItem } from "@/components/belpost/ScrollReveal";
import { YandexOfficesMap } from "@/components/map/YandexOfficesMap";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const stats = [
  { key: "offices", value: 3200, suffix: "+" },
  { key: "employees", value: 18000, suffix: "+" },
  { key: "parcels", value: 45, suffix: "M+" },
  { key: "regions", value: 6, suffix: "" },
];

function AnimatedStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.5 });
  return (
    <motion.div ref={ref} className="stat-card" initial={{ scale: 0.95, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 80, damping: 20 }}>
      <p className="stat-value">{value}{suffix}</p>
      <p className="stat-label">{label}</p>
    </motion.div>
  );
}

function AboutPage() {
  const { tr } = useApp();

  return (
    <SiteLayout>
      <div className="page-container py-8">
        <ScrollReveal>
          <h1 className="section-title mb-4">{tr("about", "title")}</h1>
          <h2 className="mb-4 text-xl font-semibold text-brand">{tr("about", "history")}</h2>
          <p className="max-w-3xl leading-relaxed text-slate-600">{tr("about", "historyText")}</p>
        </ScrollReveal>
        <ScrollReveal delay={0.1} className="mt-12">
          <h2 className="section-title mb-8">{tr("about", "stats")}</h2>
        </ScrollReveal>
        <ScrollRevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <ScrollRevealItem key={s.key}>
              <AnimatedStat label={tr("about", s.key)} value={s.value} suffix={s.suffix} />
            </ScrollRevealItem>
          ))}
        </ScrollRevealGroup>
        <div className="mt-12" id="offices-map">
          <YandexOfficesMap />
        </div>
      </div>
    </SiteLayout>
  );
}
