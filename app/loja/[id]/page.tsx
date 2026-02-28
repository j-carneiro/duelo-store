"use client"
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Search, Trash2, Send, Loader2, Plus, ShoppingBag, X, CheckCircle2, Info, ArrowLeft, AlertTriangle, MapPin
} from 'lucide-react';

export default function GaleriaVendedor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [selectedCardDetails, setSelectedCardDetails] = useState<any>(null);
  const [activeLocalCard, setActiveLocalCard] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  async function fetchLoja() {
    setLoading(true);
    try {
      // 1. Busca os dados do perfil do vendedor
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', id)
        .single();
      
      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      // 2. Busca apenas as cartas DESTE vendedor
      const { data: cartasData, error: cartasError } = await supabase
        .from('cartas')
        .select('*')
        .eq('vendedor_id', id)
        .eq('is_active', true);
      
      if (cartasError) throw cartasError;
      setEstoque(cartasData || []);

    } catch (error: any) {
      console.error("Erro ao buscar loja:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mounted) fetchLoja();
  }, [mounted, id]);

  if (!mounted) return null;

  // LÓGICA DE DETALHES (API)
  const fetchDetails = async (card: any) => {
    setActiveLocalCard(card);
    try {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}&language=pt`);
      const data = await response.json();
      if (data && data.data) {
        setSelectedCardDetails(data.data[0]);
      } else {
        const resEn = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}`);
        const dataEn = await resEn.json();
        if (dataEn.data) setSelectedCardDetails(dataEn.data[0]);
      }
    } catch (error) { console.error(error); }
  };

  const addToCart = (card: any) => {
    const qtdBag = cart.filter(item => item.id === card.id).length;
    if (qtdBag < card.stock) {
      setCart([...cart, { ...card, cartId: Math.random() }]);
      setToast({ show: true, message: `${card.name} na sacola!`, type: 'success' });
    } else {
      setToast({ show: true, message: `Limite de estoque atingido`, type: 'error' });
    }
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2000);
  };

  const handleWhatsApp = async () => {
  if (cart.length === 0) return;

  const foneVendedor = perfil?.whatsapp || cart[0].vendedor?.whatsapp || "5511999999999";
  const nomeLoja = perfil?.nome_loja || cart[0].vendedor?.nome_loja || "Vendedor";
  const vendedorId = perfil?.id || cart[0].vendedor_id;

  let total = 0;
  const itensNomes: string[] = [];
  
  const agrupado: any = {};
  cart.forEach(item => {
    agrupado[item.id] = agrupado[item.id] ? { ...agrupado[item.id], qtd: agrupado[item.id].qtd + 1 } : { ...item, qtd: 1 };
  });

  let texto = `🟠 *NOVO PEDIDO - ${nomeLoja.toUpperCase()}* 🟠\nPlataforma: Duelo Store\n\n`;

  Object.values(agrupado).forEach((item: any) => {
    texto += `• ${item.qtd}x ${item.name} (${item.rarity})\n  R$ ${(item.price * item.qtd).toFixed(2)}\n\n`;
    total += (item.price * item.qtd);
    itensNomes.push(`${item.qtd}x ${item.name}`);
  });

  texto += `*TOTAL: R$ ${total.toFixed(2)}*`;

  // --- A MÁGICA DO RELATÓRIO: SALVAR NO BANCO ---
  try {
    await supabase.from('checkouts').insert([{
      vendedor_id: vendedorId,
      valor_total: total,
      itens: itensNomes.join(', ') // Salva a lista de cartas como texto
    }]);
  } catch (e) {
    console.error("Erro ao logar checkout:", e);
  }

  window.open(`https://wa.me/${foneVendedor}?text=${encodeURIComponent(texto)}`);
};

  // CATEGORIAS DINÂMICAS
  const categoriasBase = ['Monstro Main', 'Monstro Extra', 'Magia', 'Armadilha'];
  const categoriasOrdenadas = categoriasBase
    .map(cat => ({
      nome: cat,
      cards: estoque.filter(c => c.category === cat)
    }))
    .filter(item => item.cards.length > 0)
    .sort((a, b) => b.cards.length - a.cards.length);

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212]">
      <Loader2 className="animate-spin text-[#CD7F32]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors duration-300 overflow-x-hidden">
      
      {/* TOAST */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`${toast.type === 'success' ? 'bg-[#CD7F32]' : 'bg-red-600'} text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      </div>

      {/* HEADER DA LOJA */}
      <nav className="bg-[#CD7F32] dark:bg-[#1E1E1E] text-white sticky top-0 z-40 py-3 px-4 md:px-6 shadow-xl w-full">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase tracking-[0.2em] leading-none">{perfil?.nome_loja}</h1>
              <p className="text-[9px] uppercase tracking-widest opacity-60">Vitrine Oficial</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-white/10 border border-white/10 rounded-sm hover:bg-white hover:text-[#CD7F32] transition-all">
              <ShoppingBag size={20} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-[#CD7F32] text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto p-6 md:p-10">
        
        {/* CABEÇALHO DO VENDEDOR */}
        <div className="mb-16 text-center space-y-4">
           <div className="w-20 h-20 bg-[#CD7F32] rounded-full mx-auto flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white dark:border-[#1E1E1E]">
              {perfil?.nome_loja?.substring(0,2).toUpperCase()}
           </div>
           <div>
             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter dark:text-white leading-none mb-2">{perfil?.nome_loja}</h2>
             <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-[#CD7F32]"/> {perfil?.cidade || 'Brasil'}</span>
                <span className="opacity-20">|</span>
                <span>{estoque.length} Cards Disponíveis</span>
             </div>
           </div>
        </div>

        {/* VITRINE FILTRADA POR CATEGORIA */}
        <section className="space-y-12">
          {categoriasOrdenadas.length > 0 ? (
            categoriasOrdenadas.map((item) => (
              <div key={item.nome} className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className="flex flex-col">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CD7F32] whitespace-nowrap">{item.nome}</h2>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.cards.length} Cards</span>
                  </div>
                  <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5"></div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {item.cards.map(card => {
                    const inBag = cart.filter(c => c.id === card.id).length;
                    const esgotado = card.stock <= 0;
                    const limite = inBag >= card.stock;
                    return (
                      <div key={card.id} className="rounded-sm flex flex-col transition-all shadow-md bg-[#CD7F32] dark:bg-[#1E1E1E] border border-transparent dark:border-white/5 hover:-translate-y-1 group">
                        <div onClick={() => fetchDetails(card)} className="aspect-[3/4] p-2 bg-white/10 dark:bg-[#161616] relative overflow-hidden cursor-help">
                          <img src={card.image_url} className={`object-contain w-full h-full transition-transform duration-700 group-hover:scale-110 ${esgotado ? 'grayscale opacity-30' : ''}`} alt={card.name} />
                          {esgotado && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-white font-black uppercase tracking-[0.2em]">Esgotado</span>}
                        </div>
                        <div className="p-2 flex flex-col flex-1">
                          <h4 className="font-bold text-white dark:text-gray-100 text-[12px] leading-tight line-clamp-2 min-h-[1.8rem] mb-0.5 tracking-tight">{card.name}</h4>
                          <div className="flex items-center gap-1 text-white/70 dark:text-white/30 font-bold text-[8px] uppercase tracking-tighter mb-2">
                            <span>{card.rarity}</span> <span className="opacity-30">|</span> <span>{card.condition}</span>
                          </div>
                          
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-[8px] font-bold text-white/50 dark:text-white/20 uppercase">R$</span>
                              <span className="text-sm font-black text-white dark:text-[#CD7F32]">{card.price?.toFixed(2)}</span>
                            </div>
                            <span className={`text-[9px] font-black ${card.stock <= 2 ? 'text-amber-300 animate-pulse' : 'text-white/30'}`}>{card.stock}x</span>
                          </div>

                          <button 
                            disabled={esgotado || limite}
                            onClick={() => addToCart(card)}
                            className={`mt-auto w-full py-1.5 text-[8px] font-black uppercase rounded-sm transition-all ${esgotado || limite ? 'bg-black/10 text-white/40' : 'bg-white text-[#CD7F32] dark:bg-[#CD7F32] dark:text-white hover:bg-black hover:text-white'}`}
                          >
                            {esgotado ? 'Esgotado' : limite ? 'No Limite' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <AlertTriangle className="mx-auto text-slate-300" size={48} />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum card disponível nesta vitrine momento.</p>
              <Link href="/" className="inline-block text-[#CD7F32] text-[10px] font-black uppercase underline tracking-widest">Voltar para a Home</Link>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DETALHES */}
      {selectedCardDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCardDetails(null)}></div>
          <div className="relative bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedCardDetails(null)} className="absolute top-4 right-4 text-slate-400 hover:text-[#CD7F32] z-10"><X size={24} /></button>
            <div className="w-full md:w-1/2 p-8 bg-slate-50 dark:bg-black/20 flex items-center justify-center">
            <img 
                /* A MÁGICA: Usamos a imagem salva no NOSSO banco de dados */
                src={activeLocalCard?.image_url || selectedCardDetails.card_images[0].image_url} 
                alt={activeLocalCard?.name}
                className="max-h-[60vh] md:max-h-full object-contain shadow-2xl animate-in fade-in duration-500" 
            />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-[#CD7F32] tracking-tighter uppercase italic leading-none mb-2">{selectedCardDetails.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">{selectedCardDetails.type} | {selectedCardDetails.race}</p>
                  <span className="bg-[#CD7F32]/10 text-[#CD7F32] text-[9px] font-black px-2 py-0.5 rounded-sm border border-[#CD7F32]/20 uppercase">{activeLocalCard?.condition}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-white/5 py-4 font-black">
                {selectedCardDetails.level && <div><span className="text-[9px] text-slate-400 block mb-1 uppercase">Nível</span><span className="text-xl dark:text-white">⭐ {selectedCardDetails.level}</span></div>}
                {selectedCardDetails.atk !== undefined && <div><span className="text-[9px] text-slate-400 block mb-1 uppercase">ATK / DEF</span><span className="text-xl dark:text-white">{selectedCardDetails.atk} / {selectedCardDetails.def}</span></div>}
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium">{selectedCardDetails.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* DOCK CARRINHO */}
      <div className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white z-[70] transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full shadow-2xl'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-white/5 pb-6 text-[#CD7F32]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em]">Sua Sacola</h3>
            <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
            {cart.map(item => (
              <div key={item.cartId} className="flex gap-4 items-center border-b border-slate-100 dark:border-white/5 pb-4 group">
                <img src={item.image_url} className="w-10 h-14 object-contain bg-slate-50 dark:bg-black/40 p-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate">{item.name}</p>
                  <p className="text-[10px] font-black text-[#CD7F32] mt-1">R$ {item.price?.toFixed(2)}</p>
                </div>
                <button onClick={() => setCart(cart.filter(c => c.cartId !== item.cartId))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
              </div>
            ))}
            {cart.length === 0 && <div className="h-40 flex flex-col items-center justify-center opacity-10"><ShoppingBag size={40}/><p className="text-[10px] font-black mt-4 uppercase">Vazia</p></div>}
          </div>
          {cart.length > 0 && (
            <div className="pt-8 border-t border-slate-100 dark:border-white/10 space-y-6">
              <div className="flex justify-between items-center font-black">
                <span className="text-[10px] opacity-30 uppercase tracking-[0.3em] dark:text-white">Total</span>
                <span className="text-xl text-[#CD7F32]">R$ {cart.reduce((acc, item) => acc + (item.price || 0), 0).toFixed(2)}</span>
              </div>
              <button onClick={handleWhatsApp} className="w-full bg-[#CD7F32] text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">FINALIZAR PEDIDO</button>
            </div>
          )}
        </div>
      </aside>

    </div>
  );
}