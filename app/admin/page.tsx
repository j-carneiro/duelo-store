"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  PlusCircle, Trash2, LogOut, Package, Home, 
  Eye, EyeOff, Loader2, Plus, Minus, Settings, Search, CheckCircle2, AlertTriangle, ImageIcon, User, MapPin, Calendar
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
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeWhatsapp, setStoreWhatsapp] = useState('');
  const [storeCity, setStoreCity] = useState('');

  const [regData, setRegData] = useState({
    email: '', password: '', nome_completo: '', data_nascimento: '', whatsapp: '', cidade: '', cep: '', nome_loja: ''
  });

  const [newCard, setNewCard] = useState({
    name: '', rarity: 'COMMON', condition: 'NM', lang: 'PT', image_url: '', edition: '', 
    is_active: true, stock: 1, price: 0, category: 'MONSTRO MAIN', sub_category: 'EFEITO', is_pendulum: false
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
    if (data) {
      setProfile(data);
      setStoreName(data.nome_loja?.toUpperCase() || '');
      setStoreWhatsapp(data.whatsapp || '');
      setStoreCity(data.cidade?.toUpperCase() || '');
    }
  }

  async function fetchCartas(userId: string) {
    const { data } = await supabase.from('cartas').select('*').eq('vendedor_id', userId).order('id', { ascending: false });
    setCartas(data || []);
  }

  const handleAutoFill = async () => {
    if (!newCard.name) return alert("Digite o nome ou o código.");
    setIsSearchingAPI(true);
    setAvailableImages([]);
    setAvailableSets([]);
    const searchTerm = newCard.name.trim();
    const isSetCode = /^[a-zA-Z0-9]{2,5}-[a-zA-Z0-9]{3,6}$/.test(searchTerm);

    try {
      let cardFound = null;
      if (isSetCode) {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?setcode=${encodeURIComponent(searchTerm)}`);
        if (res.ok) { const d = await res.json(); cardFound = d.data[0]; }
      }
      if (!cardFound) {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}&language=pt`);
        if (res.ok) { const d = await res.json(); cardFound = d.data[0]; }
      }
      if (!cardFound) {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}`);
        if (res.ok) { const d = await res.json(); cardFound = d.data[0]; }
      }

      if (cardFound) {
        setAvailableImages(cardFound.card_images);
        if (cardFound.card_sets) setAvailableSets(cardFound.card_sets);
        let cat = "MONSTRO MAIN";
        const type = cardFound.type.toLowerCase();
        if (type.includes("spell")) cat = "MAGIA";
        else if (type.includes("trap")) cat = "ARMADILHA";
        else if (type.match(/fusion|synchro|xyz|link/)) cat = "MONSTRO EXTRA";

        setNewCard({
          ...newCard,
          name: cardFound.name.toUpperCase(),
          image_url: cardFound.card_images[0].image_url,
          category: cat,
          edition: isSetCode ? searchTerm.toUpperCase() : (cardFound.card_sets ? cardFound.card_sets[0].set_code.toUpperCase() : '')
        });
        showToast("Dados Importados!", 'success');
      }
    } catch (e) { console.error(e); }
    finally { setIsSearchingAPI(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else if (data?.user) { setUser(data.user); setIsLoggedIn(true); fetchProfile(data.user.id); fetchCartas(data.user.id); }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nome_completo: regData.nome_completo.toUpperCase(),
          data_nascimento: regData.data_nascimento,
          whatsapp: regData.whatsapp,
          cidade: regData.cidade.toUpperCase(),
          cep: regData.cep,
          nome_loja: regData.nome_loja.toUpperCase()
        }
      }
    });
    if (authError) alert(authError.message);
    else { alert("Cadastro Master realizado! Verifique seu e-mail."); setIsRegistering(false); }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('perfis').upsert({ id: user.id, nome_loja: storeName.toUpperCase(), whatsapp: storeWhatsapp, cidade: storeCity.toUpperCase() });
    if (error) alert(error.message);
    else { showToast("Perfil Atualizado!", 'success'); fetchProfile(user.id); }
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return alert("Configure sua loja primeiro!");
    const { error } = await supabase.from('cartas').insert([{ ...newCard, vendedor_id: user.id }]);
    if (error) alert(error.message);
    else { 
      showToast("Publicado!", 'success'); 
      setNewCard({...newCard, name: '', image_url: '', edition: '', stock: 1, price: 0, is_pendulum: false}); 
      setAvailableImages([]); fetchCartas(user.id); 
    }
  };

  const updateStock = async (id: number, ns: number) => { if (ns < 0) return; await supabase.from('cartas').update({ stock: ns }).eq('id', id); fetchCartas(user.id); };
  const updatePrice = async (id: number, np: number) => { await supabase.from('cartas').update({ price: np }).eq('id', id); fetchCartas(user.id); };
  const updateCondition = async (id: number, nc: string) => { await supabase.from('cartas').update({ condition: nc }).eq('id', id); fetchCartas(user.id); };
  const updateCategory = async (id: number, ncat: string) => { await supabase.from('cartas').update({ category: ncat }).eq('id', id); fetchCartas(user.id); };
  const handleDelete = async (id: number) => { if (confirm("Excluir card?")) { await supabase.from('cartas').delete().eq('id', id); fetchCartas(user.id); } };
  const toggleActive = async (id: number, status: boolean) => { await supabase.from('cartas').update({ is_active: !status }).eq('id', id); fetchCartas(user.id); };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212] p-4">
        <div className={`bg-white dark:bg-[#1E1E1E] p-8 md:p-10 rounded-sm shadow-2xl w-full transition-all duration-500 ${isRegistering ? 'max-w-2xl' : 'max-w-md'} border border-slate-200 dark:border-white/5`}>
          <div className="flex justify-center mb-8"><Link href="/"><img src="/logo.svg" alt="Duelo Store" className="h-12 w-auto brightness-0 dark:brightness-100" /></Link></div>
          <h2 className="text-[10px] font-black mb-8 text-center text-[#CD7F32] uppercase tracking-[0.4em] italic">{isRegistering ? "Criação de Conta Master" : "Acesso Vendedor"}</h2>
          {isRegistering ? (
            <form onSubmit={handleSignUp} className="grid grid-cols-1 md:grid-cols-2 gap-4 uppercase">
              <input placeholder="NOME COMPLETO" required className="md:col-span-2 p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, nome_completo: e.target.value.toUpperCase()})} />
              <input type="date" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, data_nascimento: e.target.value})} />
              <input placeholder="WHATSAPP" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, whatsapp: e.target.value})} />
              <input placeholder="CIDADE / UF" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, cidade: e.target.value.toUpperCase()})} />
              <input placeholder="CEP" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, cep: e.target.value})} />
              <input placeholder="NOME DA LOJA" required className="md:col-span-2 p-3 bg-slate-50 dark:bg-black/20 border border-[#CD7F32]/30 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, nome_loja: e.target.value.toUpperCase()})} />
              <input type="email" placeholder="E-MAIL" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32] lowercase" onChange={e => setRegData({...regData, email: e.target.value})} />
              <input type="password" placeholder="SENHA" required className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={e => setRegData({...regData, password: e.target.value})} />
              <button className="md:col-span-2 w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all mt-4">FINALIZAR CADASTRO</button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" placeholder="E-MAIL" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="SENHA" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" onChange={(e) => setPassword(e.target.value)} required />
              <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all">ACESSAR PAINEL</button>
            </form>
          )}
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-8 text-[9px] font-black text-slate-400 hover:text-[#CD7F32] uppercase tracking-widest">{isRegistering ? "Já sou cadastrado" : "Quero ser vendedor"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors">
      
      {/* TOAST */}
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className={`${toast.type === 'success' ? 'bg-[#CD7F32]' : 'bg-red-600'} text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-white/10`}><CheckCircle2 size={14} /><p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p></div>
      </div>

      <nav className="bg-[#CD7F32] dark:bg-[#1E1E1E] text-white py-3 px-8 shadow-xl flex justify-between items-center transition-colors">
        <Link href="/"><img src="/logo.svg" alt="Duelo Store" className="h-8 md:h-10 w-auto brightness-0 invert dark:brightness-100 dark:invert-0" /></Link>
        <div className="flex items-center gap-6"><ThemeToggle /><Link href="/" className="text-[9px] font-black text-white/60 hover:text-white uppercase"><Home size={14}/></Link><button onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))} className="text-[9px] font-black text-white/40 hover:text-red-400 uppercase"><LogOut size={16}/></button></div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA - FORMULÁRIOS (SÓ 1 COLUNA) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-6 uppercase"><Settings size={16} className="inline mr-2"/> Minha Vitrine</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input placeholder="NOME DA LOJA" required className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32] uppercase" value={storeName} onChange={e => setStoreName(e.target.value.toUpperCase())} />
              <input placeholder="WhatsApp (55119...)" required className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" value={storeWhatsapp} onChange={e => setStoreWhatsapp(e.target.value)} />
              <input placeholder="CIDADE / UF" required className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32] uppercase" value={storeCity} onChange={e => setStoreCity(e.target.value.toUpperCase())} />
              <button className="w-full bg-slate-900 dark:bg-white/5 text-white py-2.5 rounded-sm font-black text-[9px] uppercase hover:bg-[#CD7F32]">Salvar Perfil</button>
            </form>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] p-5 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-6 uppercase"><PlusCircle size={16} className="inline mr-2"/> Anunciar</h2>
            <div className="space-y-5">
              <div className="flex gap-2">
                <input placeholder="NOME OU CÓDIGO" required className="flex-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-[10px] font-bold dark:text-white outline-[#CD7F32] uppercase" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value.toUpperCase()})} />
                <button type="button" onClick={handleAutoFill} disabled={isSearchingAPI} className="px-3 bg-[#CD7F32] text-white rounded-sm hover:bg-black transition-all">{isSearchingAPI ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}</button>
              </div>
              {availableImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {availableImages.map((img) => (
                    <button key={img.id} type="button" onClick={() => setNewCard({...newCard, image_url: img.image_url})} className={`flex-none w-12 aspect-[3/4] border-2 rounded-sm overflow-hidden transition-all ${newCard.image_url === img.image_url ? 'border-[#CD7F32] scale-105 shadow-lg' : 'border-transparent opacity-40'}`}><img src={img.image_url_small} className="w-full h-full object-contain" /></button>
                  ))}
                </div>
              )}
              {availableSets.length > 0 && (
                <select className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-[#CD7F32]/30 rounded-sm text-[10px] font-bold text-[#CD7F32] outline-none uppercase transition-all" value={newCard.edition} onChange={e => setNewCard({...newCard, edition: e.target.value.toUpperCase()})}>
                  {availableSets.map((set, idx) => ( <option key={idx} value={set.set_code}>{set.set_code} - {set.set_name.toUpperCase()}</option> ))}
                </select>
              )}
              <form onSubmit={handleAddCard} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <select className="p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-[#CD7F32] outline-none uppercase" value={newCard.category} onChange={e => setNewCard({...newCard, category: e.target.value})}>
                      <option value="MONSTRO MAIN">MAIN DECK</option><option value="MONSTRO EXTRA">EXTRA DECK</option><option value="MAGIA">MAGIA</option><option value="ARMADILHA">ARMADILHA</option>
                    </select>
                    <select className="p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-[#CD7F32] outline-none uppercase" value={newCard.sub_category} onChange={e => setNewCard({...newCard, sub_category: e.target.value})}>
                      {newCard.category === 'MAGIA' && <><option value="NORMAL">NORMAL</option><option value="CONTÍNUA">CONTÍNUA</option><option value="EQUIPAMENTO">EQUIPAMENTO</option><option value="QUICK-PLAY">QUICK-PLAY</option><option value="CAMPO">CAMPO</option></>}
                      {newCard.category === 'ARMADILHA' && <><option value="NORMAL">NORMAL</option><option value="CONTÍNUA">CONTÍNUA</option><option value="COUNTER">COUNTER</option></>}
                      {newCard.category === 'MONSTRO MAIN' && <><option value="EFEITO">EFEITO</option><option value="NORMAL">NORMAL</option><option value="RITUAL">RITUAL</option></>}
                      {newCard.category === 'MONSTRO EXTRA' && <><option value="FUSÃO">FUSÃO</option><option value="SINCRO">SINCRO</option><option value="XYZ">XYZ</option><option value="LINK">LINK</option></>}
                    </select>
                </div>
                <div className="flex items-center gap-2 py-1">
                   <input type="checkbox" id="pend" className="accent-[#CD7F32]" checked={newCard.is_pendulum} onChange={e => setNewCard({...newCard, is_pendulum: e.target.checked})} />
                   <label htmlFor="pend" className="text-[9px] font-black text-[#CD7F32] uppercase cursor-pointer">Pêndulo?</label>
                </div>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-[#CD7F32] outline-none uppercase" value={newCard.condition} onChange={e => setNewCard({...newCard, condition: e.target.value})}>
                  <option value="M">M (MINT)</option><option value="NM">NM (NEAR MINT)</option><option value="SP">SP (SLIGHTLY PLAYED)</option><option value="MP">MP (MODERATELY PLAYED)</option><option value="HP">HP (HEAVILY PLAYED)</option><option value="D">D (DAMAGED)</option>
                </select>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[9px] font-bold text-[#CD7F32] outline-none uppercase" value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}>
                   <option value="COMMON">COMMON</option>
                   <option value="RARE">RARE</option>
                   <option value="SUPER RARE">SUPER RARE</option>
                   <option value="ULTRA RARE">ULTRA RARE</option>
                   <option value="SECRET RARE">SECRET RARE</option>
                   <option value="ULTIMATE RARE">ULTIMATE RARE</option>
                   <option value="GHOST RARE">GHOST RARE</option>
                   <option value="GOLD RARE">GOLD RARE</option>
                   <option value="GOLD SECRET RARE">GOLD SECRET RARE</option>
                   <option value="PLATINUM RARE">PLATINUM RARE</option>
                   <option value="PLATINUM SECRET RARE">PLATINUM SECRET RARE</option>
                   <option value="STARLIGHT RARE">STARLIGHT RARE</option>
                   <option value="COLLECTOR'S RARE">COLLECTOR'S RARE</option>
                   <option value="PHARAOH'S RARE">PHARAOH'S RARE</option>
                   <option value="QUARTER CENTURY SECRET RARE">QUARTER CENTURY SECRET RARE</option>
                   <option value="PRISMATIC SECRET RARE">PRISMATIC SECRET RARE</option>
                   <option value="PRISMATIC COLLECTOR'S RARE">PRISMATIC COLLECTOR'S RARE</option>
                   <option value="STARFOIL RARE">STARFOIL RARE</option>
                   <option value="MOSAIC RARE">MOSAIC RARE</option>
                   <option value="SHATTERFOIL RARE">SHATTERFOIL RARE</option>
                   <option value="DUEL TERMINAL RARE">DUEL TERMINAL RARE</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                   <input type="number" step="0.01" placeholder="PREÇO" className="p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.price || ''} onChange={e => setNewCard({...newCard, price: parseFloat(e.target.value)})} />
                   <input type="number" placeholder="QTD" className="p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})} />
                </div>
                <button disabled={!profile} className="w-full bg-[#CD7F32] text-white py-3 rounded-sm font-black text-[9px] tracking-[0.2em] hover:bg-black disabled:opacity-50 uppercase">Publicar Card</button>
              </form>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA - TABELA DE ESTOQUE (3 COLUNAS) */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-sm border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex justify-between items-center">
              <h2 className="font-black text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase flex items-center gap-3"><Package size={16}/> Meu Estoque</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                    <th className="px-4 py-3">Card / Edição</th>
                    <th className="px-4 py-3 w-32 text-right">Estado</th>
                    <th className="px-4 py-3 w-32 text-right">Qtd</th>
                    <th className="px-4 py-3 w-32 text-right">Preço</th>
                    <th className="px-4 py-3 w-32 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartas.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 flex items-center gap-4">
                        <div className="w-8 h-12 bg-slate-100 dark:bg-black/40 p-1 rounded-sm shrink-0 flex items-center justify-center">{item.image_url ? <img src={item.image_url} className="w-full h-full object-contain" /> : <ImageIcon size={14} className="text-slate-300" />}</div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-xs uppercase dark:text-gray-100 truncate">{item.name}</span>
                          <span className="text-[9px] text-[#CD7F32] font-bold uppercase tracking-tighter">{item.edition} | {item.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select defaultValue={item.condition} onChange={(e) => updateCondition(item.id, e.target.value)} className="bg-transparent text-[10px] font-black text-[#CD7F32] uppercase outline-none cursor-pointer">
                          <option value="M">M</option><option value="NM">NM</option><option value="SP">SP</option><option value="MP">MP</option><option value="HP">HP</option><option value="D">D</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateStock(item.id, item.stock - 1)} className="text-slate-400 dark:text-white/20 hover:text-[#CD7F32]"><Minus size={12}/></button>
                          <span className="text-[11px] font-black min-w-[12px] text-center dark:text-white">{item.stock}</span>
                          <button onClick={() => updateStock(item.id, item.stock + 1)} className="text-[#CD7F32] hover:text-black dark:hover:text-white"><Plus size={12}/></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase italic">R$</span>
                          <input type="number" step="0.01" defaultValue={item.price} onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value))} className="w-16 bg-transparent text-right focus:border-[#CD7F32] text-[11px] font-black text-[#CD7F32] outline-none" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleActive(item.id, item.is_active)} className="text-slate-400 hover:text-[#CD7F32]">{item.is_active ? <Eye size={16} className="text-[#CD7F32]"/> : <EyeOff size={16}/>}</button>
                          <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </td>
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