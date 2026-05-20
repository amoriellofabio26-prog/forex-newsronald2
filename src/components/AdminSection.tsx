import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Bell, 
  Save, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Coins,
  Send,
  Link
} from 'lucide-react';
import { motion } from 'motion/react';
import { api, handleResponse } from '../lib/api';
import { AIResult } from '../types';

export default function AdminSection() {
  // Sync states
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({ type: 'idle', text: '' });

  // AI lists and form states
  const [aiResults, setAiResults] = useState<AIResult[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [isAddingAI, setIsAddingAI] = useState(false);
  const [newAI, setNewAI] = useState<Partial<AIResult>>({
    name: '',
    source: '',
    logo: '',
    dailyReturn: 0,
    weeklyReturn: 0,
    currentMonthReturn: 0,
    yearCumulativeReturn: 0,
    maxDrawdown: 0,
    totalTradesMonth: 0,
    winRate: 0,
    status: 'Active',
    trackingUrl: '',
    isLive: true
  });

  // Notification states
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationPayload, setNotificationPayload] = useState({
    title: '',
    subtitle: '',
    body: '',
    url: ''
  });
  const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error' | 'idle'; text: string }>({ type: 'idle', text: '' });

  // Load IAs
  const loadAIResults = async () => {
    setIsLoadingAI(true);
    try {
      const data = await api.getAIResults();
      if (data && Array.isArray(data)) {
        setAiResults(data.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error("Error loading AI results for admin:", err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    loadAIResults();
  }, []);

  // Handle Sheet Sync
  const handleSheetSync = async () => {
    setIsSyncingSheet(true);
    setSyncMessage({ type: 'idle', text: '' });
    try {
      const response = await fetch('/api/admin/sync-sheet', { method: 'POST' });
      const data = await handleResponse(response);
      if (data && data.success) {
        setSyncMessage({ type: 'success', text: 'Planilha sincronizada e atualizada com sucesso no servidor!' });
        loadAIResults(); // Reload newly synced AIs
      } else {
        setSyncMessage({ type: 'error', text: 'Ocorreu um erro ao processar a resposta de sincronização.' });
      }
    } catch (err: any) {
      console.error("Sheet Sync error:", err);
      setSyncMessage({ type: 'error', text: `Falha na sincronização: ${err.message || String(err)}` });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Handle Add AI
  const handleAddAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAI.name) {
      alert("Nome da IA é obrigatório!");
      return;
    }

    try {
      const aiData: AIResult = {
        id: crypto.randomUUID(),
        name: newAI.name || 'Nova IA',
        source: newAI.source || 'Broker Desconhecido',
        logo: newAI.logo || `https://api.dicebear.com/7.x/bottts/svg?seed=${newAI.name}&backgroundColor=D4AF37`,
        dailyReturn: Number(newAI.dailyReturn) || 0,
        weeklyReturn: Number(newAI.weeklyReturn) || 0,
        currentMonthReturn: Number(newAI.currentMonthReturn) || 0,
        yearCumulativeReturn: Number(newAI.yearCumulativeReturn) || 0,
        maxDrawdown: Number(newAI.maxDrawdown) || 0,
        totalTradesMonth: Number(newAI.totalTradesMonth) || 0,
        winRate: Number(newAI.winRate) || 0,
        equityData: [100, 102, 105, 108, 110, 112, Number(newAI.currentMonthReturn) + 100],
        status: (newAI.status as any) || 'Active',
        trackingUrl: newAI.trackingUrl || '',
        lastSync: new Date().toLocaleTimeString('pt-BR'),
        isLive: !!newAI.isLive
      };

      await api.saveAIResult(aiData);
      setIsAddingAI(false);
      setNewAI({
        name: '',
        source: '',
        logo: '',
        dailyReturn: 0,
        weeklyReturn: 0,
        currentMonthReturn: 0,
        yearCumulativeReturn: 0,
        maxDrawdown: 0,
        totalTradesMonth: 0,
        winRate: 0,
        status: 'Active',
        trackingUrl: '',
        isLive: true
      });
      alert(`IA de Performance "${aiData.name}" adicionada com sucesso!`);
      loadAIResults();
    } catch (error: any) {
      console.error("Error saving AI:", error);
      alert(`Não foi possível salvar o robô: ${error.message || 'Erro de autenticação ou rede'}`);
    }
  };

  // Handle Delete AI
  const handleDeleteAI = async (id: string, name: string) => {
    if (!confirm(`Remover definitivamente os resultados históricos de "${name}"?`)) {
      return;
    }

    try {
      await api.deleteAIResult(id);
      setAiResults(prev => prev.filter(r => r.id !== id));
      alert(`IA "${name}" foi excluída com sucesso.`);
    } catch (err: any) {
      console.error("Error deleting AI:", err);
      alert(`Erro ao excluir: ${err.message || 'Permissão negada'}`);
    }
  };

  // Handle Send Push
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationPayload.title || !notificationPayload.body) {
      alert("Título e Mensagem física são campos obrigatórios para enviar pushes.");
      return;
    }

    setIsSendingNotification(true);
    setNotifMessage({ type: 'idle', text: '' });
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notificationPayload.title,
          subtitle: notificationPayload.subtitle,
          body: notificationPayload.body,
          url: notificationPayload.url || window.location.origin
        })
      });

      const data = await handleResponse(response);
      setNotifMessage({ 
        type: 'success', 
        text: 'Notificação instantânea Push enviada para todos os navegadores indexados com sucesso!' 
      });
      setNotificationPayload({ title: '', subtitle: '', body: '', url: '' });
    } catch (err: any) {
      console.error("Error sending push notification:", err);
      setNotifMessage({ 
        type: 'error', 
        text: `Erro ao disparar: ${err.message || String(err)}` 
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Overview Head */}
      <div className="pb-4 border-b border-border-dim flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[2px] flex items-center gap-2">
            <Save className="h-5 w-5 text-brand-gold" />
            Painel de Gestão Master
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
            Controle centralizado • Forex News
          </p>
        </div>
      </div>

      {/* Grid for Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Sync Planilha and Send Push */}
        <div className="space-y-8">
          
          {/* Card 1: Sync Planilha */}
          <section className="immersive-card">
            <div className="immersive-card-header">
              <span className="immersive-card-title flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-gold animate-pulse" />
                Sincronização de Dados via Sheets
              </span>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wide">
                Importe rendimentos de trading, taxas de vitórias e drawdowns em massa diretamente da planilha oficial de resultados do Ronald.
              </p>
              
              <div className="bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Chave Planilha Ativa</span>
                <span className="text-xs text-white break-all font-mono">1-tSXPOjS3jJKD6yxkk9tMyN4ZjXwB7Isbsd90xLj0aU</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSheetSync}
                  disabled={isSyncingSheet}
                  className="w-full flex items-center justify-center gap-3 bg-brand-gold hover:bg-opacity-90 disabled:opacity-50 text-bg-dark font-black tracking-wider py-4 px-6 rounded-xl text-xs uppercase cursor-pointer hover:scale-[1.01] active:scale-95 transition-all shadow-[0_5px_15px_rgba(212,175,55,0.1)]"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                  {isSyncingSheet ? 'Sincronizando...' : 'Sincronizar Planilha Agora'}
                </button>
              </div>

              {syncMessage.type !== 'idle' && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-2 border ${
                  syncMessage.type === 'success' 
                    ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' 
                    : 'bg-brand-red/10 border-brand-red/20 text-brand-red'
                }`}>
                  <div className="shrink-0 pt-0.5">
                    {syncMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <p className="font-medium">{syncMessage.text}</p>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Enviar Notificações */}
          <section className="immersive-card">
            <div className="immersive-card-header">
              <span className="immersive-card-title flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-gold animate-bounce" />
                Disparo de Notificações Push
              </span>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wide">
                Envie notificações push em tempo real para os navegadores e celulares de todos os membros cadastrados no PWA.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Título do Push</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Operação Iniciada: XAU/USD!"
                    value={notificationPayload.title}
                    onChange={(e) => setNotificationPayload({...notificationPayload, title: e.target.value})}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Subtítulo (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Alerta de High Impact no Ouro"
                    value={notificationPayload.subtitle}
                    onChange={(e) => setNotificationPayload({...notificationPayload, subtitle: e.target.value})}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Mensagem (Corpo)</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Digite o conteúdo da sua notificação..."
                    value={notificationPayload.body}
                    onChange={(e) => setNotificationPayload({...notificationPayload, body: e.target.value})}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Link de Destino URL (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: https://forexnews.therocketclub.site"
                    value={notificationPayload.url}
                    onChange={(e) => setNotificationPayload({...notificationPayload, url: e.target.value})}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSendingNotification}
                  className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-opacity-90 disabled:opacity-50 text-bg-dark font-black tracking-wider py-4 px-6 rounded-xl text-xs uppercase cursor-pointer transition-all shadow-[0_5px_15px_rgba(212,175,55,0.1)]"
                >
                  <Send className="h-4 w-4" />
                  {isSendingNotification ? 'Enviando...' : 'Enviar Push Instantâneo'}
                </button>
              </div>

              {notifMessage.type !== 'idle' && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-2 border ${
                  notifMessage.type === 'success' 
                    ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' 
                    : 'bg-brand-red/10 border-brand-red/20 text-brand-red'
                }`}>
                  <div className="shrink-0 pt-0.5">
                    {notifMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <p className="font-medium">{notifMessage.text}</p>
                </div>
              )}
            </form>
          </section>

        </div>

        {/* Right Column: Configurar IAs (Manager & Add Form) */}
        <div>
          
          <section className="immersive-card">
            <div className="immersive-card-header">
              <span className="immersive-card-title flex items-center gap-2">
                <Bot className="h-4 w-4 text-brand-gold" />
                Configurar & Adicionar Robôs de IA
              </span>
              <button
                type="button"
                onClick={() => setIsAddingAI(!isAddingAI)}
                className="bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20 border border-brand-gold/30 px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-widest transition-all"
              >
                {isAddingAI ? 'Ver Lista' : 'Adicionar Novo'}
              </button>
            </div>

            {isAddingAI ? (
              <form onSubmit={handleAddAI} className="p-6 space-y-4">
                <h4 className="text-xs font-black text-brand-gold uppercase tracking-widest">Novo Robô de Algoritmo</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Nome do Bot</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: XAU/USD Golden Boy"
                      value={newAI.name}
                      onChange={(e) => setNewAI({...newAI, name: e.target.value})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Fonte / Corretora</label>
                    <input 
                      type="text" 
                      placeholder="Ex: LIRUNEX Limited"
                      value={newAI.source}
                      onChange={(e) => setNewAI({...newAI, source: e.target.value})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Imagem Logo URL</label>
                    <input 
                      type="text" 
                      placeholder="Ex: https://image-url"
                      value={newAI.logo}
                      onChange={(e) => setNewAI({...newAI, logo: e.target.value})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Status</label>
                    <select
                      value={newAI.status}
                      onChange={(e) => setNewAI({...newAI, status: e.target.value as any})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    >
                      <option value="Active">Ativo (Active)</option>
                      <option value="Maintenance">Manutenção</option>
                      <option value="Beta">Versão Beta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Rendimento Diário (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 0.85"
                      value={newAI.dailyReturn}
                      onChange={(e) => setNewAI({...newAI, dailyReturn: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Rendimento Semanal (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 4.25"
                      value={newAI.weeklyReturn}
                      onChange={(e) => setNewAI({...newAI, weeklyReturn: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Rendimento Mensal (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 18.42"
                      value={newAI.currentMonthReturn}
                      onChange={(e) => setNewAI({...newAI, currentMonthReturn: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Acumulado Anual (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ex: 142.8"
                      value={newAI.yearCumulativeReturn}
                      onChange={(e) => setNewAI({...newAI, yearCumulativeReturn: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Max Drawdown (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="Ex: 4.8"
                      value={newAI.maxDrawdown}
                      onChange={(e) => setNewAI({...newAI, maxDrawdown: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Taxa de Vitória / Win Rate (%)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 87"
                      value={newAI.winRate}
                      onChange={(e) => setNewAI({...newAI, winRate: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Total Operações no Mês</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 28"
                      value={newAI.totalTradesMonth}
                      onChange={(e) => setNewAI({...newAI, totalTradesMonth: Number(e.target.value)})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Link de Rastreabilidade (Tracking URL)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: https://myfxbook.com"
                      value={newAI.trackingUrl}
                      onChange={(e) => setNewAI({...newAI, trackingUrl: e.target.value})}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-gold hover:bg-opacity-90 text-bg-dark font-black tracking-wider py-3.5 px-6 rounded-xl text-xs uppercase cursor-pointer text-center"
                  >
                    Salvar Robô IA
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAI(false)}
                    className="bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 font-bold px-6 py-3.5 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wide mb-2">
                  Robôs cadastrados no terminal. Use os controles para remover ou atualizar.
                </p>

                {isLoadingAI ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <RefreshCw className="h-5 w-5 text-brand-gold animate-spin" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Carregando robôs...</span>
                  </div>
                ) : aiResults.length === 0 ? (
                  <div className="text-center py-12 text-[#666] border border-dashed border-white/5 rounded-xl uppercase tracking-widest font-black text-xs">
                    Nenhuma IA de trading cadastrada
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {aiResults.map((ai) => (
                      <div 
                        key={ai.id}
                        className="flex items-center justify-between p-3.5 bg-[#161616] border border-white/5 rounded-xl hover:border-brand-gold/25 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={ai.logo} 
                            alt={ai.name} 
                            className="h-8 w-8 rounded bg-black flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate uppercase tracking-tight leading-tight">{ai.name}</h5>
                            <span className="text-[9px] text-[#888] font-mono block leading-none mt-0.5 uppercase tracking-wider truncate">
                              {ai.source} • Mês: <b className="text-brand-green">{ai.currentMonthReturn}%</b>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAI(ai.id, ai.name)}
                          className="p-2 text-gray-500 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-all"
                          title="Excluir Robô"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}
