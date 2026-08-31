'use client';

import { useEffect, useState } from 'react';
import { formatarDataHoraBrasil } from '@/lib/brazilTime';

const ORIGEM_COR: Record<string, string> = {
  ifood: 'text-red-400',
  balcao: 'text-gold',
  delivery_proprio: 'text-blue',
  cliente_online: 'text-green-400'
};

type Dados = {
  totalPedidos: number;
  faturamento: number;
  ticketMedio: number;
  cancelados: number;
  porOrigem: { origem: string; label: string; quantidade: number; valor: number }[];
  pedidosRecentes: { id: string; numero_pedido: string; origem: string; status: string; valor_total: number; cliente_nome: string | null; created_at: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  recebido: 'Em andamento',
  preparo: 'Em andamento',
  pronto: 'Em andamento',
  saiu_entrega: 'Em andamento',
  pendente_aceite: 'Aguardando aceite'
};

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<'hoje' | '7dias' | '30dias'>('7dias');
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    fetch(`/api/relatorios?periodo=${periodo}`)
      .then((r) => r.json())
      .then((d) => {
        setDados(d);
        setCarregando(false);
      });
  }, [periodo]);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <h1 className="font-bold text-lg">Relatórios</h1>
      </header>

      <div className="px-4 pt-4">
        <div className="flex gap-2 mb-5">
          {([
            { chave: 'hoje', texto: 'Hoje' },
            { chave: '7dias', texto: '7 dias' },
            { chave: '30dias', texto: '30 dias' }
          ] as const).map((op) => (
            <button
              key={op.chave}
              onClick={() => setPeriodo(op.chave)}
              className={`flex-1 rounded-lg py-2 text-sm border transition ${
                periodo === op.chave ? 'bg-gold text-navy border-gold font-semibold' : 'border-white/15 text-white/60'
              }`}
            >
              {op.texto}
            </button>
          ))}
        </div>

        {carregando || !dados ? (
          <p className="text-white/40 text-center mt-12">Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-navy2 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Faturamento</p>
                <p className="text-lg font-bold text-gold">
                  R$ {dados.faturamento.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="bg-navy2 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Pedidos concluídos</p>
                <p className="text-lg font-bold">{dados.totalPedidos}</p>
              </div>
              <div className="bg-navy2 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Ticket médio</p>
                <p className="text-lg font-bold">R$ {dados.ticketMedio.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="bg-navy2 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Cancelados</p>
                <p className="text-lg font-bold text-red-400">{dados.cancelados}</p>
              </div>
            </div>

            {dados.porOrigem.length > 0 && (
              <div className="mb-5">
                <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
                  Por origem
                </h2>
                <div className="bg-navy2 border border-white/10 rounded-xl divide-y divide-white/5">
                  {dados.porOrigem.map((o) => (
                    <div key={o.origem} className="flex items-center justify-between px-3 py-2.5">
                      <span className={`text-sm ${ORIGEM_COR[o.origem] || ''}`}>{o.label}</span>
                      <span className="text-xs text-white/40">{o.quantidade} pedido(s)</span>
                      <span className="text-sm font-medium">R$ {o.valor.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
                Pedidos recentes
              </h2>
              <div className="bg-navy2 border border-white/10 rounded-xl divide-y divide-white/5">
                {dados.pedidosRecentes.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-6">Nenhum pedido no período.</p>
                )}
                {dados.pedidosRecentes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm">
                        #{p.numero_pedido} {p.cliente_nome ? `· ${p.cliente_nome}` : ''}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {formatarDataHoraBrasil(p.created_at)} · {STATUS_LABEL[p.status] || p.status}
                      </p>
                    </div>
                    <span className="text-sm font-medium">R$ {p.valor_total.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
