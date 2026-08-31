'use client';

import { useEffect, useState, useCallback } from 'react';
import NovoPedidoModal from '@/components/NovoPedidoModal';
import DespacharModal from '@/components/DespacharModal';
import MapaModal from '@/components/MapaModal';
import ConfiguracoesModal from '@/components/ConfiguracoesModal';
import PedidoCard from '@/components/PedidoCard';

export type Pedido = {
  id: string;
  origem: 'ifood' | 'balcao' | 'delivery_proprio';
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

const COLUNAS: { chave: string; titulo: string }[] = [
  { chave: 'recebido', titulo: 'Recebido' },
  { chave: 'preparo', titulo: 'Em preparo' },
  { chave: 'pronto', titulo: 'Pronto' },
  { chave: 'saiu_entrega', titulo: 'Saiu p/ entrega' }
];

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [configAberta, setConfigAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [pedidoDespachando, setPedidoDespachando] = useState<Pedido | null>(null);
  const [pedidoNoMapa, setPedidoNoMapa] = useState<Pedido | null>(null);

  const buscarPedidos = useCallback(async () => {
    const res = await fetch('/api/pedidos');
    if (res.ok) {
      const data = await res.json();
      setPedidos(data.pedidos || []);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    buscarPedidos();
    const intervalo = setInterval(buscarPedidos, 10000); // atualiza a cada 10s
    return () => clearInterval(intervalo);
  }, [buscarPedidos]);

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

  const pendentesDeAceite = pedidos.filter((p) => p.status === 'pendente_aceite');

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">
          OFIR <span className="text-gold">Pedidos</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={simularPedidoIfood}
            className="text-xs bg-blue/20 text-blue border border-blue/40 rounded-full px-3 py-1.5 active:scale-95 transition"
          >
            + Simular iFood
          </button>
          <button
            onClick={() => setConfigAberta(true)}
            className="text-white/50 w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10 transition"
            aria-label="Configurações"
          >
            ⚙️
          </button>
        </div>
      </header>

      {pendentesDeAceite.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3">
            <p className="text-red-400 text-xs font-semibold mb-2">
              ⏱ {pendentesDeAceite.length} pedido(s) aguardando aceite — confirme em até 8 min
            </p>
            <div className="space-y-2">
              {pendentesDeAceite.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-navy2 rounded-xl px-3 py-2.5"
                >
                  <span className="text-sm">
                    #{p.numero_pedido} · R$ {p.valor_total?.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    onClick={() => aceitarPedido(p.id)}
                    className="bg-gold text-navy text-xs font-semibold rounded-full px-3 py-1.5 active:scale-95 transition"
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
        <p className="text-center text-white/40 mt-16">Carregando pedidos...</p>
      ) : (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pt-4">
          {COLUNAS.map((coluna) => {
            const pedidosDaColuna = pedidos.filter((p) => p.status === coluna.chave);
            return (
              <div
                key={coluna.chave}
                className="snap-center shrink-0 w-[88vw] max-w-sm bg-navy2 rounded-2xl border border-white/10 p-3"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-semibold text-sm">{coluna.titulo}</h2>
                  <span className="text-xs text-white/40 bg-white/5 rounded-full px-2 py-0.5">
                    {pedidosDaColuna.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {pedidosDaColuna.length === 0 && (
                    <p className="text-white/25 text-sm text-center py-8">Nenhum pedido</p>
                  )}
                  {pedidosDaColuna.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
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

      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-24 right-6 bg-gold text-navy font-bold rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg active:scale-95 transition"
      >
        +
      </button>

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

      {configAberta && <ConfiguracoesModal onFechar={() => setConfigAberta(false)} />}
    </div>
  );
}
