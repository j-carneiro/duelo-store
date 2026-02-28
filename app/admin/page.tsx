"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  PlusCircle, Trash2, LogOut, Package, Home, 
  Eye, EyeOff, Loader2, Plus, Minus, Store, Settings
} from 'lucide-react';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null); // Dados da Loja
  
  // Estados de formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartas, setCartas] = useState<any[]>([]);

  // Estado para edição de perfil
  const [storeName, setStoreName] = useState('');
  const [storeWhatsapp, setStoreWhatsapp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Novo estado

  const [newCard, setNewCard] = useState({
    name: '', rarity: 'Secret Rare', condition: 'Near Mint', 
    lang: 'PT', image_url: '', is_active: true, stock: 1, price: 0, category: 'Monstro Main'
  });

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });

  if (error) {
    alert("Erro ao cadastrar: " + error.message);
  } else {
    alert("Conta criada com sucesso! Verifique seu e-mail se necessário ou tente logar.");
    setIsRegistering(false); // Volta para o login após cadastrar
  }
  setLoading(false);
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

  // BUSCAR PERFIL DO VENDEDOR
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setStoreName(data.nome_loja);
      setStoreWhatsapp(data.whatsapp);
    }
  }

  async function fetchCartas(userId: string) {
    const { data } = await supabase.from('cartas').select('*').eq('vendedor_id', userId).order('id', { ascending: false });
    setCartas(data || []);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else if (data?.user) {
      setUser(data.user);
      setIsLoggedIn(true);
      fetchProfile(data.user.id);
      fetchCartas(data.user.id);
    }
    setLoading(false);
  };

  // SALVAR OU ATUALIZAR PERFIL
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('perfis')
      .upsert({ 
        id: user.id, 
        nome_loja: storeName, 
        whatsapp: storeWhatsapp 
      });

    if (error) alert("Erro ao salvar perfil: " + error.message);
    else {
      alert("Perfil atualizado com sucesso!");
      fetchProfile(user.id);
    }
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return alert("Configure seu perfil primeiro!");
    const { error } = await supabase.from('cartas').insert([{ ...newCard, vendedor_id: user.id }]);
    if (error) alert(error.message);
    else {
      setNewCard({ ...newCard, name: '', image_url: '', stock: 1, price: 0 });
      fetchCartas(user.id);
    }
  };

  // ... (Funções de deletar, updateStock, updatePrice, updateCategory - Iguais ao anterior)
  const handleDelete = async (id: number) => { if (confirm("EXCLUIR?")) { await supabase.from('cartas').delete().eq('id', id); fetchCartas(user.id); } };
  const toggleActive = async (id: number, currentStatus: boolean) => { await supabase.from('cartas').update({ is_active: !currentStatus }).eq('id', id); fetchCartas(user.id); };
  const updateStock = async (id: number, ns: number) => { if (ns < 0) return; await supabase.from('cartas').update({ stock: ns }).eq('id', id); fetchCartas(user.id); };
  const updatePrice = async (id: number, np: number) => { await supabase.from('cartas').update({ price: np }).eq('id', id); fetchCartas(user.id); };
  const updateCategory = async (id: number, nc: string) => { await supabase.from('cartas').update({ category: nc }).eq('id', id); fetchCartas(user.id); };

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212] p-4 transition-colors duration-500">
        <div className="bg-white dark:bg-[#1E1E1E] p-10 rounded-sm shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/5">
          <div className="flex justify-center mb-8">
            <img src="/logo.svg" alt="Duelo Store" className="h-12 w-auto dark:brightness-100 brightness-0" />
          </div>
          
          <h2 className="text-xs font-black mb-8 text-center text-[#CD7F32] tracking-[0.3em] uppercase italic">
            {isRegistering ? "Criar Conta de Vendedor" : "Acesso do Vendedor"}
          </h2>

          <form onSubmit={isRegistering ? handleSignUp : handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="SEU MELHOR E-MAIL" 
              className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <input 
              type="password" 
              placeholder="SENHA (MÍN. 6 CARACTERES)" 
              className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]" 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            
            <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all uppercase">
              {loading ? "PROCESSANDO..." : isRegistering ? "CRIAR MINHA CONTA" : "LOGAR NO PAINEL"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[10px] font-bold text-slate-400 hover:text-[#CD7F32] transition-colors uppercase tracking-widest"
            >
              {isRegistering ? "Já tenho conta? Entrar" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans pb-20 transition-colors duration-500">
      <nav className="bg-white dark:bg-[#1E1E1E] py-3 px-8 mb-10 border-b border-slate-200 dark:border-white/5 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/"><img src="/logo.svg" alt="Duelo Store" className="h-8 md:h-10 w-auto dark:brightness-100 brightness-0" /></Link>
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-white/30 hover:text-[#CD7F32] transition-all uppercase"><Home size={14}/> Site Principal</Link>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <button onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))} className="text-[9px] font-black text-red-500 flex items-center gap-2 uppercase"><LogOut size={16}/> Sair</button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUNA ESQUERDA: CONFIGURAÇÃO DE PERFIL */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 flex items-center gap-3 uppercase">
              <Settings size={18}/> Configuração da Loja
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Nome da sua Vitrine</label>
                <input 
                  placeholder="Ex: Kaiba Corp Cards" required
                  className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]"
                  value={storeName} onChange={e => setStoreName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">WhatsApp de Vendas</label>
                <input 
                  placeholder="DDD + Número (ex: 11999999999)" required
                  className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]"
                  value={storeWhatsapp} onChange={e => setStoreWhatsapp(e.target.value)}
                />
              </div>
              <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all uppercase">
                {loading ? "SALVANDO..." : "ATUALIZAR DADOS DA LOJA"}
              </button>
            </form>
          </div>

          {/* CADASTRO DE CARTAS (Abaixo do perfil no mobile, ao lado no desk) */}
          <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl">
            <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 flex items-center gap-3 uppercase">
              <PlusCircle size={18}/> Novo Card
            </h2>
            {profile ? (
              <form onSubmit={handleAddCard} className="space-y-4">
                <input placeholder="Nome Oficial" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold dark:text-white outline-[#CD7F32]" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} />
                <input placeholder="URL da Imagem" required className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold dark:text-white outline-[#CD7F32]" value={newCard.image_url} onChange={e => setNewCard({...newCard, image_url: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                   <select className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-[#CD7F32]" value={newCard.category} onChange={e => setNewCard({...newCard, category: e.target.value})}>
                   <option value="Monstro Main">Monstro de Main</option>
                   <option value="Monstro Extra">Monstro de Extra</option>
                   <option value="Magia">Magia</option>
                   <option value="Armadilha">Armadilha</option>
                   <option value="Token">Token</option>
                   </select>
                   <select className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-[#CD7F32]" value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}>
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
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.01" placeholder="Preço" className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.price} onChange={e => setNewCard({...newCard, price: parseFloat(e.target.value)})} />
                  <input type="number" placeholder="Estoque" className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs font-bold text-[#CD7F32]" value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})} />
                </div>
                <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all">ANUNCIAR CARD</button>
              </form>
            ) : (
              <p className="text-xs text-slate-400 italic">Configure o nome da loja e WhatsApp ao lado para começar a anunciar.</p>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: TABELA DE GESTÃO (OCUPA 2 COLUNAS NO DESKTOP) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-sm border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex justify-between items-center">
              <h2 className="font-black text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase flex items-center gap-3">
                <Package size={16}/> Meu Estoque ({cartas.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[14px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                    <th className="p-6">Card</th>
                    <th className="p-6">Gestão</th>
                    <th className="p-6">Preço</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartas.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-4 flex items-center gap-4">
                        <div className="w-19.5 h-28 bg-slate-100 dark:bg-black/40 p-0.5 rounded-sm shrink-0"><img src={item.image_url} className="w-full h-full object-contain" /></div>
                        <div className="flex flex-col"><span className="font-bold text-m uppercase tracking-tight text-slate-800 dark:text-gray-200">{item.name}</span><span className="text-[12px] text-slate-400 dark:text-white/10 font-bold uppercase">{item.rarity}</span></div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-3">
                          <select defaultValue={item.category} onChange={(e) => updateCategory(item.id, e.target.value)} className="bg-transparent text-[9px] font-black text-[#CD7F32] uppercase outline-none">{['Monstro Main', 'Monstro Extra', 'Magia', 'Armadilha'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateStock(item.id, item.stock - 1)} className="text-slate-400 dark:text-white/20 hover:text-[#CD7F32]"><Minus size={14}/></button>
                            <span className="text-xs font-black min-w-[12px] text-center">{item.stock}</span>
                            <button onClick={() => updateStock(item.id, item.stock + 1)} className="text-[#CD7F32] hover:text-black dark:hover:text-white"><Plus size={14}/></button>
                          </div>
                        </div>
                      </td>
                      <td className="p-6"><div className="flex items-center gap-1"><span className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase italic">R$</span><input type="number" step="0.01" defaultValue={item.price} onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value))} className="w-16 bg-transparent border-b border-transparent focus:border-[#CD7F32] text-xs font-black text-[#CD7F32] outline-none transition-all" /></div></td>
                      <td className="p-6 text-right"><div className="flex justify-end gap-5"><button onClick={() => toggleActive(item.id, item.is_active)} className="text-slate-300 dark:text-white/20 hover:text-[#CD7F32]">{item.is_active ? <EyeOff size={18}/> : <Eye size={18}/>}</button><button onClick={() => handleDelete(item.id)} className="text-white/10 hover:text-red-500"><Trash2 size={18}/></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cartas.length === 0 && <p className="text-center py-20 text-[10px] text-slate-400 uppercase font-black tracking-widest">Nenhum card cadastrado</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}