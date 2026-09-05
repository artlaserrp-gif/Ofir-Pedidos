'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import NovoPedidoModal from '@/components/NovoPedidoModal';
import DespacharModal from '@/components/DespacharModal';
import MapaModal from '@/components/MapaModal';
import ConfiguracoesModal from '@/components/ConfiguracoesModal';
import PedidoCard from '@/components/PedidoCard';

export type Pedido = {
  id: string;
  origem: 'ifood' | 'balcao' | 'delivery_proprio' | 'cliente_online';
  numero_pedido: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  tipo_entrega: string;
  endereco_entrega: string | null;
  status: string;
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  entregador_id?: string | null;
  rastreio_token?: string | null;
  pedido_itens: { nome_produto: string; quantidade: number; preco_unitario: number }[];
};

const COLUNAS = [
  { chave: 'recebido', titulo: 'Em análise', corBarra: 'bg-orange-500', corFundo: 'bg-orange-50', corTexto: 'text-orange-900' },
  { chave: 'preparo', titulo: 'Em produção', corBarra: 'bg-amber-400', corFundo: 'bg-amber-50', corTexto: 'text-amber-900' },
  { chave: 'pronto', titulo: 'Pronto p/ entrega', corBarra: 'bg-emerald-500', corFundo: 'bg-emerald-50', corTexto: 'text-emerald-900' },
  { chave: 'saiu_entrega', titulo: 'Saiu p/ entrega', corBarra: 'bg-blue-500', corFundo: 'bg-blue-50', corTexto: 'text-blue-900' }
];

