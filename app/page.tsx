"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Search, Filter, Trash2, Send, Loader2, Plus, ShoppingBag, X, CheckCircle2, Info, AlertTriangle, ChevronRight, MapPin
} from 'lucide-react';

export default function Loja() {
  const [mounted, setMounted] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [selectedCardDetails, setSelectedCardDetails] = useState<any>(null);
  const [activeLocalCard, setActiveLocalCard] = useState<any>(null);

  // ESTADOS DE FILTRO
  const [search, setSearch] = useState('');
  const [selRarities, setSelRarities] = useState<string[]>([]);
  const [selConditions, setSelConditions] = useState<string[]>([]);
  const [selTypes, setSelTypes] = useState<string[]>([]);
  const [selSubTypes, setSelSubTypes] = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // BUSCA DE DADOS (CARTAS + VENDEDORES COM SLUG)
  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      // 1. Busca Cartas com dados do vendedor (Incluindo Slug e Cidade)
      const { data: cartasData, error: cartasError } = await supabase
        .from('cartas')
        .select(`
          *,
          vendedor:vendedor_id(id, nome_loja, whatsapp, cidade, slug)
        `)
        .eq('is_active', true);

      if (cartasError) throw cartasError;
      setEstoque(cartasData || []);

      // 2. Busca as lojas mais recentes usando o Slug para o Link
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('*')
        .limit(5)
        .order('id', { ascending: false });
      
      setVendedores(perfisData || []);

    } catch (error: any) {
      console.error("Erro no carregamento:", error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mounted) fetchDadosIniciais();
  }, [mounted]);

  // LÓGICA DE FILTRAGEM MULTISELEÇÃO
  const filteredCards = estoque.filter(card => {
    const matchSearch = card.name.toLowerCase().includes(search.toLowerCase());
    const matchRarity = selRarities.length === 0 || selRarities.includes(card.rarity);
    const matchCondition = selConditions.length === 0 || selConditions.includes(card.condition);
    const matchType = selTypes.length === 0 || selTypes.includes(card.category);
    const matchSubType = selSubTypes.length === 0 || selSubTypes.includes(card.sub_category);
    return matchSearch && matchRarity && matchCondition && matchType && matchSubType;
  });

  // OPÇÕES DINÂMICAS PARA OS FILTROS (Extrai do que existe no banco)
  const optRarities = Array.from(new Set(estoque.map(c => c.rarity))).filter(Boolean).sort();
  const optConditions = Array.from(new Set(estoque.map(c => c.condition))).filter(Boolean).sort();
  const optTypes = Array.from(new Set(estoque.map(c => c.category))).filter(Boolean).sort();
  const optSubTypes = Array.from(new Set(estoque.map(c => c.sub_category))).filter(Boolean).sort();

  const toggleFilter = (array: string[], setArray: Function, value: string) => {
    if (array.includes(value)) setArray(array.filter(i => i !== value));
    else setArray([...array, value]);
  };

  // CATEGORIAS DINÂMICAS ORDENADAS POR VOLUME
  const categoriasBase = ['MONSTRO MAIN', 'MONSTRO EXTRA', 'MAGIA', 'ARMADILHA'];
  const categoriasOrdenadas = categoriasBase
    .map(cat => ({
      nome: cat,
      cards: filteredCards.filter(c => c.category === cat)
    }))
    .filter(item => item.cards.length > 0)
    .sort((a, b) => b.cards.length - a.cards.length);

  // FUNÇÕES DE CARRINHO E API
  const addToCart = (card: any) => {
    const qBag = cart.filter(item => item.id === card.id).length;
    if (qBag < card.stock) {
      setCart([...cart, { ...card, cartId: Math.random() }]);
      setToast({ show: true, message: `${card.name} na sacola!`, type: 'success' });
    } else {
      setToast({ show: true, message: `Limite de estoque atingido`, type: 'error' });
    }
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2000);
  };

  const fetchDetails = async (card: any) => {
    setActiveLocalCard(card);
    try {
      const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}&language=pt`);
      const data = await response.json();
      if (data && data.data) setSelectedCardDetails(data.data[0]);
      else {
        const resEn = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card.name)}`);
        const dataEn = await resEn.json();
        if (dataEn.data) setSelectedCardDetails(dataEn.data[0]);
      }
    } catch (error) { console.error(error); }
  };

  const handleWhatsApp = async () => {
    if (cart.length === 0) return;
    const v = cart[0].vendedor;
    const vendedorId = cart[0].vendedor_id;
    let total = 0;
    const itensNomes: string[] = [];
    let texto = `🟠 *PEDIDO - ${v?.nome_loja?.toUpperCase()}* 🟠\nPlataforma: Duelo Store\n\n`;
    
    const agrupado: any = {};
    cart.forEach(item => { agrupado[item.id] = agrupado[item.id] ? { ...agrupado[item.id], qtd: agrupado[item.id].qtd + 1 } : { ...item, qtd: 1 }; });
    
    Object.values(agrupado).forEach((item: any) => {
      texto += `• ${item.qtd}x ${item.name} (${item.rarity})\n  R$ ${(item.price * item.qtd).toFixed(2)}\n\n`;
      total += (item.price * item.qtd);
      itensNomes.push(`${item.qtd}x ${item.name}`);
    });

    texto += `*TOTAL: R$ ${total.toFixed(2)}*`;

    // REGISTRO NO MASTER INSIGHTS
    if (vendedorId) {
      await supabase.from('checkouts').insert([{
        vendedor_id: vendedorId,
        valor_total: total,
        itens: itensNomes.join(', ')
      }]);
    }

    window.open(`https://wa.me/${v?.whatsapp}?text=${encodeURIComponent(texto)}`);
  };

  if (!mounted) return null;

  if (loading) return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212]">
      <Loader2 className="animate-spin text-[#CD7F32]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors duration-300 overflow-x-hidden">
      
      {/* TOAST NOTIFICAÇÃO */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`${toast.type === 'success' ? 'bg-[#CD7F32]' : 'bg-red-600'} text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      </div>

      {/* HEADER */}
      <nav className="bg-[#CD7F32] dark:bg-[#1E1E1E] text-white sticky top-0 z-40 py-3 px-4 md:px-6 shadow-xl w-full flex justify-between items-center transition-colors">
        <Link href="/" className="flex-shrink-0">
          <img src="/logo.svg" alt="Logo" className="h-10 md:h-12 w-auto brightness-0 invert dark:brightness-100 dark:invert-0 transition-all" />
        </Link>
        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
          <input 
            type="text" placeholder="BUSCAR NO ACERVO..." 
            className="w-full pl-12 pr-4 py-2 bg-white/10 border border-white/10 rounded-sm text-[10px] tracking-widest outline-none focus:bg-white/20 transition-all text-white"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/admin" className="text-[9px] font-black uppercase text-white/60 hover:text-white transition-opacity">Login</Link>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-white/10 border border-white/10 rounded-sm hover:bg-white hover:text-[#CD7F32] transition-all">
            <ShoppingBag size={20} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-[#CD7F32] text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg">{cart.length}</span>}
          </button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* FILTROS LATERAIS (ESQUERDA) */}
        <aside className="w-full lg:w-48 shrink-0 space-y-8">
          <div className="sticky top-28">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CD7F32] mb-6 flex items-center gap-2"><Filter size={14}/> Filtros</h3>
            
            {[
              { title: 'Raridade', options: optRarities, state: selRarities, setState: setSelRarities },
              { title: 'Estado', options: optConditions, state: selConditions, setState: setSelConditions },
              { title: 'Tipo', options: optTypes, state: selTypes, setState: setSelTypes },
              { title: 'Sub Tipo', options: optSubTypes, state: selSubTypes, setState: setSelSubTypes },
            ].map(group => group.options.length > 0 && (
              <div key={group.title} className="mb-6">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{group.title}</h4>
                <div className="space-y-2">
                  {group.options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="hidden" checked={group.state.includes(opt)} onChange={() => toggleFilter(group.state, group.setState, opt)} />
                      <div className={`w-3 h-3 border transition-all rounded-sm flex items-center justify-center ${group.state.includes(opt) ? 'bg-[#CD7F32] border-[#CD7F32]' : 'border-slate-300 dark:border-white/10 group-hover:border-[#CD7F32]'}`}>
                        {group.state.includes(opt) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className={`text-[9px] font-bold uppercase transition-colors ${group.state.includes(opt) ? 'text-[#CD7F32]' : 'text-slate-500 dark:text-slate-400'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {(selRarities.length > 0 || selConditions.length > 0 || selTypes.length > 0 || selSubTypes.length > 0) && (
              <button onClick={() => { setSelRarities([]); setSelConditions([]); setSelTypes([]); setSelSubTypes([]); }} className="text-[8px] font-black text-[#CD7F32] uppercase underline tracking-widest">Limpar</button>
            )}
          </div>
        </aside>

        {/* VITRINE CENTRAL */}
        <div className="flex-1 min-w-0 space-y-12">
          <section className="space-y-8">
            {categoriasOrdenadas.map((item) => (
              <div key={item.nome} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <div className="flex flex-col">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#CD7F32] whitespace-nowrap">{item.nome}</h2>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.cards.length} Cards</span>
                  </div>
                  <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5"></div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-hide snap-x">
                  {item.cards.map(card => {
                    const inBag = cart.filter(c => c.id === card.id).length;
                    const esgotado = card.stock <= 0;
                    const limite = inBag >= card.stock;
                    return (
                      <div key={card.id} className="flex-none w-40 sm:w-44 rounded-sm flex flex-col transition-all snap-start shadow-md bg-[#CD7F32] dark:bg-[#1E1E1E] border border-transparent dark:border-white/5 hover:-translate-y-1 group">
                        <div onClick={() => fetchDetails(card)} className="aspect-[3/4] p-2 bg-white/10 dark:bg-[#161616] relative overflow-hidden cursor-help">
                          <img src={card.image_url} className={`object-contain w-full h-full transition-transform duration-700 group-hover:scale-110 ${esgotado ? 'grayscale opacity-30' : ''}`} alt={card.name} />
                          {esgotado && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-white font-black uppercase tracking-[0.2em]">Esgotado</span>}
                          {card.is_pendulum && <div className="absolute top-2 left-2 bg-green-500/80 text-[6px] font-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-lg">Pêndulo</div>}
                        </div>
                        <div className="p-2 flex flex-col flex-1">
                          <div className="flex items-center justify-between mb-0.5 opacity-70">
                            <p className="text-[7px] font-black text-white dark:text-[#CD7F32] uppercase tracking-[0.2em] truncate flex-1">
                               {card.vendedor?.nome_loja || 'Duelista'}
                            </p>
                            {card.vendedor?.cidade && <p className="text-[6px] font-bold text-white/50 dark:text-white/20 uppercase tracking-tighter italic">{card.vendedor.cidade}</p>}
                          </div>
                          <h4 className="font-bold text-white dark:text-gray-100 text-[12px] leading-tight line-clamp-2 min-h-[1.8rem] mb-0.5 tracking-tight uppercase">{card.name}</h4>
                          <div className="flex items-center gap-1 text-white/70 dark:text-white/30 font-bold text-[8px] uppercase tracking-tighter mb-2">
                             <span>{card.edition}</span> <span className="opacity-30">|</span> <span>{card.rarity}</span> <span className="opacity-30">|</span> <span>{card.condition}</span>
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
                            className={`mt-auto w-full py-1.5 text-[8px] font-black uppercase rounded-sm transition-all ${esgotado || limite ? 'bg-black/10 text-white/40 cursor-not-allowed' : 'bg-white text-[#CD7F32] dark:bg-[#CD7F32] dark:text-white hover:bg-black hover:text-white'}`}
                          >
                            {esgotado ? 'Esgotado' : limite ? 'No Limite' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {categoriasOrdenadas.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <AlertTriangle className="mx-auto mb-4" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum card encontrado</p>
              </div>
            )}
          </section>
        </div>

        {/* COLUNA DIREITA: NOVOS VENDEDORES (USANDO SLUG) */}
        <aside className="w-full lg:w-56 shrink-0 space-y-8">
          <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CD7F32] mb-6 border-b border-slate-100 dark:border-white/5 pb-3">Novas Lojas</h3>
            <div className="space-y-5">
              {vendedores.map(v => (
                <Link key={v.id} href={`/loja/${v.slug || v.id}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-[#CD7F32] flex-shrink-0 flex items-center justify-center text-white font-black text-[10px] group-hover:scale-110 transition-transform">
                    {v.nome_loja?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate dark:text-gray-100 group-hover:text-[#CD7F32] transition-colors uppercase">{v.nome_loja}</p>
                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <MapPin size={8} /> {v.cidade || 'Brasil'}
                    </p>
                  </div>
                  <ChevronRight size={10} className="text-slate-300" />
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-[#CD7F32] p-6 rounded-sm text-white shadow-2xl">
            <h4 className="text-[11px] font-black uppercase tracking-widest mb-2 leading-tight italic">Arena Aberta</h4>
            <p className="text-[10px] leading-relaxed opacity-80 mb-4 font-medium uppercase">Venda seus cards em um marketplace exclusivo.</p>
            <Link href="/admin" className="block w-full bg-black text-white text-center py-3 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Começar</Link>
          </div>
        </aside>
      </main>

      {/* MODAL DETALHES (USANDO IMAGEM LOCAL PREFERENCIALMENTE) */}
      {selectedCardDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCardDetails(null)}></div>
          <div className="relative bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedCardDetails(null)} className="absolute top-4 right-4 text-slate-400 hover:text-[#CD7F32] z-10"><X size={24} /></button>
            <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-50 dark:bg-black/20 flex items-center justify-center">
              <img src={activeLocalCard?.image_url || selectedCardDetails.card_images[0].image_url} className="max-h-[50vh] md:max-h-[70vh] object-contain shadow-2xl" />
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 space-y-6 uppercase">
              <div>
                <h2 className="text-2xl font-black text-[#CD7F32] tracking-tighter italic leading-none mb-2">{selectedCardDetails.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/30">{selectedCardDetails.type} | {selectedCardDetails.race}</p>
                  <span className="bg-[#CD7F32]/10 text-[#CD7F32] text-[9px] font-black px-2 py-0.5 rounded-sm border border-[#CD7F32]/20">{activeLocalCard?.edition} | {activeLocalCard?.condition}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-white/5 py-4 font-black">
                {selectedCardDetails.level && <div><span className="text-[9px] text-slate-400 block mb-1 uppercase">Nível</span><span className="text-xl">⭐ {selectedCardDetails.level}</span></div>}
                {selectedCardDetails.atk !== undefined && <div><span className="text-[9px] text-slate-400 block mb-1 uppercase">ATK / DEF</span><span className="text-xl">{selectedCardDetails.atk} / {selectedCardDetails.def}</span></div>}
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-medium lowercase italic">{selectedCardDetails.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* DOCK CARRINHO */}
      <div className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] transition-opacity ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)} />
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-72 md:w-80 bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white z-[70] transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full shadow-2xl'}`}>
        <div className="h-full flex flex-col p-8">
          <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-white/5 pb-6 text-[#CD7F32]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em]">Sua Sacola</h3>
            <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide text-slate-800 dark:text-gray-200">
            {cart.map(item => (
              <div key={item.cartId} className="flex gap-4 items-center border-b border-slate-100 dark:border-white/5 pb-4 group">
                <img src={item.image_url} className="w-10 h-14 object-contain bg-slate-50 dark:bg-black/40 p-1 rounded-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate uppercase">{item.name}</p>
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