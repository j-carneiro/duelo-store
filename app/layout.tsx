import type { Metadata } from "next";
import "./globals.css"; // Esta linha carrega o Tailwind e resolve os ícones gigantes
import { Providers } from "@/components/providers";

// Metadados que aparecem na aba do navegador
export const metadata: Metadata = {
  title: "YGO STOCK | Loja Profissional",
  description: "Sua vitrine de cards de Yu-Gi-Oh! com checkout via WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}