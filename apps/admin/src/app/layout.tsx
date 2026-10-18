import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Inter for all UI and body text (400, never above 500). Playfair Display for
// large display headings only; it is a high-contrast serif and reads fussy below
// ~18px, so small headings stay in Inter 500. Both are variable fonts.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "FYT Console", template: "%s · FYT Console" },
  description: "Operator console for FYT, Find Your Trainer.",
  robots: { index: false, follow: false },
};

// Applies the saved theme before paint so there is no flash.
const themeScript = `(function(){try{var t=localStorage.getItem('tp-theme');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${geistMono.variable} min-h-[100dvh] antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-surface !text-ink !border !border-line !rounded-[10px] !shadow-[var(--shadow-overlay)] !font-sans",
              description: "!text-ink-2",
            },
          }}
        />
      </body>
    </html>
  );
}
