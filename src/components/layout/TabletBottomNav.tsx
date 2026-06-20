import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Info, MessageSquare, Newspaper, Stamp } from "lucide-react";
import { useApp } from "@/context/AppProvider";

const items = [
  { to: "/", labelKey: "home", icon: Home, section: "common" as const, exact: true },
  { to: "/about", labelKey: "about", icon: Info, section: "nav" as const },
  { to: "/subscription", labelKey: "subscription", icon: Newspaper, section: "nav" as const },
  { to: "/philately", labelKey: "philately", icon: Stamp, section: "nav" as const },
  { to: "/feedback", labelKey: "feedback", icon: MessageSquare, section: "nav" as const },
];

export function TabletBottomNav() {
  const { tr } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="tablet-bottom-nav hidden md:flex lg:hidden"
      aria-label={tr("header", "menu")}
    >
      <ul className="tablet-bottom-nav__list">
        {items.map(({ to, labelKey, icon: Icon, section, exact }) => {
          const active = exact ? pathname === to : pathname === to;
          const label =
            section === "common" ? tr("common", labelKey) : tr("nav", labelKey);

          return (
            <li key={to} className="tablet-bottom-nav__item">
              <Link
                to={to}
                className={`tablet-bottom-nav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden />
                <span className="tablet-bottom-nav__label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
