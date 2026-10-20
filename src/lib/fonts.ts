import { Inter, Instrument_Serif } from "next/font/google";

/**
 * Editorial type pairing for the marketing surfaces. The variables are
 * applied on a wrapper element, and the Tailwind font tokens reference them
 * inline so they resolve wherever the wrapper is used.
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const editorialFontClass = `${inter.variable} ${instrumentSerif.variable}`;
