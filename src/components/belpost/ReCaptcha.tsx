import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void }) => number;
      reset: (id?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

type ReCaptchaProps = {
  onChange: (token: string | null) => void;
};

export function ReCaptcha({ onChange }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = () => {
      if (!containerRef.current || !window.grecaptcha || widgetId.current !== null) return;
      widgetId.current = window.grecaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChange(token),
        "expired-callback": () => onChange(null),
      });
      setReady(true);
    };

    if (window.grecaptcha) {
      mount();
      return;
    }

    window.onRecaptchaLoad = mount;
    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      if (window.onRecaptchaLoad === mount) window.onRecaptchaLoad = undefined;
    };
  }, [onChange]);

  return (
    <div className="recaptcha-wrap">
      <div ref={containerRef} className="recaptcha-widget" />
      {!ready && <p className="text-xs text-slate-400">Загрузка проверки…</p>}
    </div>
  );
}
