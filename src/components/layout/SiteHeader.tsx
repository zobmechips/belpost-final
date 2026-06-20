import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Headphones, Menu, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "@/components/belpost/MobileMenu";
import { ContactDropdown } from "@/components/layout/ContactDropdown";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { FluidModal } from "@/components/belpost/FluidModal";
import { useApp } from "@/context/AppProvider";
import { useIsPhone } from "@/hooks/use-breakpoint";
import type { Lang } from "@/lib/i18n";

type SiteHeaderProps = {
  onCartOpen: () => void;
  onAuthOpen: () => void;
  onCabinetOpen: () => void;
};

export function SiteHeader({ onCartOpen, onAuthOpen, onCabinetOpen }: SiteHeaderProps) {
  const { tr, lang, setLang, toggleA11y, a11y, user, cartCount, pushToast } = useApp();
  const navigate = useNavigate();
  const isPhone = useIsPhone();
  const [contactOpen, setContactOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [a11yModal, setA11yModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const langs: { code: Lang; label: string }[] = [
    { code: "ru", label: "RU" },
    { code: "by", label: "BY" },
    { code: "en", label: "EN" },
  ];

  const mobileMenuItems = [
    { label: tr("nav", "about"), action: () => void navigate({ to: "/about" }) },
    { label: tr("nav", "subscription"), action: () => void navigate({ to: "/subscription" }) },
    { label: tr("nav", "philately"), action: () => void navigate({ to: "/philately" }) },
    { label: tr("nav", "feedback"), action: () => void navigate({ to: "/feedback" }) },
    { label: tr("nav", "accessible"), action: () => setA11yModal(true) },
    { label: tr("header", "contactCenter"), action: () => void navigate({ to: "/feedback" }) },
  ];

  return (
    <>
      <div className="page-container flex items-center gap-1 py-2.5 text-[13px] font-semibold text-white sm:py-3">
        {isPhone && (
          <button
            type="button"
            className="mobile-menu-trigger mr-1 shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label={tr("header", "menu")}
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-7" aria-label={tr("header", "menu")}>
          <Link to="/about" className="nav-link">{tr("nav", "about")}</Link>
          <Link to="/subscription" className="nav-link">{tr("nav", "subscription")}</Link>
          <Link to="/philately" className="nav-link">{tr("nav", "philately")}</Link>
          <Link to="/feedback" className="nav-link">{tr("nav", "feedback")}</Link>
          <button type="button" onClick={() => setA11yModal(true)} className="nav-link">
            {tr("nav", "accessible")}
          </button>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              toggleA11y();
              pushToast(a11y ? tr("accessibility", "disabled") : tr("accessibility", "enabled"), "info");
            }}
            className="pill-btn hidden sm:inline-flex"
          >
            {tr("header", "weakVision")}
          </button>
          <div className="relative">
            <button type="button" onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 text-white hover:opacity-80" aria-expanded={langOpen}>
              {lang.toUpperCase()} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={lang === l.code ? "is-active" : ""}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user && <NotificationBell />}
          {user ? (
            <button type="button" onClick={onCabinetOpen} className="flex items-center gap-2 text-white hover:opacity-80">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <button type="button" onClick={onAuthOpen} className="flex items-center gap-1.5 text-white hover:opacity-80">
              <User className="h-4 w-4" strokeWidth={1.7} />
              <span className="hidden sm:inline">{tr("header", "login")}</span>
            </button>
          )}
        </div>
      </div>

      <header className="relative">
        <div className="site-header-bar page-container flex items-center gap-3 py-2">
          <Link to="/" className="flex min-w-0 items-center">
            <span className="text-[clamp(1.25rem,4vw,1.625rem)] font-black tracking-wide text-white">БЕЛПОЧТА</span>
          </Link>
          <p className="ml-1 hidden max-w-[220px] text-[12px] leading-tight text-white/95 md:block">{tr("header", "tagline")}</p>

          <div className="relative ml-auto flex items-center gap-3 sm:gap-4">
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => setContactOpen(true)}
              onMouseLeave={() => setContactOpen(false)}
            >
              <button
                type="button"
                onClick={() => setContactOpen((v) => !v)}
                className="flex items-center gap-2 text-white"
                aria-expanded={contactOpen}
              >
                <span className="icon-bubble">
                  <Headphones className="h-4 w-4" />
                </span>
                <span className="text-[15px] font-medium">{tr("header", "contactCenter")}</span>
                <ChevronDown className={`h-4 w-4 transition ${contactOpen ? "rotate-180" : ""}`} />
              </button>
              <ContactDropdown open={contactOpen} />
            </div>
            <button type="button" onClick={onCartOpen} className="cart-trigger relative" aria-label={tr("header", "cart")}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <FluidModal open={a11yModal} title={tr("accessibility", "title")} onClose={() => setA11yModal(false)}>
        <p className="text-sm leading-relaxed text-slate-600">{tr("accessibility", "text")}</p>
        <Link to="/about" hash="offices-map" className="btn-primary mt-4 inline-flex" onClick={() => setA11yModal(false)}>
          Карта отделений и электронная очередь
        </Link>
      </FluidModal>

      {isPhone && (
        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} items={mobileMenuItems} />
      )}
    </>
  );
}
