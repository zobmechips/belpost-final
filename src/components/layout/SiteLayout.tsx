import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { CabinetDrawer } from "@/components/auth/CabinetDrawer";
import { Preloader } from "@/components/belpost/Preloader";
import { ToastStack } from "@/components/belpost/ToastStack";
import { CheckoutWizard } from "@/components/cart/CheckoutWizard";
import { HeroBackground, HeroCarousel } from "@/components/home/HeroCarousel";
import { TrackingPanel } from "@/components/home/TrackingPanel";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SideNav } from "@/components/layout/SideNav";
import { ContactFab } from "@/components/support/ContactFab";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { useApp } from "@/context/AppProvider";

type SiteLayoutProps = {
  children: ReactNode;
  hero?: boolean;
};

export function SiteLayout({ children, hero = false }: SiteLayoutProps) {
  const { tr, toasts, dismissToast } = useApp();

  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  const onAuthSuccess = (user: { role?: string }) => {
    if (user.role === "admin") {
      window.location.href = "/admin";
      return;
    }
    setCabinetOpen(true);
  };

  return (
    <div className="site-shell flex min-h-screen flex-col text-slate-800">
      <a href="#main-content" className="skip-link">{tr("accessibility", "skipLink")}</a>
      <Preloader />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {hero ? (
        <div className="hero-stage relative isolate overflow-hidden bg-[#1F6FD8]">
          <HeroBackground parallaxX={0} parallaxY={0} slideIndex={heroSlideIndex} />
          <div className="relative z-10">
            <SiteHeader onCartOpen={() => setCartOpen(true)} onAuthOpen={() => setAuthOpen(true)} onCabinetOpen={() => setCabinetOpen(true)} />
            <div className="relative mx-auto max-w-[1400px] px-6">
              <HeroCarousel
                slideIndex={heroSlideIndex}
                onSlideChange={(index) => setHeroSlideIndex(index)}
              />
              <TrackingPanel />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1F6FD8] pb-2">
          <SiteHeader onCartOpen={() => setCartOpen(true)} onAuthOpen={() => setAuthOpen(true)} onCabinetOpen={() => setCabinetOpen(true)} />
        </div>
      )}

      <div className="layout-with-sidenav flex flex-1">
        <SideNav />
        <div id="main-content" className="min-w-0 flex-1">{children}</div>
      </div>

      <footer id="footer" className="site-footer mt-auto border-t border-slate-100">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold text-slate-800">БЕЛПОЧТА</p>
            <p className="mt-2 text-sm text-slate-500">{tr("header", "tagline")}</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("common", "footerServices")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/subscription" className="footer-link">{tr("nav", "subscription")}</Link></li>
              <li><Link to="/philately" className="footer-link">{tr("nav", "philately")}</Link></li>
              <li><a href="/#online-services" className="footer-link">{tr("sections", "onlineServices")}</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("common", "footerInfo")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="footer-link">{tr("nav", "about")}</Link></li>
              <li><Link to="/feedback" className="footer-link">{tr("nav", "feedback")}</Link></li>
              <li><Link to="/privacy" className="footer-link">{tr("common", "privacy")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("common", "footerContacts")}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="tel:+375333000154" className="footer-link">{tr("header", "contactMts")}</a></li>
              <li><a href="tel:+375445900154" className="footer-link">{tr("header", "contactA1")}</a></li>
              <li className="text-xs text-slate-400">{tr("sections", "contactHours")}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
          {tr("common", "copyright")}
        </div>
      </footer>

      <CheckoutWizard open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={onAuthSuccess} />
      <CabinetDrawer open={cabinetOpen} onClose={() => setCabinetOpen(false)} />
      <ContactFab />
      <CookieConsent />
    </div>
  );
}
