import type { Metadata } from "next";
import { Figtree, Saira_Condensed } from "next/font/google";

const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--v-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--v-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spedition Sperger – Vorschau (Modern)",
  description:
    "Moderne Design-Vorschau für spedition-sperger.at – Zoll, Spedition und Lagerlogistik in Lustenau.",
};

export default function VorschauLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${display.variable} ${body.variable}`}>{children}</div>
  );
}
