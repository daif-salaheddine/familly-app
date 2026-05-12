import type { Metadata, Viewport } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import ClickSound from "../components/ui/ClickSound";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Quest",
  description: "Family accountability app — goals, challenges, and real stakes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Quest",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c31e3",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ClickSound />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
