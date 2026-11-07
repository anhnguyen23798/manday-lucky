import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro, Bungee } from "next/font/google";
import { StoreProvider } from "@/components/StoreProvider";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "800"],
  variable: "--font-be-vietnam",
});

const display = Bungee({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-bungee",
});

const rounded = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
  variable: "--font-baloo",
});

export const metadata: Metadata = {
  title: "Vio Manday Lucky: Vòng quay Anh Em 11/11",
  description: "Vòng quay may mắn mừng Vio Manday 11/11, ngày của anh em",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} ${display.variable} ${rounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
