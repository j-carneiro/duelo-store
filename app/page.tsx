"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Filter, Trash2, Send, ShieldCheck, 
  Loader2, Plus, ShoppingBag, X, CheckCircle2 
} from 'lucide-react';

export default function Loja() {
  const [cart, setCart] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ rarity: '', lang: '', search: '' });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

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

  const addToCart = (card: any) => {
    const qtdNoCarrinho = cart.filter(item => item.id === card.id).length;
    if (qtdNoCarrinho < card.stock) {
      setCart([...cart, { ...card, cartId: Math.random() }]);
      setToast({ show: true, message: `${card.name} na sacola!` });
      setTimeout(() => setToast({ show: false, message: '' }), 2000);
    }
  };

  const handleWhatsApp = () => {
    const fone = "5511999999999"; // SEU NÚMERO
    let total = 0;
    let texto = "🟠 *PEDIDO YGO STOCK* 🟠\n\n";
    const agrupado: any = {};
    cart.forEach(item => {
      agrupado[item.id] = agrupado[item.id] ? { ...agrupado[item.id], qtd: agrupado[item.id].qtd + 1 } : { ...item, qtd: 1 };
    });
    Object.values(agrupado).forEach((item: any) => {
      texto += `• ${item.qtd}x ${item.name} (${item.rarity})\n  Subtotal: R$ ${(item.price * item.qtd).toFixed(2)}\n\n`;
      total += (item.price * item.qtd);
    });
    texto += `*TOTAL: R$ ${total.toFixed(2)}*`;
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
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Loader2 className="animate-spin text-[#CD7F32]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans selection:bg-[#CD7F32] selection:text-white">
      
      {/* TOAST COBRE */}
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
        <div className="bg-[#CD7F32] text-white px-6 py-2 rounded-sm shadow-2xl flex items-center gap-3 border border-white/20">
          <CheckCircle2 size={14} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</p>
        </div>
      </div>

      {/* HEADER GRAFITE */}
      <nav className="bg-[#1E1E1E] text-white sticky top-0 z-40 py-4 px-6 border-b border-white/5 shadow-2xl">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-[0.3em]">YGO<span className="text-[#CD7F32] italic">STOCK</span></h1>
          
          <div className="flex-1 max-w-md mx-8 relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR NO ESTOQUE..." 
              className="w-full pl-12 pr-4 py-2.5 bg-black/20 border border-white/5 rounded-sm text-[10px] tracking-widest outline-none focus:border-[#CD7F32]/50 transition-all placeholder:text-white/10"
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-[9px] font-black tracking-widest text-white/30 hover:text-[#CD7F32]">ADMIN</Link>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-black/20 border border-white/5 rounded-sm hover:text-[#CD7F32] transition-all">
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#CD7F32] text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cart.length}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
        
        {/* FILTROS MINIMALISTAS */}
        <div className="flex items-center gap-8 mb-12 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-white/20 uppercase font-black text-[9px] tracking-widest">
            <Filter size={14} /> Filtrar:
          </div>
          <select onChange={(e) => setFilters({...filters, rarity: e.target.value})} className="bg-transparent text-[10px] font-black uppercase text-[#CD7F32] outline-none cursor-pointer">
            <option value="">Raridade</option>
            <option value="Secret Rare">Secret Rare</option>
            <option value="Ultra Rare">Ultra Rare</option>
          </select>
          <select onChange={(e) => setFilters({...filters, lang: e.target.value})} className="bg-transparent text-[10px] font-black uppercase text-[#CD7F32] outline-none cursor-pointer">
            <option value="">Idioma</option>
            <option value="PT">PT</option>
            <option value="EN">EN</option>
          </select>
        </div>

        {/* VITRINE ROLAGEM HORIZONTAL */}
        <section className="space-y-16">
          {['Monstro Main', 'Monstro Extra', 'Magia', 'Armadilha'].map((cat) => {
            const cardsInCategory = filteredCards.filter(c => c.category === cat);
            if (cardsInCategory.length === 0) return null;
            return (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#CD7F32] whitespace-nowrap">{cat}</h2>
                  <div className="h-[1px] w-full bg-white/5"></div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-8 px-2 scrollbar-hide snap-x">
                  {cardsInCategory.map(card => (
                    <div key={card.id} className="flex-none w-44 bg-[#1E1E1E] border border-white/5 rounded-sm flex flex-col hover:border-[#CD7F32]/40 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all snap-start group">
                      <div className="aspect-[3/4] p-2 bg-[#161616] relative overflow-hidden">
                        <img src={card.image_url} className={`object-contain w-full h-full transition-transform duration-700 group-hover:scale-110 ${card.stock <= 0 ? 'grayscale opacity-20' : ''}`} />
                        {card.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-white font-black uppercase tracking-[0.2em]">Esgotado</span>}
                      </div>
                      
                      {/* ÁREA DE INFORMAÇÕES - NOMES AUMENTADOS */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Nome: Aumentado de 10px para 13px e ocupando até 2 linhas */}
                        <h4 className="font-bold text-gray-100 text-[13px] leading-tight line-clamp-2 min-h-[2.2rem] mb-2 tracking-tight group-hover:text-[#CD7F32] transition-colors">
                          {card.name}
                        </h4>

                        <div className="flex items-center gap-1.5 text-white/30 font-bold text-[8px] uppercase tracking-tighter mb-4">
                          <span>{card.rarity}</span>
                          <span className="opacity-20">|</span>
                          <span>{card.condition}</span>
                        </div>
                        
                        <div className="mb-5 flex items-baseline gap-1">
                          <span className="text-[9px] font-bold text-white/20 uppercase">R$</span>
                          <span className="text-base font-black text-[#CD7F32]">{card.price?.toFixed(2)}</span>
                        </div>
                        
                        <button 
                          disabled={card.stock <= 0}
                          onClick={() => addToCart(card)}
                          className={`mt-auto w-full py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${
                            card.stock > 0 ? 'bg-[#CD7F32] text-white hover:bg-[#A16207]' : 'bg-white/5 text-white/10'
                          }`}
                        >
                          {card.stock > 0 ? '+ Adicionar' : 'Sem Estoque'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* DOCK CARRINHO GRAFITE */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[60] transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />

      <aside className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-[#1E1E1E] text-white z-[70] transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0 shadow-[-20px_0_60px_rgba(0,0,0,0.8)]' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#CD7F32]">Sacola</h3>
            <button onClick={() => setIsCartOpen(false)} className="text-white/20 hover:text-white transition-transform hover:rotate-90"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
            {cart.map(item => (
              <div key={item.cartId} className="flex gap-4 items-center border-b border-white/5 pb-4 group">
                <div className="w-10 h-14 bg-black/40 p-1 rounded-sm shrink-0">
                  <img src={item.image_url} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-black text-[#CD7F32] mt-1">R$ {item.price?.toFixed(2)}</p>
                </div>
                <button onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))} className="text-white/10 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="pt-8 border-t border-white/10 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black opacity-20 uppercase tracking-[0.3em]">Total</span>
                <span className="text-xl font-black text-[#CD7F32]">R$ {cart.reduce((acc, item) => acc + (item.price || 0), 0).toFixed(2)}</span>
              </div>
              <button onClick={handleWhatsApp} className="w-full bg-[#CD7F32] text-white py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#A16207] transition-all shadow-2xl">
                FINALIZAR PEDIDO
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}