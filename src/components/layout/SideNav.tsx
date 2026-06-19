import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Info, Newspaper, Stamp, MessageSquare, Shield, LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppProvider";

const navItems = [
  { to: "/", labelKey: "home", icon: Home, section: "common" as const },
  { to: "/about", labelKey: "about", icon: Info, section: "nav" as const },
  { to: "/subscription", labelKey: "subscription", icon: Newspaper, section: "nav" as const },
  { to: "/philately", labelKey: "philately", icon: Stamp, section: "nav" as const },
  { to: "/feedback", labelKey: "feedback", icon: MessageSquare, section: "nav" as const },
  { to: "/#online-services", labelKey: "onlineServices", icon: LayoutGrid, section: "sections" as const },
];

export function SideNav() {
  const { tr } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="side-nav hidden xl:block">
      <nav className="side-nav-inner" aria-label="Основная навигация">
        <p className="side-nav-brand">БЕЛПОЧТА</p>
        <ul className="side-nav-list">
          {navItems.map(({ to, labelKey, icon: Icon, section }) => {
            const active = to === "/" ? pathname === "/" : pathname === to;
            const label = section === "common" ? tr("common", labelKey) : section === "sections" ? tr("sections", labelKey) : tr("nav", labelKey);
            const isHash = to.includes("#");

            const content = (
              <>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span>{label}</span>
                {active && !isHash && (
                  <motion.span layoutId="side-nav-active" className="side-nav-active-bar" />
                )}
              </>
            );

            return (
              <li key={to}>
                {isHash ? (
                  <a href={to} className="side-nav-link">{content}</a>
                ) : (
                  <Link to={to} className={`side-nav-link ${active ? "is-active" : ""}`}>{content}</Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="side-nav-footer">
          <Shield className="h-4 w-4 text-brand" />
          <span className="text-[11px] leading-tight text-slate-500">Официальный портал РУП «Белпочта»</span>
        </div>
      </nav>
    </aside>
  );
}
