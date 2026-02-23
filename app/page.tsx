"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Loader2,
  Plus,
  ShoppingCart
} from 'lucide-react';

export default function Loja() {
  const [cart, setCart] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ rarity: '', lang: '', search: '' });

  useEffect(() => {
    async function fetchCartas() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('cartas').select('*').eq('is_active', true);
        if (error) throw error;
        setEstoque(data || []);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    }
    fetchCartas();
  }, []);

  const handleWhatsApp = () => {
    const fone = "5511998792205";
    let texto = "🔥 *PEDIDO YGO STORE* 🔥\n\n";
    cart.forEach(item => texto += `• ${item.name} (${item.rarity} | ${item.condition})\n`);
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`);
  };

  const filteredCards = estoque.filter(card => {
    return (
      card.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.rarity === '' || card.rarity === filters.rarity) &&
      (filters.lang === '' || card.lang === filters.lang)
    );
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#E2E8F0]">
      <Loader2 className="animate-spin text-[#2D3E77]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E2E8F0] text-slate-900 font-sans">
      
      {/* HEADER AZUL MARINHO */}
      <nav className="bg-[#2D3E77] text-white sticky top-0 z-50 py-4 px-6 shadow-xl">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-[0.2em]">YGO<span className="text-slate-400 font-light">STORE</span></h1>
          
          <div className="flex-1 max-w-lg mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="PESQUISAR..." 
              className="w-full pl-12 pr-4 py-2 bg-white/5 border border-white/10 rounded-sm text-xs tracking-widest outline-none focus:bg-white/10"
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <Link href="/admin">
            <button className="text-[10px] font-black tracking-widest bg-white/5 border border-white/10 px-4 py-2 hover:bg-white hover:text-[#2D3E77] transition-all">
              ADMIN
            </button>
          </Link>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10">

        {/* FILTROS HORIZONTAIS */}
        <div className="flex items-center gap-8 mb-8 pb-4 border-b border-slate-300">
          <div className="flex items-center gap-2 text-[#2D3E77]/50 uppercase font-black text-[10px] tracking-widest">
            <Filter size={14} /> Filtrar:
          </div>
          <select 
            onChange={(e) => setFilters({...filters, rarity: e.target.value})}
            className="bg-transparent text-[11px] font-bold uppercase text-[#2D3E77] outline-none"
          >
            <option value="">Raridade</option>
            <option value="Secret Rare">Secret Rare</option>
            <option value="Ultra Rare">Ultra Rare</option>
          </select>
          <select 
            onChange={(e) => setFilters({...filters, lang: e.target.value})}
            className="bg-transparent text-[11px] font-bold uppercase text-[#2D3E77] outline-none"
          >
            <option value="">Idioma</option>
            <option value="PT">PT</option>
            <option value="EN">EN</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* GRID DE CARTAS */}
          <section className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredCards.map(card => (
              <div key={card.id} className="bg-white rounded-sm border border-slate-200 flex flex-col hover:shadow-2xl hover:border-[#2D3E77]/30 transition-all duration-300">
                
                {/* 1. FOTO (Aspect Ratio Fixo) */}
                <div className="aspect-[3/4] p-3 bg-slate-50 relative group">
                  <img 
                    src={card.image_url} 
                    className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-500" 
                    alt={card.name}
                  />
                </div>

                {/* 2. INFORMAÇÕES */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Nome (Maior) */}
                  <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                    {card.name}
                  </h4>
                  
                  {/* Raridade | Estado | Idioma (Menores) */}
                  <div className="flex items-center gap-1.5 text-[#2D3E77]/60 font-bold text-[9px] uppercase tracking-tighter mb-4">
                    <span>{card.rarity}</span>
                    <span className="text-slate-300">|</span>
                    <span>{card.condition || 'NM'}</span>
                    <span className="text-slate-300">|</span>
                    <span>{card.lang}</span>
                  </div>

                  {/* 3. BOTÃO DE ADD TO CART */}
                    <button 
                      disabled={card.stock <= 0} // DESATIVA SE NÃO TIVER ESTOQUE
                      onClick={() => setCart([...cart, {...card, cartId: Math.random()}])}
                      className={`mt-auto w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.1em] transition-colors flex items-center justify-center gap-2 ${
                        card.stock > 0 
                        ? 'bg-[#2D3E77] text-white hover:bg-black' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {card.stock > 0 ? (
                        <><Plus size={14} /> Adicionar</>
                      ) : (
                        'Esgotado'
                      )}
                    </button>
  
                        {/* Opcional: Mostrar a quantidade disponível */}
                        {card.stock > 0 && card.stock <= 3 && (
                          <p className="text-[8px] text-red-500 font-bold mt-2 text-center uppercase tracking-widest animate-pulse">
                            Resta(m) apenas {card.stock}!
                          </p>
                        )}
                  </div>
                </div>
            ))}
          </section>

          {/* CHECKOUT LATERAL */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="bg-[#2D3E77] text-white p-8 sticky top-32 shadow-2xl">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">CARRINHO</h3>
                <span className="bg-white text-[#2D3E77] text-[10px] px-2 py-0.5 font-black">{cart.length}</span>
              </div>
              
              <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.cartId} className="flex gap-4 items-center animate-in fade-in slide-in-from-right-2">
                    <img src={item.image_url} className="w-8 h-10 object-contain bg-white/5 rounded-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold truncate">{item.name}</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-tighter">{item.rarity} | {item.condition}</p>
                    </div>
                    <button 
                      onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))}
                      className="text-white/20 hover:text-red-400"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>

              <button 
                disabled={cart.length === 0}
                onClick={handleWhatsApp}
                className="w-full bg-white text-[#2D3E77] disabled:bg-white/5 disabled:text-white/10 py-4 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 flex items-center justify-center gap-3 transition-all"
              >
                <Send size={14}/> ENVIAR PARA WHATSAPP
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}