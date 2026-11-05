import { Caveat, Oswald, Permanent_Marker, Special_Elite } from "next/font/google";
import { subject } from "@/data/content";
import "./globals.css";

const typewriter = Special_Elite({ variable: "--font-type", weight: "400", subsets: ["latin"] });
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });
const display = Oswald({ variable: "--font-display", subsets: ["latin"] });

export const metadata = {
  title: `${subject.name} (${subject.alias}) — Case File`,
  description: `${subject.name} — ${subject.role} from ${subject.origin}. Investigate the board to explore projects, experience and contact details.`,
};

export const viewport = {
  themeColor: "#0b0a09",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${typewriter.variable} ${marker.variable} ${hand.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
