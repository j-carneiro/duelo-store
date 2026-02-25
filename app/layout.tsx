import type { Metadata } from "next";
import "./globals.css"; // Esta linha carrega o Tailwind e resolve os ícones gigantes
import { Providers } from "@/components/providers";

// Metadados que aparecem na aba do navegador
export const metadata: Metadata = {
  title: "Duelo CardStore | Sua Loja de Cards",
  description: "Acervo de cards de Yu-Gi-Oh! Checkout via WhatsApp",
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