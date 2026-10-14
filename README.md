# Hôtel Baie d'Or — Next.js

Site de démonstration (Acker Tech DS) construit à partir des exports HTML Google Stitch.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # version production
```

## Structure

- `src/app/` — App Router : `/` (accueil), `/[slug]` (chambres, suite, services, galerie, a-propos, faq, reservation, confirmation, legal), page 404.
- `content/pages/` — balisage et script de chaque écran (générés depuis `stitch/`).
- `src/lib/site.ts` — menu mobile, contrôles de réservation en mémoire, liens directs vers les onglets Contact / Mentions légales.
- `scripts/import_stitch.py` — régénère `content/` et `tailwind.config.ts` à partir des exports de `stitch/` (`python3 scripts/import_stitch.py`, nécessite Node).

Les images et les polices sont chargées depuis les URL présentes dans les exports ou des fournisseurs externes de remplacement. Les formulaires ne font que valider l'interface : aucune réservation n'est créée et aucune donnée de formulaire n'est envoyée ni persistée.
