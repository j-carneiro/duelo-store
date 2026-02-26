"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  PlusCircle, Trash2, LogOut, Package, Home, 
  Eye, EyeOff, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartas, setCartas] = useState<any[]>([]);

  const [newCard, setNewCard] = useState({
    name: '', rarity: 'Secret Rare', condition: 'Near Mint', 
    lang: 'PT', image_url: '', is_active: true, stock: 1, price: 0, category: 'Monstro Main'
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setIsLoggedIn(true);
        fetchCartas();
      }
    };
    checkUser();
  }, []);

  async function fetchCartas() {
    const { data } = await supabase.from('cartas').select('*').order('id', { ascending: false });
    setCartas(data || []);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erro: " + error.message);
    else setIsLoggedIn(true);
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('cartas').insert([newCard]);
    if (error) alert(error.message);
    else {
      setNewCard({ ...newCard, name: '', image_url: '', stock: 1, price: 0 });
      fetchCartas();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("EXCLUIR PERMANENTEMENTE?")) {
      await supabase.from('cartas').delete().eq('id', id);
      fetchCartas();
    }
  };

  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from('cartas').update({ is_active: !currentStatus }).eq('id', id);
    fetchCartas();
  };

  const updateStock = async (id: number, newStock: number) => {
    if (newStock < 0) return;
    await supabase.from('cartas').update({ stock: newStock }).eq('id', id);
    fetchCartas();
  };

  const updatePrice = async (id: number, newPrice: number) => {
    await supabase.from('cartas').update({ price: newPrice }).eq('id', id);
    fetchCartas();
  };

  const updateCategory = async (id: number, newCat: string) => {
    await supabase.from('cartas').update({ category: newCat }).eq('id', id);
    fetchCartas();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-[#1E1E1E] p-10 rounded-sm shadow-2xl w-full max-w-md border border-white/5">
          <h2 className="text-xl font-black mb-8 text-center text-[#CD7F32] tracking-[0.3em] uppercase italic">ADM <span className="text-white not-italic opacity-30">LOGIN</span></h2>
          <div className="space-y-4">
            <input 
              type="email" placeholder="E-MAIL" 
              className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold outline-[#CD7F32] text-white placeholder:text-white/10" 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="SENHA" 
              className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold outline-[#CD7F32] text-white placeholder:text-white/10" 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button className="w-full bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-[#A16207] transition-all uppercase">
              {loading ? "VERIFICANDO..." : "ENTRAR NO SISTEMA"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-20 selection:bg-[#CD7F32]">
      {/* NAV ADM */}
      <nav className="bg-[#CD7F32] dark:bg-[#1E1E1E] py-3 px-8 mb-10 shadow-2xl transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/">
              <img 
                src="/logo.svg" 
                alt="Duelo Store" 
                className="h-8 w-auto transition-all duration-300 brightness-0 invert dark:brightness-100 dark:invert-0" 
              />
            </Link>
            {/* ... restante do nav do admin ... */}
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-4 flex flex-col gap-10">
        
        {/* CADASTRO */}
        <div className="bg-[#1E1E1E] p-8 rounded-sm border border-white/5 shadow-xl">
          <h2 className="font-black text-[10px] tracking-[0.4em] text-[#CD7F32] mb-8 flex items-center gap-3 uppercase">
            <PlusCircle size={18}/> Novo Registro no Acervo
          </h2>
          <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">Nome Oficial da Carta</label>
              <input 
                placeholder="Ex: Dark Magician" required
                className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-white outline-[#CD7F32] placeholder:text-white/5"
                value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">URL da Imagem</label>
              <input 
                placeholder="Link .jpg ou .png" required
                className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-white outline-[#CD7F32] placeholder:text-white/5"
                value={newCard.image_url} onChange={e => setNewCard({...newCard, image_url: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">Categoria</label>
              <select 
                className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.category} onChange={e => setNewCard({...newCard, category: e.target.value})}
              >
                <option value="Monstro Main">Monstro Main</option>
                <option value="Monstro Extra">Monstro Extra</option>
                <option value="Magia">Magia</option>
                <option value="Armadilha">Armadilha</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">Raridade</label>
              <select className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}
              >
                <option value="Secret Rare">Secret Rare</option>
                <option value="Ultra Rare">Ultra Rare</option>
                <option value="Ultimate Rare">Ultimate Rare</option>
                <option value="Common">Common</option>
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">Preço (R$)</label>
              <input type="number" step="0.01" className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.price} onChange={e => setNewCard({...newCard, price: parseFloat(e.target.value)})}
              />
            </div>

            <div>
              <label className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 block">Qtd em Estoque</label>
              <input type="number" className="w-full p-3 bg-black/20 border border-white/5 rounded-sm text-xs font-bold text-[#CD7F32] outline-none"
                value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})}
              />
            </div>

            <button className="md:col-span-4 bg-[#CD7F32] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.4em] hover:bg-[#A16207] transition-all shadow-xl uppercase">
              Adicionar ao Inventário
            </button>
          </form>
        </div>

        {/* TABELA DE GESTÃO */}
        <div className="bg-[#1E1E1E] rounded-sm border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-black/10 flex justify-between items-center">
            <h2 className="font-black text-[10px] tracking-[0.3em] text-[#CD7F32] uppercase flex items-center gap-3">
              <Package size={16}/> Gestão de Estoque ({cartas.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="p-6">Card</th>
                  <th className="p-6">Categoria | Raridade</th>
                  <th className="p-6">Preço</th>
                  <th className="p-6">Estoque</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cartas.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6 flex items-center gap-4">
                      <div className="w-10 h-14 bg-black/40 p-1 rounded-sm shrink-0">
                        <img src={item.image_url} className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold text-xs text-gray-100 uppercase tracking-tight">{item.name}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
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
                        <span className="text-[8px] text-white/20 font-bold uppercase">{item.rarity} | {item.condition}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-bold text-white/10 uppercase italic">R$</span>
                        <input 
                          type="number" step="0.01" defaultValue={item.price.toFixed(2)}
                          onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value))}
                          className="w-16 bg-transparent border-b border-transparent focus:border-[#CD7F32] text-xs font-black text-[#CD7F32] outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateStock(item.id, item.stock - 1)} className="w-6 h-6 border border-white/10 hover:border-[#CD7F32] text-xs transition-all">-</button>
                        <span className="text-xs font-black text-white min-w-[12px] text-center">{item.stock}</span>
                        <button onClick={() => updateStock(item.id, item.stock + 1)} className="w-6 h-6 bg-[#CD7F32]/10 border border-[#CD7F32]/20 text-[#CD7F32] text-xs hover:bg-[#CD7F32] hover:text-white transition-all">+</button>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-5">
                        <button onClick={() => toggleActive(item.id, item.is_active)} className="text-white/20 hover:text-[#CD7F32] transition-colors">
                          {item.is_active ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-white/10 hover:text-red-500 transition-colors">
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