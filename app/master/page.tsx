"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Loader2, TrendingUp, Users, ShoppingBag, BarChart3, Clock, MapPin, ShieldCheck, Filter
} from 'lucide-react';

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  
  // Estatísticas calculadas
  const [stats, setStats] = useState({ totalMoney: 0, totalOrders: 0, totalSellers: 0 });
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchMasterData() {
      if (!mounted) return;
      setLoading(true);
      try {
        // 1. Busca TODOS os vendedores para o filtro
        const { data: perfisData } = await supabase.from('perfis').select('*').order('nome_loja');
        setVendedores(perfisData || []);

        // 2. Busca todos os logs de checkout
        const { data: logsData } = await supabase
          .from('checkouts')
          .select('*, vendedor:vendedor_id(nome_loja, cidade)')
          .order('created_at', { ascending: false });

        if (logsData) setLogs(logsData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchMasterData();
  }, [mounted]);

  // RE-CALCULA ESTATÍSTICAS SEMPRE QUE MUDAR O FILTRO OU OS LOGS
  useEffect(() => {
    const filtered = selectedSeller === 'all' 
      ? logs 
      : logs.filter(l => l.vendedor_id === selectedSeller);

    const money = filtered.reduce((acc, curr) => acc + curr.valor_total, 0);
    setStats({
      totalMoney: money,
      totalOrders: filtered.length,
      totalSellers: vendedores.length
    });

    // Ranking Geral (sempre mostra o ranking global das melhores lojas)
    const counts: any = {};
    logs.forEach(log => {
      const nome = log.vendedor?.nome_loja || 'Desconhecido';
      counts[nome] = (counts[nome] || 0) + log.valor_total;
    });
    const rankingArray = Object.entries(counts)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
    setRanking(rankingArray);

  }, [selectedSeller, logs, vendedores]);

  if (!mounted) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#121212]"><Loader2 className="animate-spin text-[#CD7F32]" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors duration-500">
      
      <header className="bg-white dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-white/5 py-6 px-6 md:px-12 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#CD7F32]/10 rounded-lg"><ShieldCheck className="text-[#CD7F32]" size={24} /></div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-[0.4em] text-[#CD7F32]">Master <span className="text-slate-400 dark:text-white/20 font-light">Insights</span></h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de Performance</p>
            </div>
          </div>

          {/* FILTRO POR VENDEDOR */}
          <div className="flex items-center gap-4 bg-slate-100 dark:bg-black/20 p-2 rounded-sm border border-slate-200 dark:border-white/5">
            <Filter size={14} className="text-[#CD7F32] ml-2" />
            <select 
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-[#CD7F32] cursor-pointer min-w-[200px]"
            >
              <option value="all">Todos os Vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nome_loja}</option>
              ))}
            </select>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 md:p-10 space-y-10">
        
        {/* CARDS DINÂMICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl">
             <TrendingUp className="text-[#CD7F32] mb-4" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Volume {selectedSeller === 'all' ? 'Geral' : 'da Loja'}</span>
             <span className="text-3xl font-black text-[#CD7F32]">R$ {stats.totalMoney.toFixed(2)}</span>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl">
             <ShoppingBag className="text-[#CD7F32] mb-4" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Checkouts</span>
             <span className="text-3xl font-black dark:text-white">{stats.totalOrders}</span>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl">
             <Users className="text-[#CD7F32] mb-4" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Lojas</span>
             <span className="text-3xl font-black dark:text-white">{stats.totalSellers}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* RANKING GLOBAL */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 dark:bg-black/10 border-b dark:border-white/5 flex items-center gap-3">
              <BarChart3 size={18} className="text-[#CD7F32]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Top Vendedores (Global)</h2>
            </div>
            <div className="p-6 space-y-6">
              {ranking.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-300 dark:text-white/10">#0{idx + 1}</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[#CD7F32]">R$ {item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TABELA FILTRADA */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 dark:bg-black/10 border-b dark:border-white/5 flex items-center gap-3">
              <Clock size={18} className="text-[#CD7F32]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Logs Filtrados</h2>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {logs
                    .filter(l => selectedSeller === 'all' ? true : l.vendedor_id === selectedSeller)
                    .map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                      <td className="p-4">
                        <p className="text-[10px] font-black uppercase leading-tight">{log.vendedor?.nome_loja}</p>
                        <p className="text-[8px] text-slate-400 mt-1 uppercase">{new Date(log.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[9px] text-slate-500 italic line-clamp-1">{log.itens}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-[#CD7F32]">R$ {log.valor_total.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <p className="p-10 text-center text-[10px] uppercase font-black opacity-20">Nenhum checkout registrado</p>}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}