/* eslint-disable @next/next/no-html-link-for-pages -- full page loads re-run each page's exported Stitch scripts. */
import Logo from "./Logo";
import { LEGAL_LINKS, NAV_LINKS } from "./nav";

const STAY_LINKS = [
  { href: "/reservation", label: "Réserver un séjour" },
  { href: "/suite", label: "Suite Lagon" },
  { href: "/services", label: "Expériences & spa" },
  { href: "/a-propos#manifeste", label: "Charte environnementale" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-lg text-[#FFFBF2]">{title}</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="text-[#F5EAD6]/75 hover:text-sun-gold transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="bg-espresso-dark text-[#F5EAD6]">
      <div className="max-w-[1240px] mx-auto px-gutter pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          <div className="flex flex-col gap-4">
            <Logo light />
            <p className="text-sm text-[#F5EAD6]/75 max-w-xs">
              Sanctuaire éco-luxe face à la baie d&apos;Antsiranana : villas, suites pieds dans l&apos;eau et
              expériences sur-mesure.
            </p>
            <a
              href="/reservation?tab=contact"
              className="inline-flex items-center gap-2 text-sm text-sun-gold hover:underline w-fit"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Écrire à la conciergerie
            </a>
          </div>
          <Column title="Navigation" links={NAV_LINKS.filter((l) => !l.href.includes("tab=contact"))} />
          <Column title="Votre séjour" links={STAY_LINKS} />
          <Column title="Informations légales" links={LEGAL_LINKS} />
        </div>
        <div className="pt-6 border-t border-[#F5EAD6]/15 text-xs text-[#F5EAD6]/60 flex flex-col md:flex-row gap-2 justify-between">
          <p>© 2025 Hôtel Baie d&apos;Or — Diego-Suarez, Madagascar.</p>
          <p>Projet de démonstration fictif conçu par Acker Tech DS. Aucune réservation réelle.</p>
        </div>
      </div>
    </footer>
  );
}
