"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle'; // Certifique-se que o caminho está correto
import { 
  PlusCircle, Trash2, LogOut, Package, Home, 
  Eye, EyeOff, Loader2, Plus, Minus
} from 'lucide-react';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartas, setCartas] = useState<any[]>([]);

  const [newCard, setNewCard] = useState({
    name: '', rarity: 'Secret Rare', condition: 'Near Mint', 
    lang: 'PT', image_url: '', is_active: true, stock: 1, price: 0, category: 'Monstro Main'
  });

  // 1. SINCRONIZAÇÃO DE TEMA (Essencial para não dar erro)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. VERIFICAÇÃO DE LOGIN E BUSCA DE DADOS
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        setIsLoggedIn(true);
        fetchCartas(data.user.id);
      }
    };
    if (mounted) checkUser();
  }, [mounted]);

  async function fetchCartas(userId: string) {
    const { data } = await supabase
      .from('cartas')
      .select('*')
      .eq('vendedor_id', userId) // Só busca as cartas DESTE vendedor
      .order('id', { ascending: false });
    setCartas(data || []);
  }

  // 3. FUNÇÕES DE GERENCIAMENTO
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Erro: " + error.message);
    } else if (data?.user) {
      setUser(data.user);
      setIsLoggedIn(true);
      fetchCartas(data.user.id);
    }
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cartas').insert([
      { ...newCard, vendedor_id: user.id } // Vincula automaticamente ao vendedor logado
    ]);
    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      setNewCard({ ...newCard, name: '', image_url: '', stock: 1, price: 0 });
      fetchCartas(user.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("EXCLUIR PERMANENTEMENTE?")) {
      await supabase.from('cartas').delete().eq('id', id);
      fetchCartas(user.id);
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from('cartas').update({ is_active: !currentStatus }).eq('id', id);
    fetchCartas(user.id);
  };

  const updateStock = async (id: number, newStock: number) => {
    if (newStock < 0) return;
    await supabase.from('cartas').update({ stock: newStock }).eq('id', id);
    fetchCartas(user.id);
  };

  const updatePrice = async (id: number, newPrice: number) => {
    await supabase.from('cartas').update({ price: newPrice }).eq('id', id);
    fetchCartas(user.id);
  };

  const updateCategory = async (id: number, newCat: string) => {
    await supabase.from('cartas').update({ category: newCat }).eq('id', id);
    fetchCartas(user.id);
  };

  // Se não montou o tema ainda, retorna vazio para evitar "piscada" de cor
  if (!mounted) return null;

  // TELA DE LOGIN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212] p-4 transition-colors duration-500">
        <form onSubmit={handleLogin} className="bg-white dark:bg-[#1E1E1E] p-10 rounded-sm shadow-2xl w-full max-w-md border border-slate-200 dark:border-white/5">
          <div className="flex justify-center mb-8">
             <img src="/logo.svg" alt="Duelo Store" className="h-12 w-auto dark:brightness-100 brightness-0 transition-all" />
          </div>
          <h2 className="text-xs font-black mb-8 text-center text-[#CD7F32] tracking-[0.3em] uppercase italic">Painel do Vendedor</h2>
          <div className="space-y-4">
            <input 
              type="email" placeholder="E-MAIL" 
              className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold outline-[#CD7F32] dark:text-white" 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="SENHA" 
              className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold outline-[#CD7F32] dark:text-white" 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all uppercase">
              {loading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // PAINEL PRINCIPAL
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans pb-20 transition-colors duration-500">
      
      {/* NAV ADM ADAPTATIVA */}
      <nav className="bg-white dark:bg-[#1E1E1E] py-3 px-8 mb-10 border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-2xl transition-colors">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/">
              <img src="/logo.svg" alt="Duelo Store" className="h-8 md:h-10 w-auto dark:brightness-100 brightness-0 transition-all" />
            </Link>
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 dark:text-white/30 hover:text-[#CD7F32] transition-all uppercase">
              <Home size={14}/> Site Principal
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <button 
              onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))}
              className="text-[9px] font-black tracking-widest text-red-500 hover:text-red-400 flex items-center gap-2 uppercase"
            >
              <LogOut size={16}/> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 flex flex-col gap-10">
        
        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-sm border border-slate-200 dark:border-white/5 shadow-xl transition-colors">
          <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 flex items-center gap-3 uppercase">
            <PlusCircle size={18}/> Novo Registro
          </h2>
          <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Nome Oficial</label>
              <input 
                placeholder="Ex: Dark Magician" required
                className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]"
                value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">URL da Imagem</label>
              <input 
                placeholder="Link da imagem..." required
                className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold dark:text-white outline-[#CD7F32]"
                value={newCard.image_url} onChange={e => setNewCard({...newCard, image_url: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Categoria</label>
              <select 
                className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.category} onChange={e => setNewCard({...newCard, category: e.target.value})}
              >
                <option value="Monstro Main">Monstro Main</option>
                <option value="Monstro Extra">Monstro Extra</option>
                <option value="Magia">Magia</option>
                <option value="Armadilha">Armadilha</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Raridade</label>
              <select className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}
              >
                <option value="Secret Rare">Secret Rare</option>
                <option value="Ultra Rare">Ultra Rare</option>
                <option value="Super Rare">Ultra Rare</option>
                <option value="Ultimate Rare">Ultimate Rare</option>
                <option value="Common">Common</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Preço (R$)</label>
              <input type="number" step="0.01" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.price} onChange={e => setNewCard({...newCard, price: parseFloat(e.target.value)})}
              />
            </div>

            <div>
              <label className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-2 block">Estoque</label>
              <input type="number" className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})}
              />
            </div>

            <button className="md:col-span-4 bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.4em] hover:bg-black transition-all shadow-xl uppercase">
              Adicionar ao Inventário
            </button>
          </form>
        </div>

        {/* TABELA DE GESTÃO */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-sm border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex justify-between items-center">
            <h2 className="font-black text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase flex items-center gap-3">
              <Package size={16}/> Meus Cards ({cartas.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                  <th className="p-6">Card</th>
                  <th className="p-6">Gestão</th>
                  <th className="p-6">Preço</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {cartas.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-6 flex items-center gap-4">
                      <div className="w-10 h-14 bg-slate-100 dark:bg-black/40 p-1 rounded-sm shrink-0">
                        <img src={item.image_url} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase tracking-tight">{item.name}</span>
                        <span className="text-[8px] text-slate-400 dark:text-white/10 font-bold uppercase">{item.rarity}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-3">
                        <select 
                          defaultValue={item.category}
                          onChange={(e) => updateCategory(item.id, e.target.value)}
                          className="bg-transparent text-[9px] font-black text-[#CD7F32] uppercase outline-none"
                        >
                          <option value="Monstro Main">Monstro Main</option>
                          <option value="Monstro Extra">Monstro Extra</option>
                          <option value="Magia">Magia</option>
                          <option value="Armadilha">Armadilha</option>
                        </select>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateStock(item.id, item.stock - 1)} className="text-slate-400 dark:text-white/20 hover:text-[#CD7F32]"><Minus size={14}/></button>
                          <span className="text-xs font-black min-w-[12px] text-center">{item.stock}</span>
                          <button onClick={() => updateStock(item.id, item.stock + 1)} className="text-[#CD7F32] hover:text-black dark:hover:text-white"><Plus size={14}/></button>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-300 dark:text-white/10 uppercase italic">R$</span>
                        <input 
                          type="number" step="0.01" defaultValue={item.price}
                          onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value))}
                          className="w-16 bg-transparent border-b border-transparent focus:border-[#CD7F32] text-xs font-black text-[#CD7F32] outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-5">
                        <button onClick={() => toggleActive(item.id, item.is_active)} className="text-slate-300 dark:text-white/20 hover:text-[#CD7F32] transition-colors">
                          {item.is_active ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-300 dark:text-white/10 hover:text-red-500 transition-colors">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}