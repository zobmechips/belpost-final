import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { ReCaptcha } from "@/components/belpost/ReCaptcha";
import { ScrollReveal } from "@/components/belpost/ScrollReveal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";
import { api } from "@/lib/api";

export const Route = createFileRoute("/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const { tr, pushToast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onCaptcha = useCallback((token: string | null) => setCaptchaToken(token), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      pushToast("Подтвердите, что вы не робот", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendMessage({ name, email, message, captchaToken });
      pushToast(`${tr("feedback", "success")} ${res.id?.slice(0, 8)}`, "success");
      setName("");
      setEmail("");
      setMessage("");
      setCaptchaToken(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="page-container page-container--form py-8">
        <ScrollReveal>
          <h1 className="section-title">{tr("feedback", "title")}</h1>
          <p className="mt-2 mb-8 text-slate-600">{tr("feedback", "subtitle")}</p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <form onSubmit={(e) => void submit(e)} className="feedback-form grid gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <label className="fluid-label">
              {tr("feedback", "name")}
              <input value={name} onChange={(e) => setName(e.target.value)} className="fluid-input" required />
            </label>
            <label className="fluid-label">
              {tr("feedback", "email")}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="fluid-input" required />
            </label>
            <label className="fluid-label">
              {tr("feedback", "message")}
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="fluid-input min-h-[140px] resize-y" required />
            </label>
            <div className="feedback-captcha-block">
              <ReCaptcha onChange={onCaptcha} />
            </div>
            <motion.button type="submit" disabled={loading || !captchaToken} whileTap={{ scale: 0.98 }} className="btn-primary justify-center disabled:opacity-50">
              {loading ? "…" : tr("feedback", "submit")}
            </motion.button>
          </form>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
