import { Headphones } from "lucide-react";
import { useApp } from "@/context/AppProvider";

type ContactDropdownProps = {
  open: boolean;
};

export function ContactDropdown({ open }: ContactDropdownProps) {
  const { tr } = useApp();

  if (!open) return null;

  return (
    <div className="contact-dropdown">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span className="icon-bubble text-brand">
          <Headphones className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{tr("header", "contactCenter")}</p>
          <p className="text-2xl font-black text-brand">{tr("header", "contactShort")}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        <li>
          <a href="tel:+375333000154" className="contact-link">
            {tr("header", "contactMts")}
          </a>
        </li>
        <li>
          <a href="tel:+375445900154" className="contact-link">
            {tr("header", "contactA1")}
          </a>
        </li>
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{tr("header", "contactNote")}</p>
    </div>
  );
}
