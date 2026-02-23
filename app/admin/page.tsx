"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  PlusCircle, 
  Trash2, 
  LogOut, 
  Package, 
  Home, 
  Eye, 
  EyeOff,
  Loader2
} from 'lucide-react';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartas, setCartas] = useState<any[]>([]);

  // Dados do formulário (incluindo Condition)
  const [newCard, setNewCard] = useState({
    name: '',
    rarity: 'Secret Rare', 
    condition: 'Near Mint',
    lang: 'PT',
    image_url: '',
    is_active: true,
    stock: 1
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
      setNewCard({ name: '',
        rarity: 'Secret Rare', 
        condition: 'Near Mint',
        lang: 'PT',
        image_url: '',
        is_active: true,
      stock: 1 });
      fetchCartas();
    }
  };

  // FUNÇÃO PARA EXCLUIR DEFINITIVAMENTE
  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja EXCLUIR esta carta permanentemente?")) {
      const { error } = await supabase.from('cartas').delete().eq('id', id);
      if (error) alert("Erro ao excluir");
      else fetchCartas();
    }
  };

    // 2. Nova função para atualizar o estoque rapidamente (+ ou -)
  const updateStock = async (id: number, newQuantity: number) => {
    if (newQuantity < 0) return; // Não permite estoque negativo
    const { error } = await supabase.from('cartas').update({ stock: newQuantity }).eq('id', id);
    if (!error) fetchCartas();
  };


  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from('cartas').update({ is_active: !currentStatus }).eq('id', id);
    fetchCartas();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E2E8F0] p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-sm shadow-2xl w-full max-w-md border-t-4 border-[#2D3E77]">
          <h2 className="text-xl font-black mb-8 text-center text-[#2D3E77] tracking-[0.2em] uppercase">ADM LOGIN</h2>
          <div className="space-y-4">
            <input 
              type="email" placeholder="E-MAIL" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold outline-[#2D3E77] text-black" 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" placeholder="SENHA" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold outline-[#2D3E77] text-black" 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button className="w-full bg-[#2D3E77] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.2em] hover:bg-black transition-all">
              {loading ? "AUTENTICANDO..." : "ACESSAR PAINEL"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E2E8F0] font-sans pb-20">
      {/* HEADER ADM - IGUAL A MAIN PAGE */}
      <nav className="bg-[#2D3E77] text-white py-4 px-8 mb-10 shadow-xl">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-black tracking-[0.2em]">YGO<span className="text-slate-400 font-light">STOCK</span> <span className="text-[10px] ml-2 opacity-50 uppercase">| Gestão</span></h1>
            <Link href="/" className="flex items-center gap-2 text-[10px] font-black tracking-widest bg-white/10 px-4 py-2 hover:bg-white hover:text-[#2D3E77] transition-all">
              <Home size={14}/> VOLTAR AO SITE
            </Link>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => setIsLoggedIn(false))}
            className="text-[10px] font-black tracking-widest text-red-400 hover:text-red-200 flex items-center gap-2"
          >
            <LogOut size={16}/> SAIR
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto p-4 flex flex-col gap-8">
        
        {/* FORMULÁRIO DE CADASTRO ESTILIZADO */}
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200">
          <h2 className="font-black text-xs tracking-[0.3em] text-[#2D3E77] mb-8 flex items-center gap-2 uppercase">
            <PlusCircle size={18}/> Novo Item no Estoque
          </h2>
          <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome da Carta</label>
              <input 
                placeholder="Ex: Blue-Eyes White Dragon" required
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-black outline-[#2D3E77]"
                value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">URL da Imagem</label>
              <input 
                placeholder="Link da foto..." required
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-black outline-[#2D3E77]"
                value={newCard.image_url} onChange={e => setNewCard({...newCard, image_url: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Raridade</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-[#2D3E77]"
                value={newCard.rarity} onChange={e => setNewCard({...newCard, rarity: e.target.value})}
              >
                <option value="Secret Rare">Secret Rare</option>
                <option value="Ultra Rare">Ultra Rare</option>
                <option value="Super Rare">Super Rare</option>
                <option value="Ultimate Rare">Ultimate Rare</option>
                <option value="Starlight Rare">Starlight Rare</option>
                <option value="Collector's Rare">Collector's Rare</option>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
              </select>
            </div>

            {/* NOVO CAMPO: ESTADO (CONDITION) */}
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Estado (Condition)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-[#2D3E77]"
                value={newCard.condition} onChange={e => setNewCard({...newCard, condition: e.target.value})}
              >
                <option value="Near Mint">Near Mint (NM)</option>
                <option value="Mint">Mint (M)</option>
                <option value="Lightly Played">Lightly Played (LP)</option>
                <option value="Played">Played (P)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Idioma</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-[#2D3E77]"
                value={newCard.lang} onChange={e => setNewCard({...newCard, lang: e.target.value})}
              >
                <option value="PT">Português (PT)</option>
                <option value="EN">Inglês (EN)</option>
                <option value="JP">Japonês (JP)</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Qtd em Estoque</label>
              <input 
                type="number" min="0"
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-sm text-xs font-bold text-black outline-[#2D3E77]"
                value={newCard.stock} onChange={e => setNewCard({...newCard, stock: parseInt(e.target.value)})}
                />
            </div>

            <button className="md:col-span-3 bg-[#2D3E77] text-white py-4 rounded-sm font-black text-[10px] tracking-[0.3em] hover:bg-black transition-all shadow-lg uppercase">
              Confirmar Cadastro no Sistema
            </button>
          </form>
        </div>

        {/* LISTA DE GERENCIAMENTO REESTILIZADA */}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-black text-[10px] tracking-[0.2em] text-[#2D3E77] uppercase flex items-center gap-2">
              <Package size={16}/> Estoque Atual ({cartas.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6">Card</th>
                  <th className="p-6">Raridade | Estado</th>
                  <th className="p-6">Estoque</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cartas.map(item => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors text-black group">
                    <td className="p-6 flex items-center gap-4">
                      <div className="w-10 h-14 bg-slate-100 p-1 flex-shrink-0">
                        <img src={item.image_url} className="w-full h-full object-contain" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-tight">{item.name}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#2D3E77]">{item.rarity}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{item.condition} | {item.lang}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateStock(item.id, item.stock - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-slate-200 hover:bg-slate-100 text-black font-bold"
                        > - </button>
                        <span className="text-xs font-black w-4 text-center">{item.stock}</span>
                        <button 
                          onClick={() => updateStock(item.id, item.stock + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-[#2D3E77] text-white font-bold"
                        > + </button>
                      </div>
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className={`text-[8px] font-black px-3 py-1 rounded-full border transition-all ${item.is_active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                      >
                        {item.is_active ? 'ATIVO NO SITE' : 'OCULTO'}
                      </button>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button 
                          onClick={() => toggleActive(item.id, item.is_active)}
                          className="text-slate-300 hover:text-[#2D3E77] transition-colors"
                          title={item.is_active ? "Ocultar" : "Mostrar"}
                        >
                          {item.is_active ? <EyeOff size={18}/> : <Eye size={18}/>}
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          title="Excluir Permanentemente"
                        >
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