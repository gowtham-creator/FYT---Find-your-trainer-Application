import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Open Sauce One (SIL OFL 1.1, self-hosted) for display and body: 400 body,
// 500 labels and buttons, 600 for titles, KPI values and the active nav item.
// JetBrains Mono (SIL OFL 1.1) for numbers, IDs and kickers (`.num`).
const openSauceOne = localFont({
  variable: "--font-open-sauce",
  display: "swap",
  src: [
    { path: "./fonts/OpenSauceOne-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/OpenSauceOne-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/OpenSauceOne-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/OpenSauceOne-Bold.ttf", weight: "700", style: "normal" },
  ],
});
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

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
      <body className={`${openSauceOne.variable} ${jetbrainsMono.variable} min-h-[100dvh] antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-surface !text-ink !border !border-line !rounded-[12px] !shadow-[var(--shadow-overlay)] !font-sans",
              description: "!text-ink-2",
            },
          }}
        />
      </body>
    </html>
  );
}
