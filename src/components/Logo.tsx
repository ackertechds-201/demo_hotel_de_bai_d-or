export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-3 shrink-0" aria-label="Hôtel Baie d'Or — accueil">
      <span className="w-10 h-10 rounded-full bg-sun-gold/20 border border-sun-gold/40 flex items-center justify-center">
        <span className="material-symbols-outlined text-[22px] text-sun-gold">spa</span>
      </span>
      <span className="flex flex-col">
        <span className={`font-serif text-xl font-semibold leading-none ${light ? "text-[#FFFBF2]" : "text-espresso-dark"}`}>
          Hôtel Baie d&apos;Or
        </span>
        <span className={`text-[10px] tracking-widest uppercase mt-1 ${light ? "text-[#F5EAD6]/70" : "text-secondary"}`}>
          Diego-Suarez • Madagascar
        </span>
      </span>
    </a>
  );
}