function tempoDecorrido(dataISO: string): string {
  const minutos = Math.floor((Date.now() - new Date(dataISO).getTime()) / 60000);
  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `há ${horas}h ${minutos % 60}min`;
}

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [pedidoDespachando, setPedidoDespachando] = useState<Pedido | null>(null);
  const [pedidoNoMapa, setPedidoNoMapa] = useState<Pedido | null>(null);
  const [busca, setBusca] = useState('');
  const [lojaNome, setLojaNome] = useState('');
  const [lojaAberta, setLojaAberta] = useState(true);
  const [tempoBalcao, setTempoBalcao] = useState('');
  const [tempoEntrega, setTempoEntrega] = useState('');
  const [, forcarAtualizacao] = useState(0);

  const buscarPedidos = useCallback(async () => {
    const res = await fetch('/api/pedidos');
    if (res.ok) {
      const data = await res.json();
      setPedidos(data.pedidos || []);
    }
    setCarregando(false);
  }, []);

  const buscarConfig = useCallback(async () => {
    const res = await fetch('/api/loja/configuracoes');
    if (res.ok) {
      const d = await res.json();
      setLojaNome(d.nome || '');
      setLojaAberta(d.aberto_manual !== false);
      setTempoBalcao(d.tempo_estimado_balcao || '');
      setTempoEntrega(d.tempo_estimado_entrega || '');
    }
  }, []);

  useEffect(() => {
    buscarPedidos();
    buscarConfig();
    const intervalo = setInterval(buscarPedidos, 10000);
    const intervaloRelogio = setInterval(() => forcarAtualizacao((n) => n + 1), 30000);
    return () => {
      clearInterval(intervalo);
      clearInterval(intervaloRelogio);
    };
  }, [buscarPedidos, buscarConfig]);

  async function alternarLojaAberta() {
    const novo = !lojaAberta;
    setLojaAberta(novo);
    await fetch('/api/loja/configuracoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aberto_manual: novo })
    });
  }

  async function avancarStatus(id: string, novoStatus: string) {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p)));
    const res = await fetch(`/api/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    if (!res.ok) buscarPedidos();
    else if (novoStatus === 'concluido' || novoStatus === 'cancelado') {
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function aceitarPedido(id: string) {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'recebido' } : p)));
    const res = await fetch(`/api/pedidos/${id}/aceitar`, { method: 'POST' });
    if (!res.ok) buscarPedidos();
  }

  async function simularPedidoIfood() {
    await fetch('/api/ifood/simular', { method: 'POST' });
    buscarPedidos();
  }

  const pedidosFiltrados = useMemo(() => {
    if (!busca.trim()) return pedidos;
    const termo = busca.trim().toLowerCase();
    return pedidos.filter(
      (p) => p.numero_pedido.includes(termo) || (p.cliente_nome || '').toLowerCase().includes(termo)
    );
  }, [pedidos, busca]);

  const pendentesDeAceite = pedidosFiltrados.filter((p) => p.status === 'pendente_aceite');

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24">
      {/* Barra superior */}
      <header className="sticky top-0 z-10 bg-white border-b border-black/5 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={alternarLojaAberta}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 flex items-center gap-1.5 transition ${
                lojaAberta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${lojaAberta ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {lojaAberta ? 'Loja aberta' : 'Fechada temporariamente'}
            </span>
            <span className="text-xs text-black/40 hidden sm:inline">{lojaNome}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simularPedidoIfood}
              className="text-xs bg-black/5 text-black/60 rounded-full px-3 py-1.5"
            >
              + Simular iFood
            </button>
            <button
              onClick={() => setConfigAberta(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-black/50 active:bg-black/5"
              aria-label="Configurações"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nº do pedido ou cliente"
              className="w-full bg-[#F4F5F7] border border-black/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-black/30"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 text-sm">🔍</span>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-navy text-white text-sm font-semibold rounded-xl px-4 py-2 whitespace-nowrap active:scale-95 transition"
          >
            + Novo pedido
          </button>
        </div>

        {(tempoBalcao || tempoEntrega) && (
          <div className="flex items-center gap-3 mt-2 text-[11px] text-black/40">
            {tempoBalcao && <span>Balcão: {tempoBalcao}</span>}
            {tempoEntrega && <span>Delivery: {tempoEntrega}</span>}
            <button onClick={() => setConfigAberta(true)} className="text-blue underline">
              Editar
            </button>
          </div>
        )}
      </header>

      {pendentesDeAceite.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <p className="text-red-600 text-xs font-semibold mb-2">
              ⏱ {pendentesDeAceite.length} pedido(s) aguardando aceite — confirme em até 8 min
            </p>
            <div className="space-y-2">
              {pendentesDeAceite.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5">
                  <span className="text-sm text-black/70">
                    #{p.numero_pedido} · R$ {p.valor_total?.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    onClick={() => aceitarPedido(p.id)}
                    className="bg-navy text-white text-xs font-semibold rounded-full px-3 py-1.5 active:scale-95 transition"
                  >
                    Aceitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {carregando ? (
        <p className="text-center text-black/30 mt-16">Carregando pedidos...</p>
      ) : (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pt-4">
          {COLUNAS.map((coluna) => {
            const pedidosDaColuna = pedidosFiltrados.filter((p) => p.status === coluna.chave);
            return (
              <div
                key={coluna.chave}
                className={`snap-center shrink-0 w-[86vw] max-w-sm rounded-2xl overflow-hidden ${coluna.corFundo}`}
              >
                <div className={`${coluna.corBarra} px-4 py-3 flex items-center justify-between`}>
                  <h2 className="font-semibold text-sm text-white">{coluna.titulo}</h2>
                  <span className="text-xs font-bold text-white bg-white/25 rounded-full w-6 h-6 flex items-center justify-center">
                    {pedidosDaColuna.length}
                  </span>
                </div>
                <div className="p-3 space-y-3 min-h-[300px]">
                  {pedidosDaColuna.length === 0 && (
                    <p className={`text-sm text-center py-10 opacity-50 ${coluna.corTexto}`}>Nenhum pedido</p>
                  )}
                  {pedidosDaColuna.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      tempoTexto={tempoDecorrido(pedido.created_at)}
                      onAvancar={avancarStatus}
                      onDespachar={setPedidoDespachando}
                      onVerMapa={setPedidoNoMapa}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <NovoPedidoModal
          onFechar={() => setModalAberto(false)}
          onCriado={() => {
            setModalAberto(false);
            buscarPedidos();
          }}
        />
      )}

      {pedidoDespachando && (
        <DespacharModal
          pedidoId={pedidoDespachando.id}
          numeroPedido={pedidoDespachando.numero_pedido}
          onFechar={() => setPedidoDespachando(null)}
          onDespachado={() => {
            setPedidoDespachando(null);
            buscarPedidos();
          }}
        />
      )}

      {pedidoNoMapa && (
        <MapaModal
          pedidoId={pedidoNoMapa.id}
          numeroPedido={pedidoNoMapa.numero_pedido}
          onFechar={() => setPedidoNoMapa(null)}
        />
      )}

      {configAberta && (
        <ConfiguracoesModal
          onFechar={() => {
            setConfigAberta(false);
            buscarConfig();
          }}
        />
      )}
    </div>
  );
}
