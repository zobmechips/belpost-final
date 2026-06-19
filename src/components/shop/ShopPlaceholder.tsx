import { Mail, Newspaper, Stamp } from "lucide-react";
import { useState } from "react";

type ShopPlaceholderProps = {
  kind: "publication" | "stamp";
  title: string;
  className?: string;
};

export function ShopPlaceholder({ kind, title, className = "" }: ShopPlaceholderProps) {
  const Icon = kind === "stamp" ? Stamp : Newspaper;
  return (
    <div className={`shop-placeholder ${className}`} aria-hidden>
      <div className="shop-placeholder-pattern" />
      <Icon className="shop-placeholder-icon" strokeWidth={1.4} />
      <span className="shop-placeholder-label">{kind === "stamp" ? "Филателия" : "Издание"}</span>
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function ShopCover({ src, alt, kind }: { src?: string; alt: string; kind: "publication" | "stamp" }) {
  const [failed, setFailed] = useState(false);
  if (src?.trim() && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className="shop-cover-img"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return <ShopPlaceholder kind={kind} title={alt} className="shop-cover-img" />;
}

export function AuthGateMessage({ onLogin }: { onLogin?: () => void }) {
  return (
    <div className="shop-auth-gate">
      <Mail className="h-5 w-5 text-brand" />
      <p>Пожалуйста, авторизуйтесь в Личном кабинете</p>
      {onLogin && (
        <button type="button" className="btn-primary text-sm" onClick={onLogin}>
          Войти
        </button>
      )}
    </div>
  );
}
