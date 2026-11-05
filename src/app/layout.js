import { Architects_Daughter, Caveat, Oswald, Permanent_Marker } from "next/font/google";
import { subject } from "@/data/content";
import "./globals.css";

// marker-pen handwriting for everything written on the board (was a typewriter face)
const typewriter = Architects_Daughter({ variable: "--font-type", weight: "400", subsets: ["latin"] });
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });
const display = Oswald({ variable: "--font-display", subsets: ["latin"] });

const title = subject.name;
const description = [
  "Hey there, I'm Lakshya, a creative designer and fullstack developer, based in India. ☀️",
  "I design and develop apps, websites and tools that help people reach their best internet potential.",
].join("\n");

// The share image is src/app/opengraph-image.png (and twitter-image.png): the board with the torch off,
// captured at 1200 x 630 from /?torch=off.
export const metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: subject.name, locale: "en_IN" },
  twitter: { card: "summary_large_image", title, description, creator: "@antinityfx" },
};

export const viewport = {
  themeColor: "#050505",
  viewportFit: "cover", // run under the notch; the loader and toast keep clear of it
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${typewriter.variable} ${marker.variable} ${hand.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
