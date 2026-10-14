"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { NAV_LINKS } from "./nav";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => href.split("?")[0] === pathname && !href.includes("tab=contact");

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="h-8 bg-espresso-dark text-[#F5EAD6] text-[11px] tracking-wider uppercase flex items-center justify-center px-4 text-center">
        Projet de démonstration — Acker Tech DS
      </div>
      <header className="h-20 bg-[#FFFBF2]/95 backdrop-blur-xl border-b border-warm-border/60">
        <div className="h-full max-w-[1240px] mx-auto px-gutter flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden xl:flex items-center gap-1" aria-label="Navigation principale">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`px-4 py-2 rounded-full text-[15px] transition-colors ${
                  isActive(l.href)
                    ? "bg-espresso-dark text-[#FFFBF2]"
                    : "text-secondary hover:text-espresso-dark hover:bg-soft-sand"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="/reservation"
              className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-full bg-sun-gold text-espresso-dark font-semibold text-[15px] hover:brightness-95 transition"
            >
              Réserver
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              className="xl:hidden w-11 h-11 rounded-full bg-soft-sand border border-warm-border flex items-center justify-center text-espresso-dark"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[100] xl:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-espresso-dark/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#FFFBF2] shadow-2xl p-6 flex flex-col gap-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="w-11 h-11 rounded-full bg-soft-sand border border-warm-border flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-5 py-3 rounded-2xl ${
                  isActive(l.href) ? "bg-espresso-dark text-[#FFFBF2]" : "text-espresso-dark hover:bg-soft-sand"
                }`}
              >
                {l.label}
              </a>
            ))}
            <a href="/reservation" className="mt-4 text-center px-5 py-3 rounded-full bg-sun-gold text-espresso-dark font-semibold">
              Réserver un séjour
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
