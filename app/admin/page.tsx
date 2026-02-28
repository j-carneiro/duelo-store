"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  PlusCircle, Trash2, LogOut, Package, Home, 
  Eye, EyeOff, Loader2, Plus, Minus, Settings, Search, CheckCircle2, AlertTriangle, ImageIcon, User, MapPin, Calendar, Mail, Hash
} from 'lucide-react';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  const [cartas, setCartas] = useState<any[]>([]);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // ESTADO DE CADASTRO (LEADS)
  const [regData, setRegData] = useState({
    email: '', password: '', nome_completo: '', data_nascimento: '', whatsapp: '', cidade: '', cep: '', nome_loja: ''
  });

  // ESTADO DE LOGIN
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ESTADO DE NOVO CARD
  const [newCard, setNewCard] = useState({
    name: '', rarity: 'Common', condition: 'Near Mint', lang: 'PT', image_url: '', is_active: true, stock: 1, price: 0, category: 'Monstro Main'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        fetchProfile(user.id);
        fetchCartas(user.id);
      }
    };
    if (mounted) checkUser();
  }, [mounted]);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('perfis').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }

  async function fetchCartas(userId: string) {
    const { data } = await supabase.from('cartas').select('*').eq('vendedor_id', userId).order('id', { ascending: false });
    setCartas(data || []);
  }

  // LÓGICA DE CADASTRO (LEAD GENERATION)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Tenta criar o usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
    });

    // Se houver erro no Auth (e-mail já existe, senha fraca, etc)
    if (authError) {
      alert("Erro no cadastro: " + authError.message);
      setLoading(false);
      return;
    }

    // A TRAVA DE SEGURANÇA PARA O TYPESCRIPT:
    // Verificamos se o usuário realmente foi retornado
    const newUser = authData?.user;

    if (!newUser) {
      alert("Erro inesperado: Usuário não retornado pelo sistema.");
      setLoading(false);
      return;
    }

    // 2. Agora o TypeScript sabe que 'newUser' existe. Salvamos o perfil.
    const { error: profError } = await supabase.from('perfis').insert([{
      id: newUser.id, // Agora ele não reclama mais do id
      nome_completo: regData.nome_completo,
      data_nascimento: regData.data_nascimento,
      whatsapp: regData.whatsapp,
      cidade: regData.cidade,
      cep: regData.cep,
      nome_loja: regData.nome_loja,
      email_contato: regData.email
    }]);

    if (profError) {
      alert("Conta criada, mas erro ao salvar dados: " + profError.message);
    } else {
      alert("Cadastro Master realizado! Verifique seu e-mail.");
      setIsRegistering(false);
    }
    
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else if (data?.user) { setUser(data.user); setIsLoggedIn(true); fetchProfile(data.user.id); fetchCartas(data.user.id); }
    setLoading(false);
  };

  const handleAutoFill = async () => {
    if (!newCard.name) return alert("Digite o nome do card.");
    setIsSearchingAPI(true);
    setAvailableImages([]);
    try {
      const resPt = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(newCard.name)}&language=pt`);
      let data = await resPt.json();
      if (!data.data) {
        const resEn = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(newCard.name)}`);
        data = await resEn.json();
      }
      if (data.data && data.data[0]) {
        const info = data.data[0];
        setAvailableImages(info.card_images);
        let cat = "Monstro Main";
        const type = info.type.toLowerCase();
        if (type.includes("spell")) cat = "Magia";
        else if (type.includes("trap")) cat = "Armadilha";
        else if (type.includes("fusion") || type.includes("synchro") || type.includes("xyz") || type.includes("link")) cat = "Monstro Extra";
        setNewCard({...newCard, name: info.name, image_url: info.card_images[0].image_url, category: cat });
        showToast("Dados localizados!", 'success');
      } else { alert("Card não encontrado."); }
    } catch (e) { alert("Erro na API."); }
    finally { setIsSearchingAPI(false); }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return alert("Configure sua loja primeiro!");
    const { error } = await supabase.from('cartas').insert([{ ...newCard, vendedor_id: user.id }]);
    if (error) alert(error.message);
    else { showToast("Card publicado!", 'success'); setNewCard({...newCard, name: '', image_url: '', stock: 1, price: 0}); setAvailableImages([]); fetchCartas(user.id); }
  };

  const updateStock = async (id: number, ns: number) => { if (ns < 0) return; await supabase.from('cartas').update({ stock: ns }).eq('id', id); fetchCartas(user.id); };
  const updatePrice = async (id: number, np: number) => { await supabase.from('cartas').update({ price: np }).eq('id', id); fetchCartas(user.id); };
  const handleDelete = async (id: number) => { if (confirm("Excluir card?")) { await supabase.from('cartas').delete().eq('id', id); fetchCartas(user.id); } };
  const toggleActive = async (id: number, status: boolean) => { await supabase.from('cartas').update({ is_active: !status }).eq('id', id); fetchCartas(user.id); };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212] p-4">
        <div className={`bg-white dark:bg-[#1E1E1E] p-8 md:p-10 rounded-sm shadow-2xl w-full transition-all duration-500 ${isRegistering ? 'max-w-2xl' : 'max-w-md'} border border-slate-200 dark:border-white/5`}>
          <div className="flex justify-center mb-8"><img src="/logo.svg" alt="Duelo Store" className="h-12 w-auto brightness-0 dark:brightness-100" /></div>
          <h2 className="text-[10px] font-black mb-8 text-center text-[#CD7F32] uppercase tracking-[0.4em] italic">{isRegistering ? "Criação de Conta Master" : "Acesso Vendedor"}</h2>
          
          {isRegistering ? (
            <form onSubmit={handleSignUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 relative"><User className="absolute left-3 top-3 text-slate-300" size={14} /><input placeholder="NOME COMPLETO" required className="w-full p-3 pl-10 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, nome_completo: e.target.value})} /></div>
              <div className="relative"><Calendar className="absolute left-3 top-3 text-slate-300" size={14} /><input type="date" placeholder="DATA DE NASC" required className="w-full p-3 pl-10 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, data_nascimento: e.target.value})} /></div>
              <input placeholder="WHATSAPP (DDD + NUM)" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
              <div className="relative"><MapPin className="absolute left-3 top-3 text-slate-300" size={14} /><input placeholder="CIDADE / UF" required className="w-full p-3 pl-10 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, cidade: e.target.value})} /></div>
              <input placeholder="CEP (00000-000)" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, cep: e.target.value})} />
              <div className="md:col-span-2"><input placeholder="NOME DA SUA LOJA" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-[#CD7F32]/30 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, nome_loja: e.target.value})} /></div>
              <input type="email" placeholder="E-MAIL DE LOGIN" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, email: e.target.value})} />
              <input type="password" placeholder="SENHA" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, password: e.target.value})} />
              <button className="md:col-span-2 w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all mt-4 uppercase">{loading ? "Processando..." : "Finalizar Cadastro"}</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" placeholder="E-MAIL" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="SENHA" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={(e) => setPassword(e.target.value)} required />
              <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all uppercase">{loading ? "Entrando..." : "Acessar Painel"}</button>
            </form>
          )}
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[9px] font-black text-slate-400 hover:text-[#CD7F32] uppercase tracking-widest">{isRegistering ? "Já sou cadastrado" : "Criar nova loja"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans pb-20">
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`${toast.type === 'success' ? 'bg-[#CD7F32]' : 'bg-red-600'} text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}><CheckCircle2 size={14} /><p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p></div>
      </div>

      <nav className="bg-[#CD7F32] dark:bg-[#1E1E1E] text-white py-3 px-8 mb-10 shadow-xl flex justify-between items-center">
        <Link href="/"><img src="/logo.svg" alt="Logo" className="h-8 md:h-10 w-auto brightness-0 invert dark:brightness-100 dark:invert-0" /></Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/" className="text-[9px] font-black text-white/60 hover:text-white uppercase"><Home size={14}/></Link>
          <button onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))} className="text-[9px] font-black text-white/40 hover:text-red-400 uppercase"><LogOut size={16}/></button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-10">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 uppercase"><Settings size={18} className="inline mr-2"/> Minha Loja</h2>
            <div className="space-y-4 text-xs">
              <p className="font-bold dark:text-white uppercase tracking-tighter">{profile?.nome_loja}</p>
              <p className="text-slate-400 font-bold uppercase text-[10px]">{profile?.cidade} | {profile?.whatsapp}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 uppercase"><PlusCircle size={18} className="inline mr-2"/> Novo Anúncio</h2>
            <div className="space-y-6">
              <div className="flex gap-2">
                <input placeholder="Nome do Card" required className="flex-1 p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold dark:text-white outline-[#CD7F32]" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} />
                <button type="button" onClick={handleAutoFill} disabled={isSearchingAPI} className="px-4 bg-[#CD7F32] text-white rounded-sm hover:bg-black transition-all">
                  {isSearchingAPI ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
              {availableImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {availableImages.map((img) => (
                    <button key={img.id} type="button" onClick={() => setNewCard({...newCard, image_url: img.image_url})} className={`flex-none w-14 aspect-[3/4] border-2 rounded-sm overflow-hidden transition-all ${newCard.image_url === img.image_url ? 'border-[#CD7F32] scale-105' : 'border-transparent opacity-40'}`}>
                      <img src={img.image_url_small} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddCard} className="space-y-4">
                <select className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-[#CD7F32] outline-none" value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}>
                  <option value="Ghost Rare">Ghost Rare</option>
                  <option value="Quarter Century Secret Rare">Quarter Century Secret Rare</option>
                  <option value="Starlight Rare">Starlight Rare</option>
                  <option value="Collector's Rare">Collector's Rare</option>
                  <option value="Prismatic Secret Rare">Prismatic Secret Rare</option>
                  <option value="Prismatic Collector’s Rare">Prismatic Collector’s Rare</option>
                  <option value="Ultimate Rare">Ultimate Rare</option>
                  <option value="Gold Secret Rare">Gold Secret Rare</option>
                  <option value="Gold Rare">Gold Rare</option>
                  <option value="Secret Rare">Secret Rare</option>
                  <option value="Ultra Rare">Ultra Rare</option>
                  <option value="Super Rare">Super Rare</option>
                  <option value="Rare">Rare</option>
                  <option value="Common">Common</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.01" placeholder="Preço" className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.price || ''} onChange={e => setNewCard({...newCard, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Estoque" className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})} />
                </div>
                <button disabled={!profile} className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.2em] hover:bg-black disabled:opacity-50 uppercase">Publicar Card</button>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-sm border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10">
              <h2 className="font-black text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase"><Package size={16} className="inline mr-2"/> Meu Inventário</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                    <th className="p-6">Card</th><th className="p-6">Estoque</th><th className="p-6">Preço (R$)</th><th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartas.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 group">
                      <td className="p-6 flex items-center gap-4">
                        <div className="w-10 h-14 bg-slate-100 dark:bg-black/40 p-1 rounded-sm shrink-0 flex items-center justify-center">
                          {item.image_url ? <img src={item.image_url} className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-slate-300" />}
                        </div>
                        <div className="flex flex-col"><span className="font-bold text-xs uppercase dark:text-gray-200">{item.name}</span><span className="text-[8px] text-slate-400 font-bold uppercase">{item.rarity}</span></div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateStock(item.id, item.stock - 1)} className="text-slate-400 dark:text-white/20 hover:text-[#CD7F32]"><Minus size={14}/></button>
                          <span className="text-xs font-black min-w-[12px] text-center dark:text-white">{item.stock}</span>
                          <button onClick={() => updateStock(item.id, item.stock + 1)} className="text-[#CD7F32] hover:text-black dark:hover:text-white"><Plus size={14}/></button>
                        </div>
                      </td>
                      <td className="p-6"><input type="number" step="0.01" defaultValue={item.price} onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value))} className="w-20 bg-transparent border-b border-transparent focus:border-[#CD7F32] text-xs font-black text-[#CD7F32] outline-none" /></td>
                      <td className="p-6 text-right"><div className="flex justify-end gap-5"><button onClick={() => toggleActive(item.id, item.is_active)} className="text-white/10 hover:text-[#CD7F32]">{item.is_active ? <Eye size={18} className="text-[#CD7F32]"/> : <EyeOff size={18}/>}</button><button onClick={() => handleDelete(item.id)} className="text-white/10 hover:text-red-500"><Trash2 size={18}/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}