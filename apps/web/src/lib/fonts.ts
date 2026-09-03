import localFont from "next/font/local";

// Satoshi is the KNOW brand's primary typeface (visual-design-personal.md §5.1).
// Files live in apps/web/public/brand/font/ as .woff. There is no Semibold (600)
// weight in this cut — map any "semibold" need to 500 (Medium) or 700 (Bold).
export const satoshi = localFont({
  src: [
    { path: "../../public/brand/font/Satoshi-Light.woff", weight: "300", style: "normal" },
    { path: "../../public/brand/font/Satoshi-LightItalic.woff", weight: "300", style: "italic" },
    { path: "../../public/brand/font/Satoshi-Regular.woff", weight: "400", style: "normal" },
    { path: "../../public/brand/font/Satoshi-Italic.woff", weight: "400", style: "italic" },
    { path: "../../public/brand/font/Satoshi-Medium.woff", weight: "500", style: "normal" },
    { path: "../../public/brand/font/Satoshi-MediumItalic.woff", weight: "500", style: "italic" },
    { path: "../../public/brand/font/Satoshi-Bold.woff", weight: "700", style: "normal" },
    { path: "../../public/brand/font/Satoshi-BoldItalic.woff", weight: "700", style: "italic" },
    { path: "../../public/brand/font/Satoshi-Black.woff", weight: "900", style: "normal" },
    { path: "../../public/brand/font/Satoshi-BlackItalic.woff", weight: "900", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});
