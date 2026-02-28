"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Loader2, TrendingUp, Users, ShoppingBag, BarChart3, Clock, MapPin, ShieldCheck 
} from 'lucide-react';

export default function MasterDashboard() {
  const [mounted, setMounted] = useState(false); // ESSENCIAL PARA O TEMA
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMoney: 0, totalOrders: 0, totalSellers: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  // 1. SINCRONIZAÇÃO DE TEMA
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. BUSCA DE DADOS MASTER
  useEffect(() => {
    async function fetchMasterData() {
      if (!mounted) return;
      setLoading(true);
      try {
        const { data: logsData } = await supabase
          .from('checkouts')
          .select('*, vendedor:vendedor_id(nome_loja, cidade)')
          .order('created_at', { ascending: false });

        if (logsData) {
          setLogs(logsData);
          const money = logsData.reduce((acc, curr) => acc + curr.valor_total, 0);
          setStats(prev => ({ ...prev, totalMoney: money, totalOrders: logsData.length }));

          const counts: any = {};
          logsData.forEach(log => {
            const nome = log.vendedor?.nome_loja || 'Vendedor Desconhecido';
            counts[nome] = (counts[nome] || 0) + log.valor_total;
          });
          const rankingArray = Object.entries(counts)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value);
          setRanking(rankingArray);
        }

        const { count } = await supabase.from('perfis').select('*', { count: 'exact', head: true });
        setStats(prev => ({ ...prev, totalSellers: count || 0 }));

      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    fetchMasterData();
  }, [mounted]);

  // Se não montou o tema, não renderiza para evitar erro de cor
  if (!mounted) return null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#121212]">
      <Loader2 className="animate-spin text-[#CD7F32]" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#121212] text-slate-900 dark:text-gray-200 font-sans transition-colors duration-500">
      
      {/* HEADER MASTER */}
      <header className="bg-white dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-white/5 py-6 px-6 md:px-12 mb-10 shadow-sm transition-colors">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#CD7F32]/10 rounded-lg">
              <ShieldCheck className="text-[#CD7F32]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-[0.3em] text-[#CD7F32]">Master <span className="text-slate-400 dark:text-white/20 font-light">Insights</span></h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel de Controle Administrativo</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 space-y-10">
        
        {/* CARDS DE RESUMO COM DARK MODE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl group hover:border-[#CD7F32]/30 transition-all">
             <TrendingUp className="text-[#CD7F32] mb-4 group-hover:scale-110 transition-transform" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Volume de Intenções</span>
             <span className="text-3xl font-black text-[#CD7F32]">R$ {stats.totalMoney.toFixed(2)}</span>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl group hover:border-[#CD7F32]/30 transition-all">
             <ShoppingBag className="text-[#CD7F32] mb-4 group-hover:scale-110 transition-transform" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total de Checkouts</span>
             <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalOrders}</span>
          </div>
          <div className="bg-white dark:bg-[#1E1E1E] p-8 border border-slate-200 dark:border-white/5 shadow-xl group hover:border-[#CD7F32]/30 transition-all">
             <Users className="text-[#CD7F32] mb-4 group-hover:scale-110 transition-transform" size={24} />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lojas Cadastradas</span>
             <span className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalSellers}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* RANKING COM CORES ADAPTATIVAS */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 dark:bg-black/10 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
              <BarChart3 size={18} className="text-[#CD7F32]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-white">Desempenho por Loja</h2>
            </div>
            <div className="p-6 space-y-6">
              {ranking.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-300 dark:text-white/10 group-hover:text-[#CD7F32] transition-colors">#0{idx + 1}</span>
                    <span className="text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[#CD7F32]">R$ {item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ATIVIDADE RECENTE COM DARK MODE NA TABELA */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 dark:bg-black/10 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
              <Clock size={18} className="text-[#CD7F32]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] dark:text-white">Últimas Intenções</h2>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-black/20 transition-colors">
                      <td className="p-4">
                        <p className="text-[10px] font-black uppercase text-slate-800 dark:text-gray-100 leading-tight">{log.vendedor?.nome_loja}</p>
                        <p className="text-[8px] text-slate-400 flex items-center gap-1 mt-1 font-bold"><MapPin size={8}/> {log.vendedor?.cidade || 'Brasil'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 italic">{log.itens}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-[#CD7F32]">R$ {log.valor_total.toFixed(2)}</span>
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