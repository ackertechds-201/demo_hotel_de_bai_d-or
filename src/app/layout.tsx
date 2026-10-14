import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const FONTS = [
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
];

export const metadata: Metadata = {
  title: { default: "Hôtel Baie d'Or", template: "%s • Hôtel Baie d'Or" },
  description:
    "Hôtel Baie d'Or, sanctuaire éco-luxe à Diego-Suarez (Madagascar) — projet de démonstration Acker Tech DS.",
  // The Stitch image CDN answers 429 to hotlinked requests that carry a Referer.
  referrer: "no-referrer",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌴</text></svg>",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {FONTS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="bg-[#FFFBF2]">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
