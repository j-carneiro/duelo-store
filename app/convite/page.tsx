"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Zap, ShieldCheck, Wallet, ShoppingBag, ArrowRight, 
  CheckCircle2, Users, Star, Layout
} from 'lucide-react';

export default function ConvitePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* NAV MINIMALISTA */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 py-4 px-6">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <Link href="/">
            <img src="/logo.svg" alt="Duelo Store" className="h-8 md:h-10 w-auto brightness-0 dark:brightness-100 transition-all" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/admin" className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-[#CD7F32] hover:text-black dark:hover:text-white transition-colors">
              Acessar Painel
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-[1200px] mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-[#CD7F32]/10 text-[#CD7F32] px-4 py-2 rounded-full border border-[#CD7F32]/20 animate-bounce">
            <Star size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Oportunidade Master</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter dark:text-white leading-[0.9] uppercase italic">
            Sua pasta <br />
            <span className="text-[#CD7F32] not-italic">vale ouro.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-500 dark:text-gray-400 text-sm md:text-lg font-medium leading-relaxed">
            Pare de deixar seus cards avulsos pegando poeira. Junte-se à <span className="text-[#CD7F32] font-black">Duelo Store</span> e transforme sua coleção em uma vitrine profissional em menos de 2 minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/admin" className="w-full sm:w-auto bg-[#CD7F32] text-white px-10 py-5 rounded-sm font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 group">
              Abrir Minha Loja <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/" className="w-full sm:w-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-10 py-5 rounded-sm font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center">
              Explorar a Arena
            </Link>
          </div>
        </div>
      </section>

      {/* VANTAGENS (FEATURES) */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-black/20 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#CD7F32] flex items-center justify-center text-white rounded-sm shadow-lg shadow-[#CD7F32]/20">
              <Layout size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight dark:text-white italic">Vitrine Exclusiva</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
              Ganhe um link próprio para divulgar sua loja. Uma página limpa, rápida e otimizada para converter seus seguidores em compradores.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#CD7F32] flex items-center justify-center text-white rounded-sm shadow-lg shadow-[#CD7F32]/20">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight dark:text-white italic">Cadastro Ninja</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
              Diga o nome do card e nós fazemos o resto. Buscamos imagem, efeito e variantes de arte automaticamente via API.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#CD7F32] flex items-center justify-center text-white rounded-sm shadow-lg shadow-[#CD7F32]/20">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight dark:text-white italic">Checkout Direto</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
              Sem taxas abusivas. O pedido chega organizado no seu WhatsApp e você combina o pagamento e envio como preferir.
            </p>
          </div>

        </div>
      </section>

      {/* PROVA SOCIAL / STATS RÁPIDOS */}
      <section className="py-20 px-6">
        <div className="max-w-[1000px] mx-auto bg-[#CD7F32] p-10 md:p-20 rounded-sm shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
          {/* Círculos de fundo decorativos */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 text-white space-y-4 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
              Não lute sozinho. <br />
              <span className="opacity-50">Venda com a elite.</span>
            </h2>
            <p className="text-sm font-medium opacity-80 max-w-md">
              Junte-se a dezenas de outros duelistas que já estão faturando alto no nosso Marketplace.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-4xl font-black text-white leading-none">0%</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-2">Taxa de Venda</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-white leading-none">24/7</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-2">Arena Online</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-200 dark:border-white/5 text-center">
        <img src="/logo.svg" alt="Duelo Store" className="h-6 mx-auto mb-6 opacity-20 grayscale brightness-0 dark:brightness-100 dark:invert-0" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
          Duelo Store © 2026 • O Destino dos Campeões
        </p>
      </footer>

    </div>
  );
}