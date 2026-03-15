import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";

export const concreteBodyFont = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const concreteDisplayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

export const concreteMonoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
